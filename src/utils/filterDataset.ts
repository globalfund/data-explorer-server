import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import fs from 'fs';
import _ from 'lodash';

dayjs.extend(customParseFormat);

export type SortOption = {
  column: string;
  order: 'asc' | 'desc';
};

type DataType =
  | 'string'
  | 'number'
  | {
      type: 'date';
      dateFormat: string;
    };

type DataTypes = Record<string, DataType>;

function getSortableValue(
  item: Record<string, any>,
  column: string,
  dataTypes: DataTypes,
) {
  const value = item[column];
  const dataType = dataTypes[column];

  if (value == null) return null;

  if (dataType === 'number') {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  }

  if (dataType === 'string') {
    return String(value).toLowerCase();
  }

  if (typeof dataType === 'object' && dataType.type === 'date') {
    const parsedDate = dayjs(String(value), dataType.dateFormat, true);

    return parsedDate.isValid() ? parsedDate.valueOf() : null;
  }

  return value;
}

function sortData(
  parsedDataset: Record<string, any>[],
  sortOptions: SortOption[],
  dataTypes: DataTypes,
) {
  if (!Array.isArray(sortOptions) || sortOptions.length === 0) {
    return parsedDataset;
  }

  return _.orderBy(
    parsedDataset,
    sortOptions.map(option => {
      return item => getSortableValue(item, option.column, dataTypes);
    }),
    sortOptions.map(option => option.order),
  );
}

function filterData(
  parsedDataset: any[],
  appliedFilters: Record<string, any[]>,
) {
  const cleanedFilters = {...(appliedFilters || {})};

  Object.keys(cleanedFilters).forEach(key => {
    if (!Array.isArray(cleanedFilters[key])) {
      throw new Error(`Filter for key ${key} must be an array`);
    }

    if (cleanedFilters[key].length === 0) {
      delete cleanedFilters[key];
    }
  });

  const filterKeys = Object.keys(cleanedFilters);

  if (filterKeys.length === 0) return parsedDataset;

  return _.filter(parsedDataset, item => {
    return filterKeys.every(filterKey =>
      cleanedFilters[filterKey].includes(item[filterKey]),
    );
  });
}

function filterAndSortData(
  parsedDataset: any[],
  appliedFilters: Record<string, any[]>,
  sortOptions: SortOption[],
  dataTypes: DataTypes,
) {
  const filteredData = filterData(parsedDataset, appliedFilters);

  return sortData(filteredData, sortOptions, dataTypes);
}

function getDatasetFilterOptions(
  dataset: any[],
  dataTypes: DataTypes,
  onlyKeys: boolean,
  appliedFilters: any,
) {
  const filterOptions: any[] = [];
  if (!dataset || dataset.length === 0) return filterOptions;

  // Extract the keys from dataset, excluding certain ones
  const itemKeys = Object.keys(dataset[0]).filter(
    key =>
      key !== 'id' &&
      !key.toLowerCase().includes('amount') &&
      !key.toLowerCase().includes('date') &&
      !key.toLowerCase().includes('number') &&
      !key.toLowerCase().includes('title'),
  );

  if (onlyKeys) return itemKeys;

  // First, filter the dataset based on the applied filters **once**

  // Now, calculate filter options for each key based on the filtered dataset
  itemKeys.forEach(key => {
    // Get potential options: if this key wasn't selected, how many are available?
    const potentialGroupedMap = new Map();
    const relaxedFilters = {...appliedFilters};
    delete relaxedFilters[key]; // Temporarily remove the current key from filters

    const relaxedDataset = filterData(dataset, relaxedFilters);
    relaxedDataset.forEach(item => {
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') {
        if (!potentialGroupedMap.has(value)) {
          potentialGroupedMap.set(value, 0);
        }
        potentialGroupedMap.set(value, potentialGroupedMap.get(value) + 1);
      }
    });

    const potentialOptionsWithContent = [];
    for (const [optionKey, count] of potentialGroupedMap.entries()) {
      const option =
        dataTypes[key] === 'number' ? Number(optionKey) : optionKey;
      if (count > 0) {
        potentialOptionsWithContent.push({name: option, count: count});
      }
    }

    if (potentialOptionsWithContent.length > 0) {
      filterOptions.push({
        name: key,
        enabled: true,
        options: _.orderBy(
          _.uniqBy(potentialOptionsWithContent, 'name').map(o => ({
            label: o.name,
            value: o.name,
            count: o.count,
          })),
          'label',
          dataTypes[key] === 'number' ? 'desc' : 'asc',
        ),
      });
    }
  });

  return filterOptions;
}

const getDataset = async (datasetId: string) => {
  let parsed = null;
  try {
    const filePath =
      process.env.PARSED_DATA_FILES_PATH ||
      `../data-explorer.backend/parsed-data-files/`;
    const parsedData = fs.readFileSync(`${filePath}${datasetId}.json`);

    return JSON.parse(parsedData.toString());
  } catch (error) {
    console.log('Error reading parsed data file', error);
    return null;
  }
};

export async function getFilterOptions(datasetDetails: {
  appliedFilters: any;
  datasetId: string;
}) {
  try {
    const parsed = await getDataset(datasetDetails.datasetId);
    if (!parsed) {
      throw new Error('Dataset not found');
    }
    const initialParsedDataset = parsed.dataset;

    return getDatasetFilterOptions(
      initialParsedDataset,
      parsed.dataTypes,
      false,
      datasetDetails.appliedFilters,
    );
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function filterDataset(datasetDetails: {
  appliedFilters: Record<string, any[]>;
  sortOptions: SortOption[];
  datasetId: string;
  page?: string;
  pageSize?: string;
}) {
  try {
    const parsed = await getDataset(datasetDetails.datasetId);
    if (!parsed) {
      throw new Error('Dataset not found');
    }
    const initialParsedDataset = parsed.dataset;
    let filteredDataset = initialParsedDataset;

    if (
      !_.isEmpty(datasetDetails.appliedFilters) ||
      !_.isEmpty(datasetDetails.sortOptions)
    ) {
      filteredDataset = filterAndSortData(
        initialParsedDataset,
        datasetDetails.appliedFilters,
        datasetDetails.sortOptions,
        parsed.dataTypes,
      );
    }
    const page = datasetDetails.page ? parseInt(datasetDetails.page, 10) : 1;
    const pageSize = datasetDetails.pageSize
      ? parseInt(datasetDetails.pageSize, 10)
      : undefined;

    const start = pageSize ? (page - 1) * pageSize : 0;
    const end = pageSize ? start + pageSize : undefined;

    return {
      result: filteredDataset.slice(start, end),
      count: filteredDataset.length,
    };
  } catch (e) {
    console.log(e);
    return {
      result: [],
      count: 0,
    };
  }
}

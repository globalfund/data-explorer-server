import _ from 'lodash';
import {FilterGroup} from '../../interfaces/filters';

export function getDatasetFilterOptions(dataset: any): FilterGroup[] {
  const filterOptions: FilterGroup[] = [];
  const itemKeys = _.filter(Object.keys(dataset[0]), key => {
    return (
      key !== 'id' &&
      !key.toLowerCase().includes('amount') &&
      !key.toLowerCase().includes('date') &&
      !key.toLowerCase().includes('number') &&
      !key.toLowerCase().includes('title')
    );
  });

  itemKeys.forEach(key => {
    const options = _.filter(
      Object.keys(_.groupBy(dataset, key)),
      (optionKey: string) =>
        optionKey !== 'undefined' && optionKey !== 'null' && optionKey !== '',
    );
    const name = key;

    if (options.length > 0) {
      filterOptions.push({
        name,
        enabled: true,
        options: _.orderBy(
          _.uniq(options).map((o: string) => ({
            label: o,
            value: o,
          })),
          'label',
          'asc',
        ),
      });
    }
  });

  return filterOptions;
}

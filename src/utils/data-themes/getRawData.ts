import axios, {AxiosPromise, AxiosResponse} from 'axios';
import _ from 'lodash';
import generic from '../../config/mapping/data-themes/raw-data/generic.json';
import {formatRawData} from '../../utils/data-themes/formatRawData';
import {getDatasetFilterOptions} from '../../utils/data-themes/getDatasetFilterOptions';
import {handleDataApiError} from '../../utils/dataApiError';

export function getRawData(
  baseUrl: string,
  rows: string,
  mappingConfig: any,
): object {
  const calls: AxiosPromise[] = [];
  const rowsInt = parseInt(rows, 10);
  if (rowsInt > 1000) {
    const reps = Math.ceil(rowsInt / 1000);
    for (let i = 0; i < reps; i++) {
      const skip = i * 1000;
      let localRows = 1000;
      if (i === reps - 1) {
        localRows = rowsInt - i * 1000;
      }
      calls.push(
        axios.get(
          `${baseUrl}&${generic.withcount}&$skip=${skip}&${generic.rows}${localRows}`,
        ),
      );
    }
  } else {
    calls.push(
      axios.get(`${baseUrl}&${generic.withcount}&${generic.rows}${rows}`),
    );
  }
  return Promise.all(calls)
    .then((responses: AxiosResponse[]) => {
      let data: {[key: string]: string | number | boolean}[] = [];
      responses.forEach((res: AxiosResponse) => {
        data = [
          ...data,
          ..._.get(res.data, mappingConfig.dataPath, []).map(formatRawData),
        ];
      });
      const filterOptionGroups = getDatasetFilterOptions(data);
      return {
        data,
        filterOptionGroups,
        count: _.get(responses[0].data, generic.countField, data.length),
      };
    })
    .catch(handleDataApiError);
}

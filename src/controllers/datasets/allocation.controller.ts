import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import fs from 'fs-extra';
import querystring from 'querystring';
import filtering from '../../config/filtering/index.json';
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';
import {getFilterString} from '../../utils/filtering/allocations/getFilterString';

const ALLOCATIONS_RESPONSE: ResponseObject = {
  description: 'Allocations Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'AllocationsResponse',
        properties: {
          data: {
            type: 'object',
            properties: {
              total: {type: 'number'},
              values: {type: 'array', items: {type: 'number'}},
              keys: {type: 'array', items: {type: 'string'}},
              colors: {type: 'array', items: {type: 'string'}},
            },
          },
        },
      },
    },
  },
};
export class AllocationsDatasetController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/allocations-dataset')
  @response(200, ALLOCATIONS_RESPONSE)
  allocationsTable(): object {
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );

    const url = `${urls.allocations}`;
    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        const dataSlice = data.slice(0, 300);

        // console.log(resp.data.value, 'resp');
        const sample = dataSlice.map((item: any) => {
          const tempItem = {
            ...item,
          };
          delete tempItem['component'];
          delete tempItem['geographicArea'];
          delete tempItem['allocationId'];
          delete tempItem['geographicAreaId'];
          delete tempItem['componentId'];
          return tempItem;
        });
        console.log(data, 'sample');

        const element = sample[0];
        Object.keys(element).forEach(key => {
          if (element[key]) {
            filterOptionGroups.push(key);

            dataTypes = {
              ...dataTypes,
              [key]: typeof element[key],
            };
          }
        });

        const body = {
          count: resp.data.value.length,
          dataset: sample,
          sample,
          dataTypes,
          errors: [],
          filterOptionGroups,
          stats: [],
        };
        fs.writeFileSync(
          `./src/parsed-data-files/allocations-dataset.json`,
          JSON.stringify(body, null, 4),
        );

        return body;
      })
      .catch(handleDataApiError);
  }
}

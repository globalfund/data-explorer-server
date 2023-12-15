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
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';

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
  allocations(): object {
    return axios
      .get(urls.allocations)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        const dataSlice = data.slice(0, 300);

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

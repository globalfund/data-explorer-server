import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import fs from 'fs-extra';

import axios, {AxiosResponse} from 'axios';
import querystring from 'querystring';
import filtering from '../../config/filtering/index.json';
import AllocationsFieldsMapping from '../../config/mapping/allocations/index.json';
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

    const url = `${urls.allocations}/?${params}${filterString}&${AllocationsFieldsMapping.allocationsTableExpand}`;
    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        const element = data[0];
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
          dataset: resp.data.value,
          sample: resp.data.value,
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

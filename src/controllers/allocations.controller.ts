import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError, AxiosResponse} from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import AllocationsFieldsMapping from '../config/mapping/allocations/index.json';
import urls from '../config/urls/index.json';
import {getFilterString} from '../utils/filtering/allocations/getFilterString';

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

export class AllocationsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/allocations')
  @response(200, ALLOCATIONS_RESPONSE)
  allocations(): object {
    const filterString = getFilterString(
      this.req.query,
      AllocationsFieldsMapping.allocationsAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.allocations}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.orderBy(
          _.get(resp.data, AllocationsFieldsMapping.dataPath, []),
          AllocationsFieldsMapping.amount,
          'desc',
        );
        return {
          data: {
            total: _.sumBy(rawData, 'amount'),
            values: rawData.map((item: any) =>
              _.get(item, AllocationsFieldsMapping.amount),
            ),
            keys: rawData.map((item: any) =>
              _.get(item, AllocationsFieldsMapping.component),
            ),
            colors: rawData.map((item: any) =>
              _.get(
                AllocationsFieldsMapping.componentColors,
                _.get(item, AllocationsFieldsMapping.component),
                '',
              ),
            ),
          },
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

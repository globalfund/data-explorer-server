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
import AllocationsDrilldownFieldsMapping from '../config/mapping/allocations/drilldown.json';
import AllocationsFieldsMapping from '../config/mapping/allocations/index.json';
import urls from '../config/urls/index.json';
import {AllocationsTreemapDataItem} from '../interfaces/allocations';
import {getFilterString} from '../utils/filtering/allocations/getFilterString';
import {formatFinancialValue} from '../utils/formatFinancialValue';

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
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/allocations/drilldown')
  @response(200, ALLOCATIONS_RESPONSE)
  allocationsDrilldown(): object {
    const filterString = getFilterString(
      this.req.query,
      AllocationsDrilldownFieldsMapping.aggregation,
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
        const rawData = _.get(
          resp.data,
          AllocationsDrilldownFieldsMapping.dataPath,
          [],
        );
        const levelComponent = _.get(
          rawData,
          `[0].${AllocationsDrilldownFieldsMapping.component}`,
          '',
        );
        const value = _.sumBy(
          rawData,
          AllocationsDrilldownFieldsMapping.amount,
        );
        const data: AllocationsTreemapDataItem[] = [
          {
            name: levelComponent,
            value,
            formattedValue: formatFinancialValue(value),
            color: '#DFE3E5',
            _children: _.orderBy(
              rawData.map((item: any) => ({
                name: _.get(
                  item,
                  AllocationsDrilldownFieldsMapping.locationName,
                  '',
                ),
                value: _.get(item, AllocationsDrilldownFieldsMapping.amount, 0),
                formattedValue: formatFinancialValue(
                  _.get(item, AllocationsDrilldownFieldsMapping.amount, 0),
                ),
                color: '#70777E',
                tooltip: {
                  header: levelComponent,
                  componentsStats: [
                    {
                      name: _.get(
                        item,
                        AllocationsDrilldownFieldsMapping.locationName,
                        '',
                      ),
                      value: _.get(
                        item,
                        AllocationsDrilldownFieldsMapping.amount,
                        0,
                      ),
                    },
                  ],
                  value: _.get(
                    item,
                    AllocationsDrilldownFieldsMapping.amount,
                    0,
                  ),
                },
              })),
              'value',
              'desc',
            ),
            tooltip: {
              header: levelComponent,
              value,
              componentsStats: [
                {
                  name: levelComponent,
                  value,
                },
              ],
            },
          },
        ];
        return {
          data,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

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
import AllocationsGeomapFieldsMapping from '../config/mapping/allocations/geomap.json';
import AllocationsFieldsMapping from '../config/mapping/allocations/index.json';
import AllocationsPeriodsFieldsMapping from '../config/mapping/allocations/periods.json';
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

  @get('/allocations/periods')
  @response(200, ALLOCATIONS_RESPONSE)
  allocationsPeriods(): object {
    const filterString = getFilterString(
      this.req.query,
      AllocationsPeriodsFieldsMapping.aggregation,
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
        return {
          data: _.get(
            resp.data,
            AllocationsPeriodsFieldsMapping.dataPath,
            [],
          ).map(
            (item: any) =>
              `${_.get(
                item,
                AllocationsPeriodsFieldsMapping.periodStart,
                '',
              )} - ${_.get(
                item,
                AllocationsPeriodsFieldsMapping.periodEnd,
                '',
              )}`,
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
                name:
                  _.get(
                    item,
                    AllocationsDrilldownFieldsMapping.multicountry,
                    null,
                  ) ??
                  _.get(
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
                      name:
                        _.get(
                          item,
                          AllocationsDrilldownFieldsMapping.multicountry,
                          null,
                        ) ??
                        _.get(
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

  @get('/allocations/geomap')
  @response(200, ALLOCATIONS_RESPONSE)
  geomap(): object {
    const filterString = getFilterString(
      this.req.query,
      AllocationsGeomapFieldsMapping.aggregation,
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
      .all([
        axios.get(url),
        // TODO: check how to serve static geojson in-app
        axios.get('https://the.data.explorer.nyuki.io/static/simple.geo.json'),
      ])
      .then(
        axios.spread((...responses) => {
          const geoJSONData = responses[1].data.features;
          const data: any = [];
          const groupedDataByLocation = _.groupBy(
            responses[0].data.value,
            AllocationsGeomapFieldsMapping.locationCode,
          );
          Object.keys(groupedDataByLocation).forEach((iso3: string) => {
            const dataItems = groupedDataByLocation[iso3];
            const locationComponents: any = [];
            dataItems.forEach((item: any) => {
              locationComponents.push({
                name: _.get(item, AllocationsGeomapFieldsMapping.component, ''),
                value: item[AllocationsGeomapFieldsMapping.amount],
              });
            });
            data.push({
              code: iso3,
              components: locationComponents,
              value: _.sumBy(locationComponents, 'value'),
            });
          });
          const maxValue: number = _.max(data.map((d: any) => d.value)) ?? 0;
          let interval = 0;
          if (maxValue) {
            interval = maxValue / 13;
          }
          const intervals: number[] = [];
          for (let i = 0; i < 13; i++) {
            intervals.push(interval * i);
          }
          const features = geoJSONData.map((feature: any) => {
            const fItem = _.find(data, {code: feature.id});
            let itemValue = 0;
            if (fItem) {
              if (
                (fItem.value < maxValue || fItem.value === maxValue) &&
                (fItem.value >= intervals[11] || fItem.value === intervals[11])
              ) {
                itemValue = 12;
              }
              if (
                (fItem.value < intervals[11] ||
                  fItem.value === intervals[11]) &&
                (fItem.value >= intervals[10] || fItem.value === intervals[10])
              ) {
                itemValue = 11;
              }
              if (
                (fItem.value < intervals[10] ||
                  fItem.value === intervals[10]) &&
                (fItem.value >= intervals[9] || fItem.value === intervals[9])
              ) {
                itemValue = 10;
              }
              if (
                (fItem.value < intervals[9] || fItem.value === intervals[9]) &&
                (fItem.value >= intervals[8] || fItem.value === intervals[8])
              ) {
                itemValue = 9;
              }
              if (
                (fItem.value < intervals[8] || fItem.value === intervals[8]) &&
                (fItem.value >= intervals[7] || fItem.value === intervals[7])
              ) {
                itemValue = 8;
              }
              if (
                (fItem.value < intervals[7] || fItem.value === intervals[7]) &&
                (fItem.value >= intervals[6] || fItem.value === intervals[6])
              ) {
                itemValue = 7;
              }
              if (
                (fItem.value < intervals[6] || fItem.value === intervals[6]) &&
                (fItem.value >= intervals[5] || fItem.value === intervals[5])
              ) {
                itemValue = 6;
              }
              if (
                (fItem.value < intervals[5] || fItem.value === intervals[5]) &&
                (fItem.value >= intervals[4] || fItem.value === intervals[4])
              ) {
                itemValue = 5;
              }
              if (
                (fItem.value < intervals[4] || fItem.value === intervals[4]) &&
                (fItem.value >= intervals[3] || fItem.value === intervals[3])
              ) {
                itemValue = 4;
              }
              if (
                (fItem.value < intervals[3] || fItem.value === intervals[3]) &&
                (fItem.value >= intervals[2] || fItem.value === intervals[2])
              ) {
                itemValue = 3;
              }
              if (
                (fItem.value < intervals[2] || fItem.value === intervals[2]) &&
                (fItem.value >= intervals[1] || fItem.value === intervals[1])
              ) {
                itemValue = 2;
              }
              if (
                (fItem.value < intervals[1] || fItem.value === intervals[1]) &&
                (fItem.value >= intervals[0] || fItem.value === intervals[0])
              ) {
                itemValue = 1;
              }
            }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                value: itemValue,
                iso_a3: feature.id,
                data: fItem
                  ? {
                      components: fItem.components,
                      value: fItem.value,
                    }
                  : {},
              },
            };
          });
          return {
            count: features.length,
            data: features,
            maxValue,
          };
        }),
      )
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

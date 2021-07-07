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
import GeomapFieldsMapping from '../config/mapping/disbursements/geomap.json';
import GrantDetailTimeCycleFieldsMapping from '../config/mapping/disbursements/grantDetailTimeCycle.json';
import GrantDetailTreemapFieldsMapping from '../config/mapping/disbursements/grantDetailTreemap.json';
import TimeCycleFieldsMapping from '../config/mapping/disbursements/timeCycle.json';
import TimeCycleDrilldownFieldsMapping from '../config/mapping/disbursements/timeCycleDrilldown.json';
import TreemapFieldsMapping from '../config/mapping/disbursements/treemap.json';
import urls from '../config/urls/index.json';
import {BudgetsTreemapDataItem} from '../interfaces/budgetsTreemap';
import {DisbursementsTreemapDataItem} from '../interfaces/disbursementsTreemap';
import {
  grantDetailGetFilterString,
  grantDetailTreemapGetFilterString,
} from '../utils/filtering/disbursements/grantDetailGetFilterString';
import {getFilterString} from '../utils/filtering/grants/getFilterString';
import {formatFinancialValue} from '../utils/formatFinancialValue';

const DISBURSEMENTS_TIME_CYCLE_RESPONSE: ResponseObject = {
  description: 'Disbursements Time Cycle Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'DisbursementsTimeCycleResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: {type: 'string'},
                disbursed: {type: 'number'},
                cumulative: {type: 'number'},
                disbursedChildren: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      color: {type: 'string'},
                      value: {type: 'number'},
                    },
                  },
                },
                cumulativeChildren: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      color: {type: 'string'},
                      value: {type: 'number'},
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
const DISBURSEMENTS_TREEMAP_RESPONSE: ResponseObject = {
  description: 'Disbursements Treemap Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'DisbursementsTreemapResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                value: {type: 'number'},
                color: {type: 'string'},
                formattedValue: {type: 'string'},
                tooltip: {
                  type: 'object',
                  properties: {
                    header: {type: 'string'},
                    componentsStats: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: {type: 'string'},
                          count: {type: 'number'},
                          investment: {type: 'number'},
                        },
                      },
                    },
                    totalInvestments: {
                      type: 'object',
                      properties: {
                        committed: {type: 'number'},
                        disbursed: {type: 'number'},
                        signed: {type: 'number'},
                      },
                    },
                    percValue: {type: 'string'},
                  },
                },
                _children: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      value: {type: 'number'},
                      color: {type: 'string'},
                      formattedValue: {type: 'string'},
                      tooltip: {
                        type: 'object',
                        properties: {
                          header: {type: 'string'},
                          componentsStats: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: {type: 'string'},
                                count: {type: 'number'},
                                investment: {type: 'number'},
                              },
                            },
                          },
                          totalInvestments: {
                            type: 'object',
                            properties: {
                              committed: {type: 'number'},
                              disbursed: {type: 'number'},
                              signed: {type: 'number'},
                            },
                          },
                          percValue: {type: 'string'},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export class DisbursementsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/disbursements/time-cycle')
  @response(200, DISBURSEMENTS_TIME_CYCLE_RESPONSE)
  timeCycle(): object {
    const filterString = getFilterString(
      this.req.query,
      TimeCycleFieldsMapping.disbursementsTimeCycleAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.disbursements}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let apiData = _.get(resp.data, TimeCycleFieldsMapping.dataPath, []);
        if (apiData.length > 0) {
          if (_.get(apiData[0], TimeCycleFieldsMapping.year, '').length > 4) {
            apiData = _.filter(
              apiData,
              (item: any) => item[TimeCycleFieldsMapping.year],
            ).map((item: any) => ({
              ...item,
              [TimeCycleFieldsMapping.year]: item[
                TimeCycleFieldsMapping.year
              ].slice(0, 4),
            }));
          }
        }
        const groupedDataByYear = _.groupBy(
          apiData,
          TimeCycleFieldsMapping.year,
        );
        const data: any = [];
        Object.keys(groupedDataByYear).forEach((year: string) => {
          const dataItems = groupedDataByYear[year];
          const yearComponents: any = [];
          _.orderBy(dataItems, TimeCycleFieldsMapping.year, 'asc').forEach(
            (item: any) => {
              const value = parseInt(
                _.get(item, TimeCycleFieldsMapping.disbursed, 0),
                10,
              );
              if (value) {
                const name = _.get(item, TimeCycleFieldsMapping.component, '');
                const prevYearComponent = _.get(
                  data,
                  `[${data.length - 1}].cumulativeChildren`,
                  [],
                );
                yearComponents.push({
                  name,
                  disbursed: value,
                  cumulative:
                    _.get(_.find(prevYearComponent, {name}), 'value', 0) +
                    value,
                });
              }
            },
          );
          const disbursed = _.sumBy(yearComponents, 'disbursed');
          const cumulative = _.sumBy(yearComponents, 'cumulative');
          if (disbursed > 0) {
            data.push({
              year,
              disbursed,
              cumulative,
              disbursedChildren: _.orderBy(yearComponents, 'name', 'asc').map(
                (yc: any) => ({
                  name: yc.name,
                  color: _.get(
                    TimeCycleFieldsMapping.componentColors,
                    yc.name,
                    '',
                  ),
                  value: yc.disbursed,
                }),
              ),
              cumulativeChildren: _.orderBy(yearComponents, 'name', 'asc').map(
                (yc: any) => ({
                  name: yc.name,
                  color: _.get(
                    TimeCycleFieldsMapping.componentColors,
                    yc.name,
                    '',
                  ),
                  value: yc.cumulative,
                }),
              ),
            });
          }
        });
        return {
          count: data.length,
          data: data,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/disbursements/time-cycle/drilldown')
  @response(200, DISBURSEMENTS_TIME_CYCLE_RESPONSE)
  timeCycleDrilldown(): object {
    const filterString = getFilterString(
      this.req.query,
      TimeCycleDrilldownFieldsMapping.disbursementsTimeCycleDrilldownAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.disbursements}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const apiData = _.get(
          resp.data,
          TimeCycleDrilldownFieldsMapping.dataPath,
          [],
        );
        const groupedDataByComponent = _.groupBy(
          apiData,
          TimeCycleDrilldownFieldsMapping.component,
        );
        const data: BudgetsTreemapDataItem[] = [];
        Object.keys(groupedDataByComponent).forEach((component: string) => {
          const dataItems = groupedDataByComponent[component];
          const componentLocations: BudgetsTreemapDataItem[] = [];
          dataItems.forEach((item: any) => {
            componentLocations.push({
              name: item[TimeCycleDrilldownFieldsMapping.locationName],
              value: item[TimeCycleDrilldownFieldsMapping.disbursed],
              formattedValue: formatFinancialValue(
                item[TimeCycleDrilldownFieldsMapping.disbursed],
              ),
              color: '#70777E',
              tooltip: {
                header: component,
                componentsStats: [
                  {
                    name: item[TimeCycleDrilldownFieldsMapping.locationName],
                    value: item[TimeCycleDrilldownFieldsMapping.disbursed],
                  },
                ],
                value: item[TimeCycleDrilldownFieldsMapping.disbursed],
              },
            });
          });
          const disbursed = _.sumBy(componentLocations, 'value');
          data.push({
            name: component,
            color: '#DFE3E5',
            value: disbursed,
            formattedValue: formatFinancialValue(disbursed),
            _children: _.orderBy(componentLocations, 'value', 'desc'),
            tooltip: {
              header: component,
              componentsStats: [
                {
                  name: component,
                  value: _.sumBy(componentLocations, 'value'),
                },
              ],
              value: _.sumBy(componentLocations, 'value'),
            },
          });
        });
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/disbursements/treemap')
  @response(200, DISBURSEMENTS_TREEMAP_RESPONSE)
  treemap(): object {
    const filterString = getFilterString(
      this.req.query,
      TreemapFieldsMapping.disbursementsTreemapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grantsNoCount}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const groupedDataByComponent = _.groupBy(
          _.get(resp.data, TreemapFieldsMapping.dataPath, []),
          TreemapFieldsMapping.component,
        );
        const data: DisbursementsTreemapDataItem[] = [];
        Object.keys(groupedDataByComponent).forEach((component: string) => {
          const dataItems = groupedDataByComponent[component];
          const componentLocations: DisbursementsTreemapDataItem[] = [];
          dataItems.forEach((item: any) => {
            componentLocations.push({
              name: item[TreemapFieldsMapping.locationName],
              code: item[TreemapFieldsMapping.locationCode],
              value: item[TreemapFieldsMapping.disbursed],
              formattedValue: formatFinancialValue(
                item[TreemapFieldsMapping.disbursed],
              ),
              color: '#70777E',
              tooltip: {
                header: component,
                componentsStats: [
                  {
                    name: item[TreemapFieldsMapping.locationName],
                    count: item.count,
                    investment: item[TreemapFieldsMapping.disbursed],
                  },
                ],
                totalInvestments: {
                  committed: item[TreemapFieldsMapping.committed],
                  disbursed: item[TreemapFieldsMapping.disbursed],
                  signed: item[TreemapFieldsMapping.signed],
                },
                percValue: (
                  (item[TreemapFieldsMapping.disbursed] * 100) /
                  item[TreemapFieldsMapping.committed]
                ).toString(),
              },
            });
          });
          const disbursed = _.sumBy(componentLocations, 'value');
          const committed = _.sumBy(
            componentLocations,
            'tooltip.totalInvestments.committed',
          );
          data.push({
            name: component,
            color: '#DFE3E5',
            value: disbursed,
            formattedValue: formatFinancialValue(disbursed),
            _children: _.orderBy(componentLocations, 'value', 'desc'),
            tooltip: {
              header: component,
              componentsStats: [
                {
                  name: component,
                  count: _.sumBy(
                    componentLocations,
                    'tooltip.componentsStats[0].count',
                  ),
                  investment: _.sumBy(componentLocations, 'value'),
                },
              ],
              totalInvestments: {
                committed,
                disbursed,
                signed: _.sumBy(
                  componentLocations,
                  'tooltip.totalInvestments.signed',
                ),
              },
              percValue: ((disbursed * 100) / committed).toString(),
            },
          });
        });
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/disbursements/treemap/drilldown')
  @response(200, DISBURSEMENTS_TREEMAP_RESPONSE)
  treemapDrilldown(): object {
    const filterString = getFilterString(
      this.req.query,
      TreemapFieldsMapping.disbursementsTreemapDrilldownAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grantsNoCount}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const groupedDataByCountry = _.groupBy(
          _.get(resp.data, TreemapFieldsMapping.dataPath, []),
          TreemapFieldsMapping.locationName,
        );
        const data: DisbursementsTreemapDataItem[] = [];
        Object.keys(groupedDataByCountry).forEach((location: string) => {
          const dataItems = groupedDataByCountry[location];
          const locationComponents: DisbursementsTreemapDataItem[] = [];
          dataItems.forEach((item: any) => {
            locationComponents.push({
              name: item[TreemapFieldsMapping.component],
              value: item[TreemapFieldsMapping.disbursed],
              formattedValue: formatFinancialValue(
                item[TreemapFieldsMapping.disbursed],
              ),
              color: '#70777E',
              tooltip: {
                header: location,
                componentsStats: [
                  {
                    name: item[TreemapFieldsMapping.component],
                    count: item.count,
                    investment: item[TreemapFieldsMapping.disbursed],
                  },
                ],
                totalInvestments: {
                  committed: item[TreemapFieldsMapping.committed],
                  disbursed: item[TreemapFieldsMapping.disbursed],
                  signed: item[TreemapFieldsMapping.signed],
                },
                percValue: (
                  (item[TreemapFieldsMapping.disbursed] * 100) /
                  item[TreemapFieldsMapping.committed]
                ).toString(),
              },
            });
          });
          const disbursed = _.sumBy(locationComponents, 'value');
          const committed = _.sumBy(
            locationComponents,
            'tooltip.totalInvestments.committed',
          );
          data.push({
            name: location,
            color: '#DFE3E5',
            value: disbursed,
            formattedValue: formatFinancialValue(disbursed),
            _children: _.orderBy(locationComponents, 'value', 'desc'),
            tooltip: {
              header: location,
              componentsStats: [
                {
                  name: location,
                  count: _.sumBy(
                    locationComponents,
                    'tooltip.componentsStats[0].count',
                  ),
                  investment: _.sumBy(locationComponents, 'value'),
                },
              ],
              totalInvestments: {
                committed,
                disbursed,
                signed: _.sumBy(
                  locationComponents,
                  'tooltip.totalInvestments.signed',
                ),
              },
              percValue: ((disbursed * 100) / committed).toString(),
            },
          });
        });
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/disbursements/geomap')
  @response(200, DISBURSEMENTS_TIME_CYCLE_RESPONSE)
  geomap(): object {
    const filterString = getFilterString(
      this.req.query,
      GeomapFieldsMapping.disbursementsGeomapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grantsNoCount}/?${params}${filterString}`;

    return axios
      .all([
        axios.get(url),
        // TODO: check how to serve static geojson in-app
        axios.get('https://the.data.explorer.nyuki.io/static/simple.geo.json'),
      ])
      .then(
        axios.spread((...responses) => {
          const geoJSONData = responses[1].data.features;
          // const geoJSONData = geojson.features;
          const groupedDataByLocation = _.groupBy(
            responses[0].data.value,
            GeomapFieldsMapping.locationCode,
          );
          const data: any = [];
          Object.keys(groupedDataByLocation).forEach((iso3: string) => {
            const dataItems = groupedDataByLocation[iso3];
            const locationComponents: any = [];
            dataItems.forEach((item: any) => {
              locationComponents.push({
                name: item[GeomapFieldsMapping.component],
                activitiesCount: item.count,
                value: item[GeomapFieldsMapping.disbursed],
              });
            });
            const disbursed = _.sumBy(dataItems, GeomapFieldsMapping.disbursed);
            const committed = _.sumBy(dataItems, GeomapFieldsMapping.committed);
            const signed = _.sumBy(dataItems, GeomapFieldsMapping.signed);
            data.push({
              code: iso3,
              components: locationComponents,
              disbursed,
              committed,
              signed,
            });
          });
          const maxValue: number =
            _.max(data.map((d: any) => d.disbursed)) ?? 0;
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
                (fItem.disbursed < maxValue || fItem.disbursed === maxValue) &&
                (fItem.disbursed >= intervals[11] ||
                  fItem.disbursed === intervals[11])
              ) {
                itemValue = 12;
              }
              if (
                (fItem.disbursed < intervals[11] ||
                  fItem.disbursed === intervals[11]) &&
                (fItem.disbursed >= intervals[10] ||
                  fItem.disbursed === intervals[10])
              ) {
                itemValue = 11;
              }
              if (
                (fItem.disbursed < intervals[10] ||
                  fItem.disbursed === intervals[10]) &&
                (fItem.disbursed >= intervals[9] ||
                  fItem.disbursed === intervals[9])
              ) {
                itemValue = 10;
              }
              if (
                (fItem.disbursed < intervals[9] ||
                  fItem.disbursed === intervals[9]) &&
                (fItem.disbursed >= intervals[8] ||
                  fItem.disbursed === intervals[8])
              ) {
                itemValue = 9;
              }
              if (
                (fItem.disbursed < intervals[8] ||
                  fItem.disbursed === intervals[8]) &&
                (fItem.disbursed >= intervals[7] ||
                  fItem.disbursed === intervals[7])
              ) {
                itemValue = 8;
              }
              if (
                (fItem.disbursed < intervals[7] ||
                  fItem.disbursed === intervals[7]) &&
                (fItem.disbursed >= intervals[6] ||
                  fItem.disbursed === intervals[6])
              ) {
                itemValue = 7;
              }
              if (
                (fItem.disbursed < intervals[6] ||
                  fItem.disbursed === intervals[6]) &&
                (fItem.disbursed >= intervals[5] ||
                  fItem.disbursed === intervals[5])
              ) {
                itemValue = 6;
              }
              if (
                (fItem.disbursed < intervals[5] ||
                  fItem.disbursed === intervals[5]) &&
                (fItem.disbursed >= intervals[4] ||
                  fItem.disbursed === intervals[4])
              ) {
                itemValue = 5;
              }
              if (
                (fItem.disbursed < intervals[4] ||
                  fItem.disbursed === intervals[4]) &&
                (fItem.disbursed >= intervals[3] ||
                  fItem.disbursed === intervals[3])
              ) {
                itemValue = 4;
              }
              if (
                (fItem.disbursed < intervals[3] ||
                  fItem.disbursed === intervals[3]) &&
                (fItem.disbursed >= intervals[2] ||
                  fItem.disbursed === intervals[2])
              ) {
                itemValue = 3;
              }
              if (
                (fItem.disbursed < intervals[2] ||
                  fItem.disbursed === intervals[2]) &&
                (fItem.disbursed >= intervals[1] ||
                  fItem.disbursed === intervals[1])
              ) {
                itemValue = 2;
              }
              if (
                (fItem.disbursed < intervals[1] ||
                  fItem.disbursed === intervals[1]) &&
                (fItem.disbursed >= intervals[0] ||
                  fItem.disbursed === intervals[0])
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
                      disbursed: fItem.disbursed,
                      committed: fItem.committed,
                      signed: fItem.signed,
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
        console.error(error.message);
      });
  }

  @get('/grant/disbursements/time-cycle')
  @response(200, DISBURSEMENTS_TIME_CYCLE_RESPONSE)
  grantDetailTimeCycle(): object {
    const filterString = grantDetailGetFilterString(
      this.req.query,
      GrantDetailTimeCycleFieldsMapping.disbursementsTimeCycleAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grantDetailDisbursements}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let apiData = _.get(
          resp.data,
          GrantDetailTimeCycleFieldsMapping.dataPath,
          [],
        );
        if (apiData.length > 0) {
          if (
            _.get(apiData[0], GrantDetailTimeCycleFieldsMapping.year, '')
              .length > 4
          ) {
            apiData = _.filter(
              apiData,
              (item: any) => item[GrantDetailTimeCycleFieldsMapping.year],
            ).map((item: any) => ({
              ...item,
              [GrantDetailTimeCycleFieldsMapping.year]: item[
                GrantDetailTimeCycleFieldsMapping.year
              ].slice(0, 4),
            }));
          }
        }
        const groupedDataByYear = _.groupBy(
          apiData,
          GrantDetailTimeCycleFieldsMapping.year,
        );
        const data: any = [];
        Object.keys(groupedDataByYear).forEach((year: string) => {
          const dataItems = groupedDataByYear[year];
          const yearComponents: any = [];
          _.orderBy(
            dataItems,
            GrantDetailTimeCycleFieldsMapping.year,
            'asc',
          ).forEach((item: any) => {
            const value = parseInt(
              _.get(item, GrantDetailTimeCycleFieldsMapping.disbursed, 0),
              10,
            );
            if (value) {
              const name = _.get(
                item,
                GrantDetailTimeCycleFieldsMapping.component,
                '',
              );
              const prevYearComponent = _.get(
                data,
                `[${data.length - 1}].cumulativeChildren`,
                [],
              );
              yearComponents.push({
                name,
                disbursed: value,
                cumulative:
                  _.get(_.find(prevYearComponent, {name}), 'value', 0) + value,
              });
            }
          });
          const disbursed = _.sumBy(yearComponents, 'disbursed');
          const cumulative = _.sumBy(yearComponents, 'cumulative');
          if (disbursed > 0) {
            data.push({
              year,
              disbursed,
              cumulative,
              disbursedChildren: _.orderBy(yearComponents, 'name', 'asc').map(
                (yc: any) => ({
                  name: yc.name,
                  color: _.get(
                    GrantDetailTimeCycleFieldsMapping.componentColors,
                    yc.name,
                    '',
                  ),
                  value: yc.disbursed,
                }),
              ),
              cumulativeChildren: _.orderBy(yearComponents, 'name', 'asc').map(
                (yc: any) => ({
                  name: yc.name,
                  color: _.get(
                    GrantDetailTimeCycleFieldsMapping.componentColors,
                    yc.name,
                    '',
                  ),
                  value: yc.cumulative,
                }),
              ),
            });
          }
        });
        return {
          count: data.length,
          data: data,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/grant/disbursements/treemap')
  @response(200, DISBURSEMENTS_TREEMAP_RESPONSE)
  grantDetailTreemap(): object {
    const filterString = grantDetailTreemapGetFilterString(
      this.req.query,
      GrantDetailTreemapFieldsMapping.disbursementsTreemapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grantDetailGrants}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const groupedDataByComponent = _.groupBy(
          _.get(resp.data, GrantDetailTreemapFieldsMapping.dataPath, []),
          GrantDetailTreemapFieldsMapping.component,
        );
        const data: DisbursementsTreemapDataItem[] = [];
        Object.keys(groupedDataByComponent).forEach((component: string) => {
          const dataItems = groupedDataByComponent[component];
          const componentLocations: DisbursementsTreemapDataItem[] = [];
          dataItems.forEach((item: any) => {
            componentLocations.push({
              name: _.get(
                item,
                GrantDetailTreemapFieldsMapping.locationName,
                '',
              ),
              value: item[GrantDetailTreemapFieldsMapping.disbursed],
              formattedValue: formatFinancialValue(
                item[GrantDetailTreemapFieldsMapping.disbursed],
              ),
              color: '#70777E',
              tooltip: {
                header: component,
                componentsStats: [
                  {
                    name: _.get(
                      item,
                      GrantDetailTreemapFieldsMapping.locationName,
                      '',
                    ),
                    count: item.count,
                    investment: item[GrantDetailTreemapFieldsMapping.disbursed],
                  },
                ],
                totalInvestments: {
                  committed: item[GrantDetailTreemapFieldsMapping.committed],
                  disbursed: item[GrantDetailTreemapFieldsMapping.disbursed],
                  signed: item[GrantDetailTreemapFieldsMapping.signed],
                },
                percValue: (
                  (item[GrantDetailTreemapFieldsMapping.disbursed] * 100) /
                  item[GrantDetailTreemapFieldsMapping.committed]
                ).toString(),
              },
            });
          });
          const disbursed = _.sumBy(componentLocations, 'value');
          const committed = _.sumBy(
            componentLocations,
            'tooltip.totalInvestments.committed',
          );
          data.push({
            name: component,
            color: '#DFE3E5',
            value: disbursed,
            formattedValue: formatFinancialValue(disbursed),
            _children: _.orderBy(componentLocations, 'value', 'desc'),
            tooltip: {
              header: component,
              componentsStats: [
                {
                  name: component,
                  count: _.sumBy(
                    componentLocations,
                    'tooltip.componentsStats[0].count',
                  ),
                  investment: _.sumBy(componentLocations, 'value'),
                },
              ],
              totalInvestments: {
                committed,
                disbursed,
                signed: _.sumBy(
                  componentLocations,
                  'tooltip.totalInvestments.signed',
                ),
              },
              percValue: ((disbursed * 100) / committed).toString(),
            },
          });
        });
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

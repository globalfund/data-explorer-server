import {inject} from '@loopback/core';
import {
  get,
  param,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import center from '@turf/center';
import {points, Position} from '@turf/helpers';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import AllocationCumulativeByCyclesFieldsMapping from '../config/mapping/allocations/cumulative-by-cycles.json';
import AllocationCyclesFieldsMapping from '../config/mapping/allocations/cycles.json';
import AllocationsDrilldownFieldsMapping from '../config/mapping/allocations/drilldown.json';
import AllocationsGeomapFieldsMapping from '../config/mapping/allocations/geomap.json';
import AllocationsFieldsMapping from '../config/mapping/allocations/index.json';
import AllocationsPeriodsFieldsMapping from '../config/mapping/allocations/periods.json';
import AllocationRadialFieldsMapping from '../config/mapping/allocations/radial.json';
import AllocationSunburstFieldsMapping from '../config/mapping/allocations/sunburst.json';
import AllocationTableFieldsMapping from '../config/mapping/allocations/table.json';
import AllocationTreemapFieldsMapping from '../config/mapping/allocations/treemap.json';
import urls from '../config/urls/index.json';
import {AllocationsTreemapDataItem} from '../interfaces/allocations';
import {SimpleTableRow} from '../interfaces/simpleTable';
import staticCountries from '../static-assets/countries.json';
import {handleDataApiError} from '../utils/dataApiError';
import {getFilterString} from '../utils/filtering/allocations/getFilterString';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';
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

async function getAllocationsData(url: string) {
  return axios
    .get(url)
    .then((resp: AxiosResponse) => {
      const raw = _.get(resp.data, AllocationRadialFieldsMapping.dataPath, []);
      const groupedByName = _.groupBy(raw, AllocationRadialFieldsMapping.name);
      const data: any = [];
      Object.keys(groupedByName).forEach((name: string, index: number) => {
        const value = _.sumBy(
          groupedByName[name],
          AllocationRadialFieldsMapping.value,
        );
        data.push({
          name,
          value,
          itemStyle: {
            color: _.get(
              AllocationRadialFieldsMapping.colors,
              `[${index}]`,
              '',
            ),
          },
          tooltip: {
            items: groupedByName[name].map((item: any) => ({
              name: _.get(item, AllocationRadialFieldsMapping.tooltipItem, ''),
              value: _.get(item, AllocationRadialFieldsMapping.value, 0),
            })),
          },
        });
      });
      return data;
    })
    .catch(handleDataApiError);
}

export class AllocationsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

  @get('/allocations/cumulative-by-cycles')
  @response(200)
  async cumulativeByCycles() {
    let filterString = filterFinancialIndicators(
      this.req.query,
      AllocationCumulativeByCyclesFieldsMapping.urlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(
          resp.data,
          AllocationCumulativeByCyclesFieldsMapping.dataPath,
          [],
        );

        const data: {
          name: string;
          values: number[];
          itemStyle?: {
            color: string;
          };
        }[] = [];

        const groupedByCycle = _.groupBy(
          raw,
          AllocationCumulativeByCyclesFieldsMapping.cycle,
        );

        const cycles = Object.keys(groupedByCycle);

        const groupedByComponent = _.groupBy(
          raw,
          AllocationCumulativeByCyclesFieldsMapping.component,
        );

        _.forEach(groupedByComponent, (component, componentKey) => {
          const values: number[] = [];
          _.forEach(cycles, cycle => {
            const cycleData = _.find(component, {
              [AllocationCumulativeByCyclesFieldsMapping.cycle]: cycle,
            });
            values.push(
              _.get(
                cycleData,
                AllocationCumulativeByCyclesFieldsMapping.value,
                0,
              ),
            );
          });

          data.push({
            name: componentKey,
            values,
            itemStyle: {
              color: _.get(
                AllocationCumulativeByCyclesFieldsMapping.colors,
                data.length + 1,
              ),
            },
          });
        });

        data.unshift({
          name: 'Total Allocation',
          values: cycles.map((cycle, index) =>
            _.sumBy(data, `values[${index}]`),
          ),
          itemStyle: {
            color: _.get(AllocationCumulativeByCyclesFieldsMapping.colors, 0),
          },
        });

        return {
          keys: cycles,
          data,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/allocations/sunburst')
  @response(200)
  async allocationsSunburst() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      AllocationSunburstFieldsMapping.urlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(
          resp.data,
          AllocationSunburstFieldsMapping.dataPath,
          [],
        );

        const groupedByRegion = _.groupBy(
          raw,
          AllocationSunburstFieldsMapping.region,
        );

        return {
          data: _.map(groupedByRegion, (regionData, region) => {
            return {
              name: region,
              value: _.sumBy(regionData, AllocationSunburstFieldsMapping.value),
              children: _.map(regionData, item => ({
                name: _.get(item, AllocationSunburstFieldsMapping.country, ''),
                value: _.get(item, AllocationSunburstFieldsMapping.value, 0),
              })),
            };
          }),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/allocations/treemap')
  @response(200)
  async allocationsTreemap() {
    let urlParams = AllocationTreemapFieldsMapping.urlParams[0];
    if (this.req.query.nestedField) {
      if (this.req.query.nestedField === 'geography') {
        urlParams = AllocationTreemapFieldsMapping.urlParams[1];
      }
    }
    const filterString = filterFinancialIndicators(this.req.query, urlParams);
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(
          resp.data,
          AllocationTreemapFieldsMapping.dataPath,
          [],
        );

        const groupedByComponent = _.groupBy(
          raw,
          AllocationTreemapFieldsMapping.component,
        );

        return {
          data: _.map(groupedByComponent, (componentData, component) => {
            const color = _.get(
              AllocationTreemapFieldsMapping.colors,
              `[${_.findIndex(
                Object.keys(groupedByComponent),
                c => c === component,
              )}]`,
              AllocationTreemapFieldsMapping.colors[0],
            );
            return {
              name: component,
              value: _.sumBy(
                componentData,
                AllocationTreemapFieldsMapping.value,
              ),
              itemStyle: {
                color: color.bg,
              },
              label: {
                normal: {
                  color: color.text,
                },
              },
              children: this.req.query.nestedField
                ? _.map(componentData, item => ({
                    name: _.get(
                      item,
                      AllocationTreemapFieldsMapping.geography,
                      '',
                    ),
                    value: _.get(item, AllocationTreemapFieldsMapping.value, 0),
                    itemStyle: {
                      color: color.items,
                    },
                    label: {
                      normal: {
                        color: color.text,
                      },
                    },
                  }))
                : undefined,
            };
          }),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/allocations/table')
  @response(200)
  async allocationsTable() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      AllocationTableFieldsMapping.urlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, AllocationTableFieldsMapping.dataPath, []);

        const groupedByGeography = _.groupBy(
          raw,
          AllocationTableFieldsMapping.geography,
        );

        const data: {
          [key: string]:
            | string
            | number
            | boolean
            | null
            | object
            | Array<object>;
        }[] = _.map(groupedByGeography, (value, key) => {
          let item: {
            [key: string]:
              | string
              | number
              | boolean
              | null
              | object
              | Array<object>;
          } = {
            name: key,
            _children: [],
          };

          const geoGroupedByYear = _.groupBy(
            value,
            AllocationTableFieldsMapping.cycle,
          );

          _.forEach(geoGroupedByYear, (value, key) => {
            item = {
              ...item,
              [key]: _.sumBy(value, AllocationTableFieldsMapping.value),
            };
          });

          const groupedByComponent = _.groupBy(
            value,
            AllocationTableFieldsMapping.component,
          );

          item._children = _.map(groupedByComponent, (value, key) => {
            const componentItem: {
              [key: string]:
                | string
                | number
                | boolean
                | null
                | object
                | Array<object>;
            } = {
              name: key,
            };

            const componentGroupedByYear = _.groupBy(
              value,
              AllocationTableFieldsMapping.cycle,
            );

            _.forEach(componentGroupedByYear, (value, key) => {
              componentItem[key] = _.sumBy(
                value,
                AllocationTableFieldsMapping.value,
              );
            });

            return componentItem;
          });

          return item;
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/allocations/radial')
  @response(200)
  async allocationsRadialChart() {
    let filterString = filterFinancialIndicators(
      this.req.query,
      AllocationRadialFieldsMapping.urlParams,
    );
    let filterString2 = filterFinancialIndicators(
      this.req.query,
      AllocationRadialFieldsMapping.countriesCountUrlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    const data = await getAllocationsData(url);
    const countriesCount = await axios
      .get(url2)
      .then(
        (resp: AxiosResponse) =>
          _.get(resp.data, AllocationRadialFieldsMapping.dataPath, []).length,
      )
      .catch(() => 0);

    return {data: {chart: data, countries: countriesCount}};
  }

  @get('/allocations/radial/{countryCode}')
  @response(200)
  async allocationsRadialChartInLocation(
    @param.path.string('countryCode') countryCode: string,
  ) {
    let filterString = filterFinancialIndicators(
      {...this.req.query, geographies: countryCode},
      AllocationRadialFieldsMapping.urlParams,
    );

    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    const data = await getAllocationsData(url);

    return {data};
  }

  @get('/allocations/cycles')
  @response(200)
  async cycles() {
    return axios
      .get(
        `${urls.FINANCIAL_INDICATORS}${AllocationCyclesFieldsMapping.urlParams}`,
      )
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          AllocationCyclesFieldsMapping.dataPath,
          [],
        );

        const data = _.map(rawData, (item, index) => {
          const from = _.get(item, AllocationCyclesFieldsMapping.cycleFrom, '');
          const to = _.get(item, AllocationCyclesFieldsMapping.cycleTo, '');

          let value = from;

          if (from && to) {
            value = `${from} - ${to}`;
          }

          return {
            name: `Cycle ${index + 1}`,
            value,
          };
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  // v2

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
      .catch(handleDataApiError);
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
      .catch(handleDataApiError);
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
        const data: AllocationsTreemapDataItem[] = [];
        const groupedByComponent = _.groupBy(
          rawData,
          AllocationsDrilldownFieldsMapping.component,
        );
        Object.keys(groupedByComponent).forEach((component: string) => {
          const value = _.sumBy(
            groupedByComponent[component],
            AllocationsDrilldownFieldsMapping.amount,
          );
          data.push({
            name: component,
            value,
            formattedValue: formatFinancialValue(value),
            color: '#DFE3E5',
            _children: _.orderBy(
              groupedByComponent[component].map((item: any) => ({
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
                color: '#595C70',
                tooltip: {
                  header: component,
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
              header: component,
              value,
              componentsStats: [
                {
                  name: component,
                  value,
                },
              ],
            },
          });
        });
        return {
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch(handleDataApiError);
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
      .all([axios.get(url), axios.get(urls.geojson)])
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
      .catch(handleDataApiError);
  }

  @get('/allocations/geomap/multicountries')
  @response(200, ALLOCATIONS_RESPONSE)
  geomapMulticountries(): object {
    const filterString = getFilterString(
      this.req.query,
      AllocationsGeomapFieldsMapping.aggregationMulticountry,
      'multiCountryName ne null',
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
      .all([axios.get(url), axios.get(urls.multicountriescountriesdata)])
      .then(
        axios.spread((...responses) => {
          const rawData = _.get(
            responses[0].data,
            AllocationsGeomapFieldsMapping.dataPath,
            [],
          );
          const mcGeoData = _.get(
            responses[1].data,
            AllocationsGeomapFieldsMapping.dataPath,
            [],
          );
          const data: any = [];
          const groupedByMulticountry = _.groupBy(
            rawData,
            AllocationsGeomapFieldsMapping.multicountry,
          );
          Object.keys(groupedByMulticountry).forEach((mc: string) => {
            const fMCGeoItem = _.find(
              mcGeoData,
              (mcGeoItem: any) =>
                _.get(
                  mcGeoItem,
                  AllocationsGeomapFieldsMapping.multicountry,
                  '',
                ) === mc,
            );
            let latitude = 0;
            let longitude = 0;
            if (fMCGeoItem) {
              const coordinates: Position[] = [];
              const composition = _.get(
                fMCGeoItem,
                AllocationsGeomapFieldsMapping.multiCountryComposition,
                [],
              );
              composition.forEach((item: any) => {
                const iso3 = _.get(
                  item,
                  AllocationsGeomapFieldsMapping.multiCountryCompositionItem,
                  '',
                );
                const fCountry = _.find(staticCountries, {iso3: iso3});
                if (fCountry) {
                  coordinates.push([fCountry.longitude, fCountry.latitude]);
                }
              });
              if (coordinates.length > 0) {
                const lonlat = center(points(coordinates));
                longitude = lonlat.geometry.coordinates[0];
                latitude = lonlat.geometry.coordinates[1];
              }
            }
            data.push({
              id: mc,
              code: mc.replace(/\//g, '|'),
              geoName: mc,
              components: groupedByMulticountry[mc].map((item: any) => ({
                name: _.get(
                  item,
                  AllocationsGeomapFieldsMapping.multicountryComponent,
                  '',
                ),
                value: _.get(item, AllocationsGeomapFieldsMapping.amount, 0),
              })),
              latitude: latitude,
              longitude: longitude,
              value: _.sumBy(
                groupedByMulticountry[mc],
                AllocationsGeomapFieldsMapping.amount,
              ),
            });
          });
          return {
            pins: data,
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/v2/allocations/table')
  @response(200, ALLOCATIONS_RESPONSE)
  allocationsTableV2(): object {
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const aggregateByField =
      this.req.query.aggregateBy &&
      this.req.query.aggregateBy.toString().length > 0
        ? this.req.query.aggregateBy
        : AllocationsFieldsMapping.allocationsTableAggregateByFields[0];
    const nonAggregateByField = (
      this.req.query.nonAggregateBy
        ? this.req.query.nonAggregateBy
        : aggregateByField ===
          AllocationsFieldsMapping.allocationsTableAggregateByFields[0]
        ? AllocationsFieldsMapping.allocationsTableAggregateByFields[1]
        : AllocationsFieldsMapping.allocationsTableAggregateByFields[0]
    ).toString();
    const url = `${urls.allocations}/?${params}${filterString}&${AllocationsFieldsMapping.allocationsTableExpand}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, AllocationsFieldsMapping.dataPath, []);

        let data: SimpleTableRow[] = [];

        let groupedBy1 = _.groupBy(rawData, aggregateByField);

        _.filter(
          Object.keys(groupedBy1),
          compKey => compKey !== 'undefined' && compKey !== 'null',
        ).forEach(compKey => {
          const groupedBy2 = _.groupBy(
            groupedBy1[compKey],
            nonAggregateByField,
          );
          const subData: SimpleTableRow[] = [];
          _.filter(
            Object.keys(groupedBy2),
            countryKey => countryKey !== 'undefined' && countryKey !== 'null',
          ).forEach(countryKey => {
            let item = {
              name: countryKey,
            };
            _.orderBy(
              groupedBy2[countryKey],
              AllocationsFieldsMapping.periodStart,
              'desc',
            ).forEach(countryItem => {
              item = {
                ...item,
                [`${_.get(
                  countryItem,
                  AllocationsFieldsMapping.periodStart,
                  '',
                )}-${_.get(
                  countryItem,
                  AllocationsFieldsMapping.periodEnd,
                  '',
                )}`]: _.get(
                  countryItem,
                  AllocationsFieldsMapping.amountTable,
                  0,
                ),
              };
            });
            subData.push(item);
          });
          let item: SimpleTableRow = {
            name: compKey,
          };
          const groupedByPeriods = _.groupBy(
            groupedBy1[compKey],
            AllocationsFieldsMapping.periodStart,
          );
          _.sortBy(Object.keys(groupedByPeriods))
            .reverse()
            .forEach(period => {
              item = {
                ...item,
                [`${_.get(
                  groupedByPeriods[period][0],
                  AllocationsFieldsMapping.periodStart,
                  '',
                )}-${_.get(
                  groupedByPeriods[period][0],
                  AllocationsFieldsMapping.periodEnd,
                  '',
                )}`]: _.sumBy(
                  groupedByPeriods[period],
                  AllocationsFieldsMapping.amountTable,
                ),
              };
            });
          item = {
            ...item,
            children: subData,
          };
          data.push(item);
        });

        groupedBy1 = _.groupBy(
          rawData,
          aggregateByField ===
            AllocationsFieldsMapping.allocationsTableAggregateByFields[0]
            ? AllocationsFieldsMapping.multicountry
            : aggregateByField,
        );
        _.filter(
          Object.keys(groupedBy1),
          compKey => compKey !== 'undefined' && compKey !== 'null',
        ).forEach(compKey => {
          const groupedBy2 = _.groupBy(
            groupedBy1[compKey],
            nonAggregateByField ===
              AllocationsFieldsMapping.allocationsTableAggregateByFields[1]
              ? nonAggregateByField
              : AllocationsFieldsMapping.multicountry,
          );
          const subData: SimpleTableRow[] = [];
          _.filter(
            Object.keys(groupedBy2),
            countryKey => countryKey !== 'undefined' && countryKey !== 'null',
          ).forEach(countryKey => {
            let item = {
              name: countryKey,
            };
            _.orderBy(
              groupedBy2[countryKey],
              AllocationsFieldsMapping.periodStart,
              'desc',
            ).forEach(countryItem => {
              item = {
                ...item,
                [`${_.get(
                  countryItem,
                  AllocationsFieldsMapping.periodStart,
                  '',
                )}-${_.get(
                  countryItem,
                  AllocationsFieldsMapping.periodEnd,
                  '',
                )}`]: _.get(
                  countryItem,
                  AllocationsFieldsMapping.amountTable,
                  0,
                ),
              };
            });
            subData.push(item);
          });
          let item: SimpleTableRow = {
            name: compKey,
          };
          const groupedByPeriods = _.groupBy(
            groupedBy1[compKey],
            AllocationsFieldsMapping.periodStart,
          );
          _.sortBy(Object.keys(groupedByPeriods))
            .reverse()
            .forEach(period => {
              item = {
                ...item,
                [`${_.get(
                  groupedByPeriods[period][0],
                  AllocationsFieldsMapping.periodStart,
                  '',
                )}-${_.get(
                  groupedByPeriods[period][0],
                  AllocationsFieldsMapping.periodEnd,
                  '',
                )}`]: _.sumBy(
                  groupedByPeriods[period],
                  AllocationsFieldsMapping.amountTable,
                ),
              };
            });
          const fItemIndex = _.findIndex(data, {name: item.name});
          if (fItemIndex > -1) {
            data[fItemIndex] = {
              ...data[fItemIndex],
              children: [...(data[fItemIndex].children || []), ...subData],
            };
          } else {
            item = {
              ...item,
              children: subData,
            };
            data.push(item);
          }
        });

        data.forEach((item, index) => {
          data[index].children = _.orderBy(
            data[index].children,
            instance => instance[sortByValue] || '',
            sortByDirection,
          );
        });

        data = _.orderBy(
          data,
          instance => instance[sortByValue] || '',
          sortByDirection,
        );

        return {count: data.length, data};
      })
      .catch(handleDataApiError);
  }
}

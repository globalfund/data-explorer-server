import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import AllocationCumulativeByCyclesFieldsMapping from '../config/mapping/allocations/cumulative-by-cycles.json';
import AllocationCyclesFieldsMapping from '../config/mapping/allocations/cycles.json';
import AllocationRadialFieldsMapping from '../config/mapping/allocations/radial.json';
import AllocationSunburstFieldsMapping from '../config/mapping/allocations/sunburst.json';
import AllocationTableFieldsMapping from '../config/mapping/allocations/table.json';
import AllocationTreemapFieldsMapping from '../config/mapping/allocations/treemap.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

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
            items: _.filter(
              groupedByName[name].map((item: any) => ({
                name: _.get(
                  item,
                  AllocationRadialFieldsMapping.tooltipItem,
                  '',
                ),
                value: _.get(item, AllocationRadialFieldsMapping.value, 0),
                percentage:
                  (_.get(item, AllocationRadialFieldsMapping.value, 0) /
                    value) *
                  100,
              })),
              item => item.name !== 'GLOBAL_FUND_HIERARCHY',
            ),
          },
        });
      });
      return data;
    })
    .catch(handleDataApiError);
}

export class AllocationsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/allocations/cumulative-by-cycles')
  @response(200)
  async cumulativeByCycles() {
    let filterString = filterFinancialIndicators(
      this.req.query,
      AllocationCumulativeByCyclesFieldsMapping.urlParams,
      ['geography/name', 'geography/code'],
      'activityArea/name',
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
      ['geography/name', 'geography/code'],
      'activityArea/name',
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
    const filterString = filterFinancialIndicators(
      this.req.query,
      urlParams,
      ['geography/name', 'geography/code'],
      'activityArea/name',
    );
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
      ['geography/name', 'geography/code'],
      'activityArea/name',
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
      ['geography/name', 'geography/code'],
      'activityArea/name',
    );
    let filterString2 = filterFinancialIndicators(
      this.req.query,
      AllocationRadialFieldsMapping.countriesCountUrlParams,
      ['geography/name', 'geography/code'],
      'activityArea/name',
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
      AllocationRadialFieldsMapping.urlParamsLocation,
      'geography/code',
      'activityArea/name',
    );

    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    const data = await getAllocationsData(url);

    return {data};
  }

  @get('/allocations/cycles')
  @response(200)
  async cycles() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      AllocationCyclesFieldsMapping.urlParams,
      'geography/code',
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
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
}

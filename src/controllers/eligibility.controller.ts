import {inject} from '@loopback/core';
import {
  get,
  param,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import EligibilityFieldsMapping from '../config/mapping/eligibility/dotsChart.json';
import EligibilityHeatmap from '../config/mapping/eligibility/heatmap.json';
import ScatterplotFieldsMapping from '../config/mapping/eligibility/scatterplot.json';
import EligibilityStatsMapping from '../config/mapping/eligibility/stats.json';
import EligibilityTableMapping from '../config/mapping/eligibility/table.json';
import EligibilityYearsFieldsMapping from '../config/mapping/eligibility/years.json';
import urls from '../config/urls/index.json';
import {EligibilityDotDataItem} from '../interfaces/eligibilityDot';
import {EligibilityScatterplotDataItem} from '../interfaces/eligibilityScatterplot';
import {handleDataApiError} from '../utils/dataApiError';
import {filterEligibility} from '../utils/filtering/eligibility';
import {getFilterString} from '../utils/filtering/eligibility/getFilterString';

const ELIGIBILITY_RESPONSE: ResponseObject = {
  description: 'Eligibility Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'EligibilityResponse',
        properties: {
          count: {type: 'number'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      status: {type: 'string'},
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
const ELIGIBILITY_COUNTRY_RESPONSE: ResponseObject = {
  description: 'Eligibility Country Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'EligibilityCountryResponse',
        properties: {
          count: {type: 'number'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      x: {type: 'string'},
                      y: {type: 'string'},
                      eligibility: {type: 'string'},
                      incomeLevel: {type: 'string'},
                      diseaseBurden: {type: 'string'},
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

export class EligibilityController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

  @get('/eligibility/years')
  @response(200, ELIGIBILITY_RESPONSE)
  eligibilityYears(): object {
    const url = `${urls.ELIGIBILITY}/?${EligibilityYearsFieldsMapping.aggregation}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return {
          data: _.get(
            resp.data,
            EligibilityYearsFieldsMapping.dataPath,
            [],
          ).map((item: any) =>
            _.get(item, EligibilityYearsFieldsMapping.year, ''),
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/eligibility/stats/{year}')
  @response(200)
  async eligibilityStats(@param.path.string('year') year: string) {
    const filterString = filterEligibility(
      {...this.req.query, years: year},
      EligibilityStatsMapping.urlParams,
    );
    const url = `${urls.ELIGIBILITY}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, EligibilityStatsMapping.dataPath, []);
        const groupedByComponent = _.groupBy(
          raw,
          EligibilityStatsMapping.component,
        );
        return {
          data: _.map(groupedByComponent, (value, key) => ({
            name: key,
            value: value.length,
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/eligibility/table')
  @response(200)
  async eligibilityTable() {
    const filterString = filterEligibility(
      this.req.query,
      EligibilityTableMapping.urlParams,
    );
    const url = `${urls.ELIGIBILITY}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, EligibilityTableMapping.dataPath, []);

        const groupedByGeography = _.groupBy(
          raw,
          EligibilityTableMapping.geography,
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
          const item: {
            [key: string]:
              | string
              | number
              | boolean
              | null
              | object
              | Array<object>;
          } = {
            name: key,
            _children: [
              {
                name: 'Income Level',
              },
            ],
          };

          const geoGroupedByYear = _.groupBy(
            value,
            EligibilityTableMapping.year,
          );

          _.forEach(geoGroupedByYear, (value, key) => {
            (item._children as object[])[0] = {
              ...(item._children as object[])[0],
              [key]: _.get(value, '[0].incomeLevel', ''),
            };
          });

          const groupedByComponent = _.groupBy(
            value,
            EligibilityTableMapping.component,
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
              _children: [
                {
                  name: 'Disease Burden',
                },
                {
                  name: 'Eligibility',
                },
              ],
            };

            const componentGroupedByYear = _.groupBy(
              value,
              EligibilityTableMapping.year,
            );

            _.forEach(componentGroupedByYear, (value, key) => {
              let isEligible = _.get(
                value,
                `[0]["${EligibilityTableMapping.isEligible}"]`,
                '',
              );
              if (isEligible) {
                isEligible = EligibilityTableMapping.eligibilityValues.eligible;
              } else if (isEligible === false) {
                isEligible =
                  EligibilityTableMapping.eligibilityValues.notEligible;
              } else {
                isEligible =
                  EligibilityTableMapping.eligibilityValues.transitionFunding;
              }
              (componentItem._children as object[])[0] = {
                ...(componentItem._children as object[])[0],
                [key]: _.get(
                  value,
                  `[0]["${EligibilityTableMapping.diseaseBurden}"]`,
                  '',
                ),
              };
              (componentItem._children as object[])[1] = {
                ...(componentItem._children as object[])[1],
                [key]: isEligible,
              };
            });

            return componentItem;
          });

          return item;
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/eligibility/heatmap/{countryCode}')
  @response(200)
  async eligibilityHeatmap(
    @param.path.string('countryCode') countryCode: string,
  ) {
    let filterString = EligibilityHeatmap.urlParams.replace(
      '<countryCode>',
      countryCode,
    );
    const url = `${urls.ELIGIBILITY}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, EligibilityHeatmap.dataPath, []);
        const data = raw.map((item: any) => ({
          column: _.get(item, EligibilityHeatmap.eligibilityYear, ''),
          row: _.get(item, EligibilityHeatmap.component, ''),
          value: _.get(
            EligibilityHeatmap.isEligibleValueMapping,
            _.get(item, EligibilityHeatmap.isEligible, '').toString(),
            '',
          ),
          diseaseBurden: _.get(
            EligibilityHeatmap.diseaseBurdenValueMapping,
            _.get(item, EligibilityHeatmap.diseaseBurden, ''),
            '',
          ),
        }));

        const groupedByYears = _.groupBy(
          raw,
          EligibilityHeatmap.eligibilityYear,
        );
        Object.keys(groupedByYears).forEach(year => {
          data.push({
            column: year,
            row: '_Income Level',
            value: '',
            diseaseBurden: _.get(
              EligibilityHeatmap.incomeLevelValueMapping,
              _.get(
                groupedByYears[year][0],
                EligibilityHeatmap.incomeLevel,
                '',
              ),
              '',
            ),
          });
        });

        return {
          data: _.orderBy(data, ['column', 'row'], ['desc', 'asc']).map(
            (item: any) => ({
              ...item,
              column: item.column.toString(),
              row: item.row === '_Income Level' ? 'Income Level' : item.row,
            }),
          ),
        };
      })
      .catch(handleDataApiError);
  }

  // v2

  @get('/v2/eligibility')
  @response(200, ELIGIBILITY_RESPONSE)
  eligibility(): object {
    const aggregateByField =
      this.req.query.aggregateBy ??
      EligibilityFieldsMapping.aggregateByFields[0];
    const nonAggregateByField = (
      this.req.query.nonAggregateBy
        ? this.req.query.nonAggregateBy
        : this.req.query.aggregateBy ===
          EligibilityFieldsMapping.aggregateByFields[0]
        ? EligibilityFieldsMapping.aggregateByFields[1]
        : EligibilityFieldsMapping.aggregateByFields[0]
    ).toString();
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.eligibility}/?${params}${filterString}&${EligibilityFieldsMapping.defaultSelect}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    let outSortByValue = 'name';
    let inSortByValue = 'name';

    if (sortByValue === 'status') {
      outSortByValue = 'name';
      inSortByValue = 'status';
    }

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const apiData = _.get(resp.data, EligibilityFieldsMapping.dataPath, []);
        const aggregatedData = _.groupBy(apiData, aggregateByField);
        const data: EligibilityDotDataItem[] = [];

        Object.keys(aggregatedData).forEach((key: string) => {
          data.push({
            name: key,
            items: _.orderBy(
              aggregatedData[key].map(item => ({
                name: _.get(item, nonAggregateByField, ''),
                status: _.get(
                  EligibilityFieldsMapping,
                  _.get(item, EligibilityFieldsMapping.status, '')
                    .toLowerCase()
                    .trim(),
                  _.get(item, EligibilityFieldsMapping.status, ''),
                ),
              })),
              inSortByValue,
              sortByDirection,
            ),
          });
        });

        return {
          count: data.length,
          data: _.orderBy(
            data,
            outSortByValue,
            inSortByValue === 'status' ? 'asc' : sortByDirection,
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/eligibility/years')
  @response(200, ELIGIBILITY_RESPONSE)
  eligibilityYearsV2(): object {
    const url = `${urls.eligibility}/?${EligibilityYearsFieldsMapping.aggregation}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return {
          data: _.get(
            resp.data,
            EligibilityYearsFieldsMapping.dataPath,
            [],
          ).map((item: any) =>
            _.get(item, EligibilityYearsFieldsMapping.year, ''),
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/eligibility/country')
  @response(200, ELIGIBILITY_COUNTRY_RESPONSE)
  eligibilityCountry(): object {
    if (_.get(this.req.query, 'locations', '').length === 0) {
      return {
        count: 0,
        data: [],
      };
    }
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.eligibility}/?${params}${filterString}&${ScatterplotFieldsMapping.defaultSelect}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const apiData = _.get(resp.data, ScatterplotFieldsMapping.dataPath, []);
        const aggregatedData = _.groupBy(
          apiData,
          ScatterplotFieldsMapping.aggregateByField,
        );
        const aggregatedDataByYear = _.groupBy(
          apiData,
          ScatterplotFieldsMapping.year,
        );
        const years: number[] = _.sortBy(
          _.uniq(
            Object.keys(_.groupBy(apiData, ScatterplotFieldsMapping.year)),
          ).map((key: string) => parseInt(key, 10)),
        );
        years.push(years[years.length - 1] + 1);
        years.unshift(years[0] - 1);
        const data: {id: string; data: EligibilityScatterplotDataItem[]}[] = [];

        _.orderBy(Object.keys(aggregatedData), undefined, 'asc').forEach(
          (key: string) => {
            data.push({
              id: key,
              data: _.orderBy(
                aggregatedData[key],
                ScatterplotFieldsMapping.year,
                'asc',
              ).map(item => ({
                y: key,
                x: _.get(item, ScatterplotFieldsMapping.year, ''),
                eligibility: _.get(
                  ScatterplotFieldsMapping,
                  _.get(item, ScatterplotFieldsMapping.status, '')
                    .toLowerCase()
                    .trim(),
                  _.get(item, ScatterplotFieldsMapping.status, ''),
                ),
                incomeLevel:
                  _.get(item, ScatterplotFieldsMapping.incomeLevel, null) ===
                  null
                    ? 0
                    : _.findIndex(
                        ScatterplotFieldsMapping.incomeLevels,
                        (incomeLevel: string) =>
                          incomeLevel ===
                          _.get(
                            item,
                            ScatterplotFieldsMapping.incomeLevel,
                            'None',
                          ),
                      ),
                diseaseBurden:
                  _.get(item, ScatterplotFieldsMapping.diseaseBurden, null) ===
                  null
                    ? 0
                    : _.findIndex(
                        ScatterplotFieldsMapping.diseaseBurdens,
                        (diseaseBurden: string) =>
                          diseaseBurden ===
                          _.get(
                            item,
                            ScatterplotFieldsMapping.diseaseBurden,
                            'None',
                          ),
                      ),
              })),
            });
          },
        );

        data.forEach((item: any, index: number) => {
          years.forEach((year: number, yearindex: number) => {
            if (!_.find(item.data, {x: year})) {
              let fItemWithData = _.get(
                aggregatedDataByYear,
                `${year}[0]`,
                null,
              );
              if (yearindex === 0) {
                fItemWithData = _.get(
                  aggregatedDataByYear,
                  `${years[1]}[0]`,
                  null,
                );
              }
              const incomeLevel: number =
                _.get(
                  fItemWithData,
                  ScatterplotFieldsMapping.incomeLevel,
                  null,
                ) === null
                  ? 0
                  : _.findIndex(
                      ScatterplotFieldsMapping.incomeLevels,
                      (il: string) =>
                        il ===
                        _.get(
                          fItemWithData,
                          ScatterplotFieldsMapping.incomeLevel,
                          'None',
                        ),
                    );
              data[index].data.push({
                y: item.data[0].y,
                x: year,
                diseaseBurden: 0,
                incomeLevel,
                eligibility: 'Not Eligible',
                invisible: true,
              });
            }
          });
          data[index].data = _.orderBy(data[index].data, 'x', 'asc');
        });

        if (this.req.query.view && this.req.query.view === 'table') {
          const sortBy = this.req.query.sortBy;
          let sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'x';
          const sortByDirection: any =
            sortBy && sortBy.toString().split(' ').length > 1
              ? sortBy.toString().split(' ')[1].toLowerCase()
              : 'asc';

          switch (sortByValue) {
            case 'year':
              sortByValue = 'x';
              break;
            case 'component':
              sortByValue = 'y';
              break;
            case 'incomeLevel':
              sortByValue = 'incomeLevel';
              break;
            case 'diseaseBurden':
              sortByValue = 'diseaseBurden';
              break;
            case 'status':
              sortByValue = 'eligibility';
              break;
            default:
              break;
          }

          let tableData: EligibilityScatterplotDataItem[] = [];
          data.forEach(comp => {
            tableData = [...tableData, ...comp.data];
          });

          tableData = _.orderBy(tableData, sortByValue, sortByDirection);

          return {
            count: tableData.length,
            data: tableData,
          };
        }

        data.unshift({
          id: 'dummy1',
          data: years.map((year: number) => ({
            x: year,
            diseaseBurden: 0,
            incomeLevel: 0,
            eligibility: 'Not Eligible',
            y: 'dummy1',
            invisible: true,
          })),
        });

        data.push({
          id: 'dummy2',
          data: years.map((year: number, index: number) => {
            let fItemWithData = _.get(aggregatedDataByYear, `${year}[0]`, null);
            if (index === 0) {
              fItemWithData = _.get(
                aggregatedDataByYear,
                `${years[1]}[0]`,
                null,
              );
            }
            const incomeLevel: number =
              _.get(
                fItemWithData,
                ScatterplotFieldsMapping.incomeLevel,
                null,
              ) === null
                ? 0
                : _.findIndex(
                    ScatterplotFieldsMapping.incomeLevels,
                    (il: string) =>
                      il ===
                      _.get(
                        fItemWithData,
                        ScatterplotFieldsMapping.incomeLevel,
                        'None',
                      ),
                  );
            return {
              x: year,
              y: 'dummy2',
              diseaseBurden: 0,
              incomeLevel,
              eligibility: 'Not Eligible',
              invisible: true,
            };
          }),
        });

        return {
          count: data.length,
          data,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/eligibility/table')
  @response(200)
  eligibilityTableV2(): object {
    const aggregateByField =
      this.req.query.aggregateBy &&
      this.req.query.aggregateBy.toString().length > 0
        ? this.req.query.aggregateBy
        : EligibilityFieldsMapping.aggregateByFields[0];
    const nonAggregateByField = (
      this.req.query.nonAggregateBy
        ? this.req.query.nonAggregateBy
        : aggregateByField === EligibilityFieldsMapping.aggregateByFields[0]
        ? EligibilityFieldsMapping.aggregateByFields[1]
        : EligibilityFieldsMapping.aggregateByFields[0]
    ).toString();
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.eligibility}/?${params}${filterString}&${ScatterplotFieldsMapping.defaultSelect}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    const isLocationPage =
      _.get(this.req.query, 'locations', '').toString().split(',').length === 1;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const apiData = _.get(resp.data, ScatterplotFieldsMapping.dataPath, []);

        const data: any = [];

        const aggregatedData = _.groupBy(apiData, aggregateByField);

        Object.keys(aggregatedData).forEach(aggrKey => {
          const yearsData = _.groupBy(
            aggregatedData[aggrKey],
            ScatterplotFieldsMapping.year,
          );
          data.push({
            level1: aggrKey,
            children: _.orderBy(
              Object.keys(yearsData),
              undefined,
              sortByValue === 'level1' && isLocationPage
                ? sortByDirection
                : 'desc',
            ).map(year => {
              let incomeLevelIndex: number =
                _.get(
                  yearsData[year][0],
                  ScatterplotFieldsMapping.incomeLevel,
                  null,
                ) === null
                  ? 0
                  : _.findIndex(
                      ScatterplotFieldsMapping.incomeLevels,
                      (incomeLevel: string) =>
                        incomeLevel ===
                        _.get(
                          yearsData[year][0],
                          ScatterplotFieldsMapping.incomeLevel,
                          'None',
                        ),
                    );
              let incomeLevel: string = _.get(
                ScatterplotFieldsMapping.incomeLevels,
                incomeLevelIndex,
                'None',
              );
              const groupedByNonAggregate = _.groupBy(
                yearsData[year],
                nonAggregateByField,
              );
              return {
                level1: year,
                incomeLevel:
                  aggregateByField ===
                  EligibilityFieldsMapping.aggregateByFields[1]
                    ? incomeLevel
                    : '',
                children: _.orderBy(
                  Object.keys(groupedByNonAggregate).map(nonAggrKey => {
                    incomeLevelIndex =
                      _.get(
                        groupedByNonAggregate[nonAggrKey][0],
                        ScatterplotFieldsMapping.incomeLevel,
                        null,
                      ) === null
                        ? 0
                        : _.findIndex(
                            ScatterplotFieldsMapping.incomeLevels,
                            (incomeLevel: string) =>
                              incomeLevel ===
                              _.get(
                                yearsData[year][0],
                                ScatterplotFieldsMapping.incomeLevel,
                                'None',
                              ),
                          );
                    incomeLevel = _.get(
                      ScatterplotFieldsMapping.incomeLevels,
                      incomeLevelIndex,
                      'None',
                    );
                    return {
                      level2: nonAggrKey,
                      eligibilityStatus: _.get(
                        ScatterplotFieldsMapping.statusValues,
                        _.get(
                          groupedByNonAggregate[nonAggrKey][0],
                          ScatterplotFieldsMapping.status,
                          '',
                        ),
                        _.get(
                          groupedByNonAggregate[nonAggrKey][0],
                          ScatterplotFieldsMapping.status,
                          '',
                        ),
                      ),
                      diseaseBurden: _.get(
                        groupedByNonAggregate[nonAggrKey][0],
                        ScatterplotFieldsMapping.diseaseBurden,
                        '',
                      ),
                      incomeLevel:
                        aggregateByField ===
                        EligibilityFieldsMapping.aggregateByFields[0]
                          ? incomeLevel
                          : '',
                    };
                  }),
                  sortByValue,
                  sortByDirection,
                ),
              };
            }),
          });
        });

        return {
          count: data.length,
          data: _.orderBy(data, sortByValue, sortByDirection),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/eligibility/status/codelist')
  @response(200)
  eligibilityStatusCodelist(): object {
    const keys = Object.keys(ScatterplotFieldsMapping.statusValues);
    return {
      count: keys.length,
      data: keys.map(key => ({
        value: key,
        label: _.get(ScatterplotFieldsMapping.statusValues, `[${key}]`, key),
      })),
    };
  }

  @get('/v2/eligibility/disease-burden/codelist')
  @response(200)
  eligibilityDiseaseBurdenCodelist(): object {
    return {
      count: ScatterplotFieldsMapping.diseaseBurdens.length,
      data: ScatterplotFieldsMapping.diseaseBurdens.map(db => ({
        value: db,
        label: db,
      })),
    };
  }
}

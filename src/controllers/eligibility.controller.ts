import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _, {orderBy} from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import EligibilityFieldsMapping from '../config/mapping/eligibility/dotsChart.json';
import ScatterplotFieldsMapping from '../config/mapping/eligibility/scatterplot.json';
import EligibilityYearsFieldsMapping from '../config/mapping/eligibility/years.json';
import urls from '../config/urls/index.json';
import {EligibilityDotDataItem} from '../interfaces/eligibilityDot';
import {EligibilityScatterplotDataItem} from '../interfaces/eligibilityScatterplot';
import {handleDataApiError} from '../utils/dataApiError';
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

  @get('/eligibility')
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
          data: orderBy(
            data,
            outSortByValue,
            inSortByValue === 'status' ? 'asc' : sortByDirection,
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/eligibility/years')
  @response(200, ELIGIBILITY_RESPONSE)
  eligibilityYears(): object {
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

  @get('/eligibility/country')
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

        (
          _.orderBy(Object.keys(aggregatedData), undefined, 'asc') as string[]
        ).forEach((key: string) => {
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
                _.get(item, ScatterplotFieldsMapping.incomeLevel, null) === null
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
        });

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

          tableData = orderBy(tableData, sortByValue, sortByDirection);

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
}

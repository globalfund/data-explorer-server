import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import resultsMap from '../config/mapping/results/index.json';
import resultStatsMap from '../config/mapping/results/stats.json';
import resultsUtils from '../config/mapping/results/utils.json';
import ResultsYearsMappingFields from '../config/mapping/results/years.json';
import urls from '../config/urls/index.json';
import {ResultListItemModel} from '../interfaces/resultList';
import {handleDataApiError} from '../utils/dataApiError';
import {
  getFilterString,
  getFilterStringForStats,
} from '../utils/filtering/results/getFilterString';

const RESULTS_RESPONSE: ResponseObject = {
  description: 'Results Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'Results Response',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                title: {type: 'string'},
                value: {type: 'number'},
                component: {type: 'string'},
                geoLocations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
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
const RESULT_STATS_RESPONSE: ResponseObject = {
  description: 'Result Stats Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'ResultStatsResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                value: {type: 'number'},
                description: {type: 'string'},
              },
            },
          },
        },
      },
    },
  },
};

export class ResultsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/results')
  @response(200, RESULTS_RESPONSE)
  results(): object {
    const mapper = mapTransform(resultsMap);
    const filterString = getFilterString(this.req.query);
    const url = `${urls.results}/?${resultsUtils.defaultSelect}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        const data: ResultListItemModel[] = [];
        // @ts-ignore
        const groupedByIndicator = _.groupBy(mappedData, 'title');

        Object.keys(groupedByIndicator).forEach((indicator: string) => {
          data.push({
            id: _.get(groupedByIndicator[indicator], '[0].id', ''),
            title: _.get(groupedByIndicator[indicator], '[0].title', ''),
            value: _.sumBy(groupedByIndicator[indicator], 'value'),
            component: _.get(
              groupedByIndicator[indicator],
              '[0].component',
              '',
            ),
            geoLocations: _.orderBy(
              groupedByIndicator[indicator].map((item: any) => ({
                name: item.country,
                value: item.value,
              })),
              'name',
              'asc',
            ),
          });
        });

        return {
          count: data.length,
          data,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/results/years')
  @response(200, RESULTS_RESPONSE)
  resultYears(): object {
    const url = `${urls.results}/?${ResultsYearsMappingFields.aggregation}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return {
          data: _.get(
            resp.data,
            ResultsYearsMappingFields.dataPath,
            [],
          ).map((item: any) => _.get(item, ResultsYearsMappingFields.year, '')),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/results-stats')
  @response(200, RESULT_STATS_RESPONSE)
  resultStats(): object {
    const filterString = getFilterStringForStats(
      this.req.query,
      resultStatsMap.ResultStatsAggregation,
    );
    const url = `${urls.results}/?${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, resultStatsMap.dataPath, []);
        return {
          count: rawData.length,
          data: rawData.map((item: any) => ({
            name: _.get(item, resultStatsMap.name, ''),
            value: _.get(item, resultStatsMap.value, ''),
            description: _.get(item, resultStatsMap.description, ''),
          })),
        };
      })
      .catch(handleDataApiError);
  }
}

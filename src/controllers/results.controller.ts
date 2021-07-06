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
import {mapTransform} from 'map-transform';
// import {getPage} from '../config/filtering/utils';
import resultsMap from '../config/mapping/results/index.json';
import resultStatsMap from '../config/mapping/results/stats.json';
import resultsUtils from '../config/mapping/results/utils.json';
import urls from '../config/urls/index.json';
import {ResultListItemModel} from '../interfaces/resultList';
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
    const filterString = getFilterString(
      this.req.query,
      resultsUtils.defaultFilter,
    );
    // const page = (this.req.query.page ?? '1').toString();
    // const pageSize = (this.req.query.pageSize ?? '10').toString();
    // const orderBy = this.req.query.orderBy ?? resultsUtils.defaultOrderBy;
    // const params = querystring.stringify(
    //   {
    //     ...getPage(filtering.page, parseInt(page, 10), parseInt(pageSize, 10)),
    //     [filtering.page_size]: pageSize,
    //   },
    //   '&',
    //   filtering.param_assign_operator,
    //   {
    //     encodeURIComponent: (str: string) => str,
    //   },
    // );
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/results-stats')
  @response(200, RESULT_STATS_RESPONSE)
  resultStats(): object {
    const filterString = getFilterStringForStats(
      this.req.query,
      resultStatsMap.ResultStatsAggregation,
    );
    // const params = querystring.stringify(
    //   {
    //     ...getPage(filtering.page, parseInt(page, 10), parseInt(pageSize, 10)),
    //     [filtering.page_size]: pageSize,
    //   },
    //   '&',
    //   filtering.param_assign_operator,
    //   {
    //     encodeURIComponent: (str: string) => str,
    //   },
    // );
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

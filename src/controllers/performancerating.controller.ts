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
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import performanceratingMapping from '../config/mapping/performancerating/index.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';

const PERFORMANCE_RATING_RESPONSE: ResponseObject = {
  description: 'Performance Rating Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PerformanceRatingResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: {type: 'string'},
                rating: {type: 'number'},
              },
            },
          },
        },
      },
    },
  },
};

export class PerformanceratingController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/performance-rating')
  @response(200, PERFORMANCE_RATING_RESPONSE)
  performancerating(): object {
    if (!this.req.query.grantId && !this.req.query.IPnumber) {
      return {
        data: [],
        message: '"grantId" and "IPnumber" parameters is required.',
      };
    }
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.performancerating}/?${performanceratingMapping.defaultSelect}${performanceratingMapping.defaultOrderBy}${performanceratingMapping.defaultExpand}&$filter=performanceRating/performanceRatingCode ne null and grantAgreementImplementationPeriod/grantAgreement/grantAgreementNumber eq ${this.req.query.grantId} and grantAgreementImplementationPeriod/implementationPeriodNumber eq ${this.req.query.IPnumber}&${filtering.default_q_param}${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, performanceratingMapping.dataPath, []);
        const data: Record<string, unknown>[] = [];

        rawData.forEach((item: any) => {
          const dates = [
            new Date(_.get(item, performanceratingMapping.startDate, null)),
            new Date(_.get(item, performanceratingMapping.endDate, null)),
          ];
          data.push({
            year: `${dates[0].toLocaleString('default', {
              month: 'short',
            })} ${dates[0].getUTCFullYear()} - ${dates[1].toLocaleString(
              'default',
              {month: 'short'},
            )} ${dates[1].getUTCFullYear()}`,
            rating: _.get(
              performanceratingMapping.ratingValues,
              _.get(item, performanceratingMapping.rating, 'N/A'),
              0,
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
}

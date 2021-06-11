import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError, AxiosResponse} from 'axios';
import {mapTransform} from 'map-transform';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import performanceframeworkMap from '../config/mapping/performanceframework/index.json';
import performanceframeworkMappingUtils from '../config/mapping/performanceframework/utils.json';
import urls from '../config/urls/index.json';
import {formatPFData} from '../utils/performanceframework/formatPFData';
import {getTimeframes} from '../utils/performanceframework/getTimeframes';

const PERFORMANCE_FRAMEWORK_RESPONSE: ResponseObject = {
  description: 'Performance Framework Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PerformanceFrameworkResponse',
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

export class PerformanceframeworkController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/performance-framework')
  @response(200, PERFORMANCE_FRAMEWORK_RESPONSE)
  performancerating(): object {
    const mapper = mapTransform(performanceframeworkMap);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.performanceframework}/?${performanceframeworkMappingUtils.defaultSelect}${performanceframeworkMappingUtils.defaultExpand}${performanceframeworkMappingUtils.defaultFilter}&${filtering.default_q_param}${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        const timeframes = getTimeframes(mappedData);

        const timeframeIndexParam = this.req.query.timeframeIndex
          ? parseInt(this.req.query.timeframeIndex.toString(), 10)
          : 0;
        let selectedTimeframes = [];

        if (
          timeframeIndexParam < 0 ||
          timeframeIndexParam > timeframes.length - 2
        ) {
          selectedTimeframes = timeframes;
        } else {
          selectedTimeframes = [
            timeframes[timeframeIndexParam],
            timeframes[timeframeIndexParam + 1],
          ];
        }

        const data = formatPFData(mappedData, selectedTimeframes);

        return {
          data,
          timeframes,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

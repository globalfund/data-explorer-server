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
import EligibilityFieldsMapping from '../config/mapping/eligibility/dotsChart.json';
import ScatterplotFieldsMapping from '../config/mapping/eligibility/scatterplot.json';
import urls from '../config/urls/index.json';
import {EligibilityDotDataItem} from '../interfaces/eligibilityDot';
import {EligibilityScatterplotDataItem} from '../interfaces/eligibilityScatterplot';
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
      this.req.query.nonAggregateBy ??
      EligibilityFieldsMapping.aggregateByFields[1]
    ).toString();
    const filterString = getFilterString(
      this.req.query,
      EligibilityFieldsMapping.defaultFilter,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.eligibility}/?${params}${filterString}&${EligibilityFieldsMapping.defaultSelect}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const apiData = _.get(resp.data, EligibilityFieldsMapping.dataPath, []);
        const aggregatedData = _.groupBy(apiData, aggregateByField);
        const data: EligibilityDotDataItem[] = [];

        (_.orderBy(
          Object.keys(aggregatedData),
          undefined,
          'asc',
        ) as string[]).forEach((key: string) => {
          data.push({
            name: key,
            items: _.orderBy(
              aggregatedData[key],
              nonAggregateByField,
              'asc',
            ).map(item => ({
              name: _.get(item, nonAggregateByField, ''),
              status: _.get(
                EligibilityFieldsMapping,
                _.get(item, EligibilityFieldsMapping.status, '')
                  .toLowerCase()
                  .trim(),
                _.get(item, EligibilityFieldsMapping.status, ''),
              ),
            })),
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
        const data: {id: string; data: EligibilityScatterplotDataItem[]}[] = [
          {
            id: ' ',
            data: [
              {
                x: 2002,
                diseaseBurden: 0,
                incomeLevel: 0,
                eligibility: 'Not Eligible',
                y: ' ',
              },
            ],
          },
        ];

        (_.orderBy(
          Object.keys(aggregatedData),
          undefined,
          'asc',
        ) as string[]).forEach((key: string) => {
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

        data.push({
          id: '',
          data: [
            {
              x: 2002,
              diseaseBurden: 0,
              incomeLevel: 0,
              eligibility: 'Not Eligible',
              y: '',
            },
          ],
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
}

import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';

import axios, {AxiosResponse} from 'axios';
import fs from 'fs-extra';
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';

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
export class DisbursementsDatasetsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}
  @get('/disbursement-dataset')
  @response(200, DISBURSEMENTS_TREEMAP_RESPONSE)
  treemapCommitment(): object {
    const url = `${urls.disbursements}`;
    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        const element = data[0];
        Object.keys(element).forEach(key => {
          if (element[key]) {
            filterOptionGroups.push(key);
            dataTypes = {
              ...dataTypes,
              [key]: typeof element[key],
            };
          }
        });
        const body = {
          count: resp.data.value.length,
          dataset: resp.data.value,
          sample: resp.data.value,
          dataTypes,
          errors: [],
          filterOptionGroups,
          stats: [],
        };
        fs.writeFileSync(
          `./src/parsed-data-files/disbursement-dataset.json`,
          JSON.stringify(body, null, 4),
        );

        return body;
      })
      .catch(handleDataApiError);
  }
}

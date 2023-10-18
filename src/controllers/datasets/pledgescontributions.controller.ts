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

const PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE: ResponseObject = {
  description: 'Pledges and Contributions time-cycle Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PledgesContributionsTimeCycleResponse',
        properties: {
          count: {type: 'number'},
          data: {
            type: 'array',
            properties: {
              year: {type: 'string'},
              pledge: {type: 'number'},
              contribution: {type: 'number'},
              pledgeColor: {type: 'string'},
              contributionColor: {type: 'string'},
            },
          },
        },
      },
    },
  },
};

export class PledgescontributionsDatasetController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}
  @get('/pledges-contributions-dataset')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  table(): object {
    const url = `${urls.pledgescontributions}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;

        const sample = data.map((item: any) => {
          const tempItem = {
            ...item,
          };
          delete tempItem['pledgeContributionId'];
          delete tempItem['replenishmentPeriodId'];
          delete tempItem['donorId'];

          return tempItem;
        });

        const element = sample[0];

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
          dataset: sample,
          sample,
          dataTypes,
          errors: [],
          filterOptionGroups,
          stats: [],
        };
        fs.writeFileSync(
          `./src/parsed-data-files/pledges-contributions-dataset.json`,
          JSON.stringify(body, null, 4),
        );

        return body;
      })
      .catch(handleDataApiError);
  }
}

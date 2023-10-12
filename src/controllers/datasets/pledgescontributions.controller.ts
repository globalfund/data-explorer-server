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
import querystring from 'querystring';
import filtering from '../../config/filtering/index.json';
import PledgesContributionsTableFieldsMapping from '../../config/mapping/pledgescontributions/table.json';
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';
import {getFilterString} from '../../utils/filtering/pledges-contributions/getFilterString';

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
    const aggregation =
      PledgesContributionsTableFieldsMapping.aggregations[
        this.req.query.aggregateBy ===
        PledgesContributionsTableFieldsMapping.aggregations[0].key
          ? 0
          : 1
      ].value;

    const filterString = getFilterString(this.req.query, aggregation);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        const element = data[0];
        filterOptionGroups.push('replenishmentPeriod');

        Object.keys(element).forEach(key => {
          if (element[key]) {
            if (key !== '@odata.id' && key !== 'replenishmentPeriod') {
              filterOptionGroups.push(key);
            }
            dataTypes = {
              ...dataTypes,
              [key]: typeof element[key],
            };
          }
        });
        const sample = resp.data.value.map((item: any) => {
          const tempItem = {
            ...item,
            replenishmentPeriodName:
              item.replenishmentPeriod.replenishmentPeriodName,
          };
          delete tempItem['@odata.id'];
          delete tempItem['replenishmentPeriod'];
          return tempItem;
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

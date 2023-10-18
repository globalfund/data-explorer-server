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
import {mapTransform} from 'map-transform';
import querystring from 'querystring';
import filtering from '../../config/filtering/index.json';
import {getPage} from '../../config/filtering/utils';
import grantsMap from '../../config/mapping/grants/index.json';
import grantsUtils from '../../config/mapping/grants/utils.json';
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';
import {getFilterString} from '../../utils/filtering/grants/getFilterString';

const GRANTS_RESPONSE: ResponseObject = {
  description: 'Grants Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'GrantsResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                title: {type: 'string'},
                status: {type: 'string'},
                component: {type: 'string'},
                geoLocation: {type: 'string'},
                rating: {type: 'string'},
                disbursed: {type: 'number'},
                committed: {type: 'number'},
                signed: {type: 'number'},
              },
            },
          },
        },
      },
    },
  },
};
export class GrantsDatasetController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/grants-dataset')
  @response(200, GRANTS_RESPONSE)
  grants(): object {
    const mapper = mapTransform(grantsMap);
    const page = (this.req.query.page ?? '1').toString();
    const pageSize = (this.req.query.pageSize ?? '100').toString();
    const orderBy = this.req.query.orderBy ?? grantsUtils.defaultOrderBy;
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {
        ...getPage(filtering.page, parseInt(page, 10), parseInt(pageSize, 10)),
        [filtering.page_size]: pageSize,
      },
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.grants}${filterString}${filtering.orderby}${
      filtering.param_assign_operator
    }${orderBy}${parseInt(pageSize, 10) > 0 ? `&${params}` : ''}`;

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
        // const res: GrantListItemModel[] = mapper(resp.data) as never[];
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
          `./src/parsed-data-files/grants-dataset.json`,
          JSON.stringify(body, null, 4),
        );

        return body;
      })
      .catch(handleDataApiError);
  }
}

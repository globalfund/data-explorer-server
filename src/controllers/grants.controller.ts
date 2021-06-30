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
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import {getPage} from '../config/filtering/utils';
import grantDetailMap from '../config/mapping/grants/grantDetail.json';
import grantsMap from '../config/mapping/grants/index.json';
import grantsUtils from '../config/mapping/grants/utils.json';
import urls from '../config/urls/index.json';
import {GrantDetailInformation} from '../interfaces/grantDetail';
import {GrantListItemModel} from '../interfaces/grantList';
import {getFilterString} from '../utils/filtering/grants/getFilterString';

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

export class GrantsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/grants')
  @response(200, GRANTS_RESPONSE)
  grants(): object {
    const mapper = mapTransform(grantsMap);
    const page = (this.req.query.page ?? '1').toString();
    const pageSize = (this.req.query.pageSize ?? '10').toString();
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
    const url = `${urls.grants}${filterString}${filtering.orderby}${filtering.param_assign_operator}${orderBy}&${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantListItemModel[] = mapper(resp.data) as never[];
        return {
          count: resp.data[grantsUtils.countPath],
          data: res,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/grant/detail')
  @response(200, GRANTS_RESPONSE)
  grantDetail(): object {
    const grantNumber = _.get(this.req.query, 'grantNumber', null);
    if (!grantNumber) {
      return {
        data: {},
        message: '"grantNumber" parameter is required.',
      };
    }
    const mapper = mapTransform(grantDetailMap);
    const url = `${urls.grantsNoCount}/?$top=1&$filter=grantAgreementNumber eq '${grantNumber}'`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantDetailInformation[] = mapper(resp.data) as never[];
        return {
          data: res,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

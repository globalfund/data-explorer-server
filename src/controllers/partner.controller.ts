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
import partnerMappingFields from '../config/mapping/partner/index.json';
import urls from '../config/urls/index.json';
import {getFilterString} from '../utils/filtering/partner/getFilterString';

const PARTNER_INFO_RESPONSE: ResponseObject = {
  description: 'Partner Information Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PartnerInfoResponse',
        properties: {},
      },
    },
  },
};

export class PartnerController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/partner/detail')
  @response(200, PARTNER_INFO_RESPONSE)
  partnerDetail(): object {
    const partners = _.get(this.req.query, 'partners', '') as string;
    if (partners.length === 0) {
      return {
        data: {},
        message: '"partners" parameter is required.',
      };
    }
    const filterString = getFilterString(
      this.req.query,
      partnerMappingFields.url,
    );
    const url = `${urls.grantsNoCount}/?${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, partnerMappingFields.dataPath, []);
        return {
          data: {
            partnerName: _.get(rawData, partnerMappingFields.partnerName, ''),
          },
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

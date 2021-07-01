import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError} from 'axios';
import _ from 'lodash';
import locationMappingFields from '../config/mapping/location/index.json';
import urls from '../config/urls/index.json';
import {getFilterString} from '../utils/filtering/grants/getFilterString';

const LOCATION_INFO_RESPONSE: ResponseObject = {
  description: 'Location Information Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'LocationInfoResponse',
        properties: {},
      },
    },
  },
};

export class LocationController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/location/detail')
  @response(200, LOCATION_INFO_RESPONSE)
  locationDetail(): object {
    const locations = _.get(this.req.query, 'locations', '') as string;
    if (locations.length === 0) {
      return {
        data: {},
        message: '"locations" parameter is required.',
      };
    }
    const multicountriesUrl = `${
      urls.multicountries
    }/?${locationMappingFields.multiCountriesFilterString.replace(
      '<location>',
      locations.split(',')[0] as string,
    )}`;
    const filterString = getFilterString(
      this.req.query,
      locationMappingFields.locationFinancialAggregation,
    );
    const financialUrl = `${urls.grantsNoCount}/?${filterString}`;

    return axios
      .all([axios.get(multicountriesUrl), axios.get(financialUrl)])
      .then(
        axios.spread((...responses) => {
          const multicountriesResp = _.get(
            responses[0].data,
            locationMappingFields.multiCountriesDataPath,
            [],
          );
          const locationFinancialResp = _.get(
            responses[1].data,
            locationMappingFields.locationFinancialDataPath,
            {
              locationName: '',
              disbursed: 0,
              committed: 0,
              signed: 0,
              portfolioManager: '',
              portfolioManagerEmail: '',
            },
          );

          return {
            data: [
              {
                ...{
                  locationName: _.get(
                    locationFinancialResp,
                    locationMappingFields.locationName,
                    '',
                  ),
                  disbursed: _.get(
                    locationFinancialResp,
                    locationMappingFields.disbursed,
                    0,
                  ),
                  committed: _.get(
                    locationFinancialResp,
                    locationMappingFields.committed,
                    0,
                  ),
                  signed: _.get(
                    locationFinancialResp,
                    locationMappingFields.signed,
                    0,
                  ),
                  portfolioManager: _.get(
                    locationFinancialResp,
                    locationMappingFields.portfolioManager,
                    '',
                  ),
                  portfolioManagerEmail: _.get(
                    locationFinancialResp,
                    locationMappingFields.portfolioManagerEmail,
                    '',
                  ),
                },
                multicountries: multicountriesResp.map((mc: any) => ({
                  name: _.get(mc, locationMappingFields.multiCountryName, ''),
                  code: _.get(mc, locationMappingFields.multiCountryCode, ''),
                })),
              },
            ],
          };
        }),
      )
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

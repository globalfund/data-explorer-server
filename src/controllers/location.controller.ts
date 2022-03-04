import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios from 'axios';
import _ from 'lodash';
import filtering from '../config/filtering/index.json';
import locationMappingFields from '../config/mapping/location/index.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
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
    const location = locations.split(',')[0];
    const multicountriesUrl = `${urls.multicountries}/?${locationMappingFields[
      location.length > 3
        ? 'countriesFilterString'
        : 'multiCountriesFilterString'
    ].replace('<location>', location as string)}`;
    const filterString = getFilterString(
      this.req.query,
      locationMappingFields.locationFinancialAggregation,
    );
    const financialUrl = `${urls.grantsNoCount}/?${filterString}`;
    const indicatorsUrl = `${urls.indicators}/?${filtering.filter_operator}${
      filtering.param_assign_operator
    }${locationMappingFields.locationIndicatorsDefaultFilter} ${
      filtering.and_operator
    } ${locationMappingFields.locationIndicatorsLocationFilter.replace(
      '<location>',
      location as string,
    )}&${filtering.orderby}${filtering.param_assign_operator}${
      locationMappingFields.locationIndicatorsDefaultOrder
    }&${filtering.page_size}${filtering.param_assign_operator}${
      locationMappingFields.locationIndicatorsDefaultCap
    }`;

    return axios
      .all([
        axios.get(multicountriesUrl),
        axios.get(financialUrl),
        axios.get(indicatorsUrl),
      ])
      .then(
        axios.spread((...responses) => {
          const multicountriesResp = _.get(
            responses[0].data,
            locationMappingFields.multiCountriesDataPath,
            [],
          );
          const countriesResp = _.get(
            responses[0].data,
            locationMappingFields.countriesDataPath,
            [],
          );
          const locationFinancialResp = _.get(
            responses[1].data,
            locationMappingFields.locationFinancialDataPath,
            {
              locationName: '',
              multiCountryName: '',
              disbursed: 0,
              committed: 0,
              signed: 0,
              portfolioManager: '',
              portfolioManagerEmail: '',
              geoId: '',
              multiCountryId: '',
            },
          );
          const locationIndicatorsResp = _.get(
            responses[2].data,
            locationMappingFields.locationIndicatorsDataPath,
            [],
          );

          return {
            data: [
              {
                id: _.get(
                  locationFinancialResp,
                  location.length > 3
                    ? locationMappingFields.multiCountryId
                    : locationMappingFields.geoId,
                  '',
                ),
                locationName: _.get(
                  locationFinancialResp,
                  location.length > 3
                    ? locationMappingFields.multiCountryName
                    : locationMappingFields.locationName,
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
                multicountries:
                  location.length > 3
                    ? []
                    : _.orderBy(
                        multicountriesResp.map((mc: any) => ({
                          name: _.get(
                            mc,
                            locationMappingFields.multiCountryName,
                            '',
                          ),
                          code: _.get(
                            mc,
                            locationMappingFields.multiCountryName,
                            '',
                          ).replace(/\//g, '|'),
                        })),
                        'name',
                        'asc',
                      ),
                countries:
                  location.length > 3
                    ? _.orderBy(
                        countriesResp.map((loc: any) => ({
                          name: _.get(
                            loc,
                            locationMappingFields.countryName,
                            '',
                          ),
                          code: _.get(
                            loc,
                            locationMappingFields.countryCode,
                            '',
                          ),
                        })),
                        'name',
                        'asc',
                      )
                    : [],
                indicators: locationIndicatorsResp.map((indicator: any) => ({
                  name: _.get(
                    indicator,
                    locationMappingFields.locationIndicatorName,
                    '',
                  ),
                  year: _.get(
                    indicator,
                    locationMappingFields.locationIndicatorYear,
                    '',
                  ),
                  value: _.get(
                    indicator,
                    locationMappingFields.locationIndicatorValue,
                    '',
                  ),
                })),
              },
            ],
          };
        }),
      )
      .catch(handleDataApiError);
  }
}

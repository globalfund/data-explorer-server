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
    const principalRecipientsFilterString = getFilterString(
      this.req.query,
      locationMappingFields.principalRecipientAggregation,
    );
    const principalRecipientsUrl = `${urls.grantsNoCount}/?${principalRecipientsFilterString}`;
    const contactsUrl = `${
      urls.countrycontactinfo
    }/?${locationMappingFields.contactsFilterString.replace(
      /<code>/g,
      location,
    )}`;

    return axios
      .all([
        axios.get(multicountriesUrl),
        axios.get(financialUrl),
        axios.get(principalRecipientsUrl),
        axios.get(contactsUrl),
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
          const principalRecipientsResp = _.get(
            responses[2].data,
            locationMappingFields.multiCountriesDataPath,
            [],
          );
          const contactsResp = _.get(
            responses[3].data,
            locationMappingFields.contactsDataPath,
            [],
          );

          const formattedContactsResp = contactsResp.map((c: any) => ({
            orgName: _.get(
              c,
              locationMappingFields.contactOrganisationName,
              '',
            ),
            name: _.get(c, locationMappingFields.contactName, ''),
            surname: _.get(c, locationMappingFields.contactSurname, ''),
            role: _.get(c, locationMappingFields.contactRole, ''),
            salutation: _.get(c, locationMappingFields.contactSalutation, ''),
            position: _.get(c, locationMappingFields.contactPosition, ''),
            email: _.get(c, locationMappingFields.contactEmail, ''),
          }));

          const contacts: any[] = [];
          const groupedBy = _.groupBy(formattedContactsResp, 'orgName');

          Object.keys(groupedBy).forEach((key: string) => {
            contacts.push({
              name: key,
              items: groupedBy[key]
                .map((item: any) => ({
                  name: `${item.salutation} ${
                    item.name
                  } ${item.surname.toUpperCase()}`,
                  role: item.role,
                  position: item.position,
                  email: item.email,
                }))
                .sort(
                  (a, b) =>
                    _.get(
                      locationMappingFields.contactRoleOrder,
                      `[${a.role}]`,
                      0,
                    ) -
                    _.get(
                      locationMappingFields.contactRoleOrder,
                      `[${b.role}]`,
                      0,
                    ),
                ),
            });
          });

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
                principalRecipients: _.filter(
                  principalRecipientsResp.map((pr: any) => {
                    const fullName = _.get(
                      pr,
                      locationMappingFields.principalRecipientName,
                      '',
                    );
                    const shortName = _.get(
                      pr,
                      locationMappingFields.principalRecipientShortName,
                      '',
                    );
                    const id = _.get(
                      pr,
                      locationMappingFields.principalRecipientId,
                      '',
                    );

                    return {
                      code: id,
                      name: `${fullName}${shortName ? ` (${shortName})` : ''}`,
                    };
                  }),
                  (pr: any) => pr.code,
                ),
                coordinatingMechanismContacts: _.orderBy(
                  contacts,
                  'name',
                  'asc',
                ),
              },
            ],
          };
        }),
      )
      .catch(handleDataApiError);
  }
}

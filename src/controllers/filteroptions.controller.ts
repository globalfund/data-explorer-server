import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import ComponentMapping from '../config/mapping/filter-options/components.json';
import DonorMapping from '../config/mapping/filter-options/donors.json';
import GeographyMapping from '../config/mapping/filter-options/geography.json';
import PrincipalRecipientMapping from '../config/mapping/filter-options/principal-recipients.json';
import ReplenishmentPeriodMapping from '../config/mapping/filter-options/replenishment-periods.json';
import ResultsComponentMapping from '../config/mapping/filter-options/results-components.json';
import StatusMapping from '../config/mapping/filter-options/status.json';
import mappingComponents from '../config/mapping/filteroptions/components.json';
import mappingDonors from '../config/mapping/filteroptions/donors.json';
import mappingLocations from '../config/mapping/filteroptions/locations.json';
import mappingMulticountries from '../config/mapping/filteroptions/multicountries.json';
import mappingPartnertypes from '../config/mapping/filteroptions/partnertypes.json';
import mappingReplenishmentperiods from '../config/mapping/filteroptions/replenishmentperiods.json';
import mappingStatus from '../config/mapping/filteroptions/status.json';
import urls from '../config/urls/index.json';
import {FilterGroupOption} from '../interfaces/filters';
import {handleDataApiError} from '../utils/dataApiError';

const FILTER_OPTIONS_RESPONSE: ResponseObject = {
  description: 'Filter Options Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'FilterOptionsResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                value: {type: 'string'},
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      value: {type: 'string'},
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: {type: 'string'},
                            value: {type: 'string'},
                            options: {
                              type: 'array',
                              items: {},
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
    },
  },
};

export class FilteroptionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

  @get('/filter-options/geography')
  @response(200)
  async filterOptionsGeography() {
    const url = urls.FILTER_OPTIONS_GEOGRAPHY;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, GeographyMapping.dataPath, []);
        const data: FilterGroupOption[] = [];

        rawData.forEach((item1: any) => {
          const options = _.get(item1, GeographyMapping.children, []);
          data.push({
            name: _.get(item1, GeographyMapping.label, ''),
            value: _.get(item1, GeographyMapping.value, ''),
            extraInfo: {
              isDonor: _.get(item1, GeographyMapping.isDonor, false),
              isRecipient: _.get(item1, GeographyMapping.isRecipient, false),
              level: _.get(item1, GeographyMapping.level, undefined),
            },
            options:
              options && options.length > 0
                ? _.orderBy(
                    options.map((item2: any) => {
                      const item2options = _.get(
                        item2,
                        GeographyMapping.children,
                        [],
                      );
                      return {
                        name: _.get(item2, GeographyMapping.label, ''),
                        value: _.get(item2, GeographyMapping.value, ''),
                        extraInfo: {
                          isDonor: _.get(
                            item2,
                            GeographyMapping.isDonor,
                            false,
                          ),
                          isRecipient: _.get(
                            item2,
                            GeographyMapping.isRecipient,
                            false,
                          ),
                          level: _.get(
                            item2,
                            GeographyMapping.level,
                            undefined,
                          ),
                        },
                        options:
                          item2options && item2options.length > 0
                            ? _.orderBy(
                                item2options.map((item3: any) => {
                                  const item3options = _.get(
                                    item3,
                                    GeographyMapping.children,
                                    [],
                                  );
                                  return {
                                    name: _.get(
                                      item3,
                                      GeographyMapping.label,
                                      '',
                                    ),
                                    value: _.get(
                                      item3,
                                      GeographyMapping.value,
                                      '',
                                    ),
                                    extraInfo: {
                                      isDonor: _.get(
                                        item3,
                                        GeographyMapping.isDonor,
                                        false,
                                      ),
                                      isRecipient: _.get(
                                        item3,
                                        GeographyMapping.isRecipient,
                                        false,
                                      ),
                                      level: _.get(
                                        item3,
                                        GeographyMapping.level,
                                        undefined,
                                      ),
                                    },
                                    options:
                                      item3options && item3options.length > 0
                                        ? _.orderBy(
                                            item3options.map((item4: any) => {
                                              return {
                                                name: _.get(
                                                  item4,
                                                  GeographyMapping.label,
                                                  '',
                                                ),
                                                value: _.get(
                                                  item4,
                                                  GeographyMapping.value,
                                                  '',
                                                ),
                                                extraInfo: {
                                                  isDonor: _.get(
                                                    item4,
                                                    GeographyMapping.isDonor,
                                                    false,
                                                  ),
                                                  isRecipient: _.get(
                                                    item4,
                                                    GeographyMapping.isRecipient,
                                                    false,
                                                  ),
                                                  level: _.get(
                                                    item4,
                                                    GeographyMapping.level,
                                                    undefined,
                                                  ),
                                                },
                                              };
                                            }),
                                            'name',
                                            'asc',
                                          )
                                        : undefined,
                                  };
                                }),
                                'name',
                                'asc',
                              )
                            : undefined,
                      };
                    }),
                    'name',
                    'asc',
                  )
                : undefined,
          });
        });

        return {
          data: {
            id: 'geography',
            name: 'Geography',
            options: _.orderBy(data, 'name', 'asc'),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/components')
  @response(200)
  async filterOptionsComponents() {
    const url = urls.FILTER_OPTIONS_COMPONENTS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, ComponentMapping.dataPath, []);

        return {
          data: {
            id: 'component',
            name: 'Component',
            options: _.orderBy(
              rawData.map((item: any) => ({
                name: _.get(item, ComponentMapping.label, ''),
                value: _.get(item, ComponentMapping.value, ''),
              })),
              'name',
              'asc',
            ),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/replenishment-periods')
  @response(200)
  async filterOptionsReplenishmentPeriods() {
    const url = urls.FILTER_OPTIONS_REPLENISHMENT_PERIODS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          ReplenishmentPeriodMapping.dataPath,
          [],
        );

        return {
          data: {
            id: 'replenishmentPeriod',
            name: 'Replenishment period',
            options: _.orderBy(
              rawData.map((item: any) => ({
                name: _.get(item, ReplenishmentPeriodMapping.label, ''),
                value: _.get(item, ReplenishmentPeriodMapping.value, ''),
              })),
              'label',
              'asc',
            ),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/donors')
  @response(200)
  async filterOptionsDonors() {
    const url = urls.FILTER_OPTIONS_DONORS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, DonorMapping.dataPath, []);

        const options: FilterGroupOption[] = [];

        _.map(_.groupBy(rawData, DonorMapping.type), (donors, type) => {
          const typeOptions: FilterGroupOption = {
            name: type,
            value: type,
            options: donors.map((donor: any) => ({
              name: donor[DonorMapping.label],
              value: donor[DonorMapping.value],
            })),
          };

          options.push(typeOptions);
        });

        return {
          data: {
            id: 'donor',
            name: 'Donor',
            options: _.orderBy(options, 'name', 'asc'),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/principal-recipients')
  @response(200)
  async filterOptionsPRs() {
    const url = urls.FILTER_OPTIONS_PRINCIPAL_RECIPIENTS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PrincipalRecipientMapping.dataPath,
          [],
        );

        const options: FilterGroupOption[] = [];

        _.map(
          _.groupBy(rawData, PrincipalRecipientMapping.type),
          (prs, type) => {
            const typeOptions: FilterGroupOption = {
              name: type,
              value: _.get(prs[0], PrincipalRecipientMapping.typeCode, ''),
              options: prs.map((pr: any) => ({
                name: _.get(pr, PrincipalRecipientMapping.label, ''),
                value: _.get(pr, PrincipalRecipientMapping.value, ''),
              })),
            };

            options.push(typeOptions);
          },
        );

        return {
          data: {
            id: 'principalRecipient',
            name: 'Principal Recipient',
            options: _.orderBy(options, 'name', 'asc'),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/status')
  @response(200)
  async filterOptionsStatus() {
    const url = urls.FILTER_OPTIONS_STATUS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, StatusMapping.dataPath, []);

        const options: FilterGroupOption[] = rawData.map((item: any) => ({
          name: _.get(item, StatusMapping.label, ''),
          value: _.get(item, StatusMapping.value, ''),
        }));

        return {
          data: {
            id: 'status',
            name: 'Status',
            options: _.orderBy(options, 'name', 'asc'),
          },
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/results/components')
  @response(200)
  async filterOptionsResultComponents() {
    const url = urls.FILTER_OPTIONS_RESULTS_COMPONENTS;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, ResultsComponentMapping.dataPath, []);

        const groupedByComponent = _.groupBy(
          rawData,
          ResultsComponentMapping.label,
        );

        return {
          data: {
            id: 'component',
            name: 'Components & Indicators',
            options: _.orderBy(
              _.map(groupedByComponent, (items, key) => ({
                name: key,
                value: _.get(items[0], ResultsComponentMapping.value, ''),
                options: items.map((item: any) => ({
                  name: _.get(item, ResultsComponentMapping.subItemLabel, ''),
                  value: _.get(item, ResultsComponentMapping.subItemValue, ''),
                })),
              })),
              'name',
              'asc',
            ),
          },
        };
      })
      .catch(handleDataApiError);
  }

  // v2

  @get('/v2/filter-options/locations')
  @response(200, FILTER_OPTIONS_RESPONSE)
  locations(): object {
    const url = urls.filteroptionslocations;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingLocations.dataPath, []);
        const data: FilterGroupOption[] = [];

        rawData.forEach((item1: any) => {
          const options = _.get(item1, mappingLocations.children, []);
          data.push({
            name: _.get(item1, mappingLocations.label, ''),
            value: _.get(item1, mappingLocations.value, ''),
            options:
              options && options.length > 0
                ? _.orderBy(
                    options.map((item2: any) => {
                      const item2options = _.get(
                        item2,
                        mappingLocations.children,
                        [],
                      );
                      return {
                        name: _.get(item2, mappingLocations.label, ''),
                        value: _.get(item2, mappingLocations.value, ''),
                        options:
                          item2options && item2options.length > 0
                            ? _.orderBy(
                                item2options.map((item3: any) => {
                                  const item3options = _.get(
                                    item3,
                                    mappingLocations.children,
                                    [],
                                  );
                                  return {
                                    name: _.get(
                                      item3,
                                      mappingLocations.label,
                                      '',
                                    ),
                                    value: _.get(
                                      item3,
                                      mappingLocations.value,
                                      '',
                                    ),
                                    options:
                                      item3options && item3options.length > 0
                                        ? _.orderBy(
                                            item3options.map((item4: any) => {
                                              return {
                                                name: _.get(
                                                  item4,
                                                  mappingLocations.label,
                                                  '',
                                                ),
                                                value: _.get(
                                                  item4,
                                                  mappingLocations.value,
                                                  '',
                                                ),
                                              };
                                            }),
                                            'label',
                                            'asc',
                                          )
                                        : undefined,
                                  };
                                }),
                                'label',
                                'asc',
                              )
                            : undefined,
                      };
                    }),
                    'label',
                    'asc',
                  )
                : undefined,
          });
        });

        if (urls.filteroptionsmulticountries) {
          return axios
            .get(urls.filteroptionsmulticountries)
            .then((resp2: AxiosResponse) => {
              const mcRawData = _.get(
                resp2.data,
                mappingMulticountries.dataPath,
                [],
              );

              mcRawData.forEach((item: any) => {
                data.forEach((region: FilterGroupOption) => {
                  const fRegion = _.find(region.options, {
                    value: _.get(item, mappingMulticountries.regionCode),
                  });
                  if (fRegion) {
                    region.options?.push({
                      name: _.get(item, mappingMulticountries.label, ''),
                      value: _.get(item, mappingMulticountries.value, ''),
                    });
                  } else {
                    region.options?.forEach((subRegion: FilterGroupOption) => {
                      const fSubRegion = _.find(subRegion.options, {
                        value: _.get(item, mappingMulticountries.regionCode),
                      });
                      if (fSubRegion) {
                        subRegion.options?.push({
                          name: _.get(item, mappingMulticountries.label, ''),
                          value: _.get(item, mappingMulticountries.value, ''),
                        });
                      }
                    });
                  }
                });
              });

              return {
                name: 'Locations',
                options: _.orderBy(data, 'label', 'asc'),
              };
            })
            .catch(handleDataApiError);
        } else {
          return {
            name: 'Locations',
            options: _.orderBy(data, 'label', 'asc'),
          };
        }
      })
      .catch(handleDataApiError);
  }

  @get('/v2/filter-options/components')
  @response(200, FILTER_OPTIONS_RESPONSE)
  components(): object {
    const url = urls.filteroptionscomponents;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingComponents.dataPath, []);

        return {
          name: 'Components',
          options: rawData.map((item: any) => ({
            name: _.get(item, mappingComponents.label, ''),
            value: _.get(item, mappingComponents.value, ''),
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/filter-options/partner-types')
  @response(200, FILTER_OPTIONS_RESPONSE)
  partnerTypes(): object {
    const url = urls.filteroptionspartnertypes;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingPartnertypes.dataPath, []);

        const groupedByPartnerType = _.groupBy(
          rawData,
          mappingPartnertypes.partnerType,
        );

        const options: FilterGroupOption[] = [];

        Object.keys(groupedByPartnerType).forEach((partnerType: string) => {
          const groupedBySubPartnerType = _.groupBy(
            groupedByPartnerType[partnerType],
            mappingPartnertypes.partnerSubType,
          );
          const options: FilterGroupOption[] = [];
          Object.keys(groupedBySubPartnerType).forEach(
            (subPartnerType: string) => {
              options.push({
                name:
                  subPartnerType && subPartnerType !== 'null'
                    ? subPartnerType
                    : 'Not Classified',
                value: _.get(
                  groupedBySubPartnerType[subPartnerType][0],
                  mappingPartnertypes.partnerSubTypeId,
                  '',
                ),
                options: _.orderBy(
                  groupedBySubPartnerType[subPartnerType].map(
                    (partner: any) => ({
                      name: _.get(partner, mappingPartnertypes.partner, ''),
                      value: _.get(partner, mappingPartnertypes.partnerId, ''),
                    }),
                  ),
                  'label',
                  'asc',
                ),
              });
            },
          );
          options.push({
            name:
              partnerType && partnerType !== 'null'
                ? partnerType
                : 'Not Classified',
            value: _.get(
              groupedByPartnerType[partnerType][0],
              mappingPartnertypes.partnerTypeId,
              '',
            ),
            options: _.orderBy(options, 'label', 'asc'),
          });
        });

        return {
          name: 'Partner types',
          options: _.orderBy(options, 'label', 'asc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/filter-options/status')
  @response(200, FILTER_OPTIONS_RESPONSE)
  status(): object {
    const url = urls.filteroptionsstatus;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingStatus.dataPath, []);

        return {
          name: 'Grant status',
          options: _.orderBy(
            rawData.map((item: any) => ({
              name: _.get(item, mappingStatus.label, ''),
              value: _.get(item, mappingStatus.value, ''),
            })),
            'label',
            'asc',
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/filter-options/replenishment-periods')
  @response(200, FILTER_OPTIONS_RESPONSE)
  replenishmentPeriods(): object {
    const url = urls.filteroptionsreplenishmentperiods;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          mappingReplenishmentperiods.dataPath,
          [],
        );

        return {
          name: 'Replenishment periods',
          options: _.orderBy(
            rawData.map((item: any) => ({
              name: _.get(item, mappingReplenishmentperiods.label, ''),
              value: _.get(item, mappingReplenishmentperiods.value, ''),
            })),
            'label',
            'asc',
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/v2/filter-options/donors')
  @response(200, FILTER_OPTIONS_RESPONSE)
  donors(): object {
    const keyword = (this.req.query.q ?? '').toString().trim();
    const keywords = keyword.split(' ');
    const url = urls.filteroptionsdonors;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingDonors.dataPath, []);
        const options: FilterGroupOption[] = [];

        rawData.forEach((item: any) => {
          const type: FilterGroupOption = {
            name: _.get(item, mappingDonors.label, ''),
            value: _.get(item, mappingDonors.value, ''),
            options: [],
          };

          _.get(item, mappingDonors.children, []).forEach((child: any) => {
            if (_.get(child, mappingDonors.children, []).length > 0) {
              const subType: FilterGroupOption = {
                name: _.get(child, mappingDonors.label, ''),
                value: _.get(child, mappingDonors.value, ''),
                options: [],
              };
              _.get(child, mappingDonors.children, []).forEach(
                (gchild: any) => {
                  subType.options?.push({
                    name: _.get(gchild, mappingDonors.label, ''),
                    value: _.get(gchild, mappingDonors.value, ''),
                  });
                },
              );
              subType.options = _.orderBy(subType.options, 'label', 'asc');
              type.options?.push(subType);
            } else {
              type.options?.push({
                name: _.get(child, mappingDonors.label, ''),
                value: _.get(child, mappingDonors.value, ''),
              });
            }
          });

          type.options = _.orderBy(type.options, 'label', 'asc');

          if (keyword.length > 0) {
            type.options = _.filter(type.options, (option: any) => {
              let allKeywordsFound = true;
              keywords.forEach((key: string) => {
                if (
                  option.label.toLowerCase().indexOf(key.toLowerCase()) === -1
                ) {
                  allKeywordsFound = false;
                }
              });
              return allKeywordsFound;
            }) as FilterGroupOption[];
          }

          const optionsWithoptions: FilterGroupOption[] = _.orderBy(
            _.filter(type.options, o => o.options) as FilterGroupOption[],
            'label',
            'asc',
          );
          const optionsWithOutoptions: FilterGroupOption[] = _.orderBy(
            _.filter(type.options, o => !o.options),
            'label',
            'asc',
          );

          type.options = [...optionsWithoptions, ...optionsWithOutoptions];

          options.push(type);
        });

        return {
          name: 'Donors',
          options: _.orderBy(options, 'label', 'asc'),
        };
      })
      .catch(handleDataApiError);
  }
}

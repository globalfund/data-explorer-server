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
import ReplenishmentPeriodMapping from '../config/mapping/filter-options/replenishment-periods.json';
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
                label: {type: 'string'},
                value: {type: 'string'},
                subOptions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: {type: 'string'},
                      value: {type: 'string'},
                      subOptions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: {type: 'string'},
                            value: {type: 'string'},
                            subOptions: {
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
          const subOptions = _.get(item1, GeographyMapping.children, []);
          data.push({
            label: _.get(item1, GeographyMapping.label, ''),
            value: _.get(item1, GeographyMapping.value, ''),
            extraInfo: {
              isDonor: _.get(item1, GeographyMapping.isDonor, false),
              isRecipient: _.get(item1, GeographyMapping.isRecipient, false),
              level: _.get(item1, GeographyMapping.level, undefined),
            },
            subOptions:
              subOptions && subOptions.length > 0
                ? _.orderBy(
                    subOptions.map((item2: any) => {
                      const item2SubOptions = _.get(
                        item2,
                        GeographyMapping.children,
                        [],
                      );
                      return {
                        label: _.get(item2, GeographyMapping.label, ''),
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
                        subOptions:
                          item2SubOptions && item2SubOptions.length > 0
                            ? _.orderBy(
                                item2SubOptions.map((item3: any) => {
                                  const item3SubOptions = _.get(
                                    item3,
                                    GeographyMapping.children,
                                    [],
                                  );
                                  return {
                                    label: _.get(
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
                                    subOptions:
                                      item3SubOptions &&
                                      item3SubOptions.length > 0
                                        ? _.orderBy(
                                            item3SubOptions.map(
                                              (item4: any) => {
                                                return {
                                                  label: _.get(
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
                                              },
                                            ),
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

        return {
          name: 'Geography',
          options: _.orderBy(data, 'label', 'asc'),
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
          name: 'Component',
          options: rawData.map((item: any) => ({
            label: _.get(item, ComponentMapping.label, ''),
            value: _.get(item, ComponentMapping.value, ''),
          })),
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
          name: 'Replenishment period',
          options: _.orderBy(
            rawData.map((item: any) => ({
              label: _.get(item, ReplenishmentPeriodMapping.label, ''),
              value: _.get(item, ReplenishmentPeriodMapping.value, ''),
            })),
            'label',
            'asc',
          ),
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
            label: type,
            value: type,
            subOptions: donors.map((donor: any) => ({
              label: donor[DonorMapping.label],
              value: donor[DonorMapping.value],
            })),
          };

          options.push(typeOptions);
        });

        return {
          name: 'Donor',
          options: _.orderBy(options, 'label', 'asc'),
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
      .then((resp: AxiosResponse) => {})
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
          const subOptions = _.get(item1, mappingLocations.children, []);
          data.push({
            label: _.get(item1, mappingLocations.label, ''),
            value: _.get(item1, mappingLocations.value, ''),
            subOptions:
              subOptions && subOptions.length > 0
                ? _.orderBy(
                    subOptions.map((item2: any) => {
                      const item2SubOptions = _.get(
                        item2,
                        mappingLocations.children,
                        [],
                      );
                      return {
                        label: _.get(item2, mappingLocations.label, ''),
                        value: _.get(item2, mappingLocations.value, ''),
                        subOptions:
                          item2SubOptions && item2SubOptions.length > 0
                            ? _.orderBy(
                                item2SubOptions.map((item3: any) => {
                                  const item3SubOptions = _.get(
                                    item3,
                                    mappingLocations.children,
                                    [],
                                  );
                                  return {
                                    label: _.get(
                                      item3,
                                      mappingLocations.label,
                                      '',
                                    ),
                                    value: _.get(
                                      item3,
                                      mappingLocations.value,
                                      '',
                                    ),
                                    subOptions:
                                      item3SubOptions &&
                                      item3SubOptions.length > 0
                                        ? _.orderBy(
                                            item3SubOptions.map(
                                              (item4: any) => {
                                                return {
                                                  label: _.get(
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
                                              },
                                            ),
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
                  const fRegion = _.find(region.subOptions, {
                    value: _.get(item, mappingMulticountries.regionCode),
                  });
                  if (fRegion) {
                    region.subOptions?.push({
                      label: _.get(item, mappingMulticountries.label, ''),
                      value: _.get(item, mappingMulticountries.value, ''),
                    });
                  } else {
                    region.subOptions?.forEach(
                      (subRegion: FilterGroupOption) => {
                        const fSubRegion = _.find(subRegion.subOptions, {
                          value: _.get(item, mappingMulticountries.regionCode),
                        });
                        if (fSubRegion) {
                          subRegion.subOptions?.push({
                            label: _.get(item, mappingMulticountries.label, ''),
                            value: _.get(item, mappingMulticountries.value, ''),
                          });
                        }
                      },
                    );
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
            label: _.get(item, mappingComponents.label, ''),
            value: _.get(item, mappingComponents.value, ''),
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/partner-types')
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
          const subOptions: FilterGroupOption[] = [];
          Object.keys(groupedBySubPartnerType).forEach(
            (subPartnerType: string) => {
              subOptions.push({
                label:
                  subPartnerType && subPartnerType !== 'null'
                    ? subPartnerType
                    : 'Not Classified',
                value: _.get(
                  groupedBySubPartnerType[subPartnerType][0],
                  mappingPartnertypes.partnerSubTypeId,
                  '',
                ),
                subOptions: _.orderBy(
                  groupedBySubPartnerType[subPartnerType].map(
                    (partner: any) => ({
                      label: _.get(partner, mappingPartnertypes.partner, ''),
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
            label:
              partnerType && partnerType !== 'null'
                ? partnerType
                : 'Not Classified',
            value: _.get(
              groupedByPartnerType[partnerType][0],
              mappingPartnertypes.partnerTypeId,
              '',
            ),
            subOptions: _.orderBy(subOptions, 'label', 'asc'),
          });
        });

        return {
          name: 'Partner types',
          options: _.orderBy(options, 'label', 'asc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/status')
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
              label: _.get(item, mappingStatus.label, ''),
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
              label: _.get(item, mappingReplenishmentperiods.label, ''),
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
            label: _.get(item, mappingDonors.label, ''),
            value: _.get(item, mappingDonors.value, ''),
            subOptions: [],
          };

          _.get(item, mappingDonors.children, []).forEach((child: any) => {
            if (_.get(child, mappingDonors.children, []).length > 0) {
              const subType: FilterGroupOption = {
                label: _.get(child, mappingDonors.label, ''),
                value: _.get(child, mappingDonors.value, ''),
                subOptions: [],
              };
              _.get(child, mappingDonors.children, []).forEach(
                (gchild: any) => {
                  subType.subOptions?.push({
                    label: _.get(gchild, mappingDonors.label, ''),
                    value: _.get(gchild, mappingDonors.value, ''),
                  });
                },
              );
              subType.subOptions = _.orderBy(
                subType.subOptions,
                'label',
                'asc',
              );
              type.subOptions?.push(subType);
            } else {
              type.subOptions?.push({
                label: _.get(child, mappingDonors.label, ''),
                value: _.get(child, mappingDonors.value, ''),
              });
            }
          });

          type.subOptions = _.orderBy(type.subOptions, 'label', 'asc');

          if (keyword.length > 0) {
            type.subOptions = _.filter(type.subOptions, (option: any) => {
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

          const subOptionsWithSubOptions: FilterGroupOption[] = _.orderBy(
            _.filter(type.subOptions, o => o.subOptions) as FilterGroupOption[],
            'label',
            'asc',
          );
          const subOptionsWithOutSubOptions: FilterGroupOption[] = _.orderBy(
            _.filter(type.subOptions, o => !o.subOptions),
            'label',
            'asc',
          );

          type.subOptions = [
            ...subOptionsWithSubOptions,
            ...subOptionsWithOutSubOptions,
          ];

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

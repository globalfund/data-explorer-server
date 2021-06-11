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
import mappingComponents from '../config/mapping/filteroptions/components.json';
import mappingDonors from '../config/mapping/filteroptions/donors.json';
import mappingLocations from '../config/mapping/filteroptions/locations.json';
import mappingMulticountries from '../config/mapping/filteroptions/multicountries.json';
import mappingPartnertypes from '../config/mapping/filteroptions/partnertypes.json';
import mappingReplenishmentperiods from '../config/mapping/filteroptions/replenishmentperiods.json';
import mappingStatus from '../config/mapping/filteroptions/status.json';
import urls from '../config/urls/index.json';
import {FilterGroupOption} from '../interfaces/filters';

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

  @get('/filter-options/locations')
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
                ? subOptions.map((item2: any) => {
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
                          ? item2SubOptions.map((item3: any) => {
                              const item3SubOptions = _.get(
                                item3,
                                mappingLocations.children,
                                [],
                              );
                              return {
                                label: _.get(item3, mappingLocations.label, ''),
                                value: _.get(item3, mappingLocations.value, ''),
                                subOptions:
                                  item3SubOptions && item3SubOptions.length > 0
                                    ? item3SubOptions.map((item4: any) => {
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
                                      })
                                    : undefined,
                              };
                            })
                          : undefined,
                    };
                  })
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
                data[0].subOptions?.forEach((region: FilterGroupOption) => {
                  region.subOptions?.forEach((subRegion: FilterGroupOption) => {
                    const fCountry = _.find(subRegion.subOptions, {
                      label: _.get(item, mappingMulticountries.childCountry),
                    });
                    if (fCountry) {
                      subRegion.subOptions?.push({
                        label: _.get(item, mappingMulticountries.label, ''),
                        value: _.get(item, mappingMulticountries.value, ''),
                      });
                    }
                  });
                });
              });

              return {
                name: 'Locations',
                options: data,
              };
            })
            .catch((error2: AxiosError) => {
              console.error(error2);
            });
        } else {
          return {
            name: 'Locations',
            options: data,
          };
        }
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/filter-options/components')
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/filter-options/partner-types')
  @response(200, FILTER_OPTIONS_RESPONSE)
  partnerTypes(): object {
    const url = urls.filteroptionspartnertypes;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, mappingPartnertypes.dataPath, []);

        return {
          name: 'Partner types',
          options: _.orderBy(
            rawData.map((item: any) => ({
              label: _.get(item, mappingPartnertypes.label, ''),
              value: _.get(item, mappingPartnertypes.value, ''),
              subOptions: _.orderBy(
                _.get(item, mappingPartnertypes.children, []).map(
                  (child: any) => ({
                    label: _.get(child, mappingPartnertypes.childLabel, ''),
                    value: _.get(child, mappingPartnertypes.childValue, ''),
                  }),
                ),
                'label',
                'asc',
              ),
            })),
            'label',
            'asc',
          ),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/filter-options/replenishment-periods')
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/filter-options/donors')
  @response(200, FILTER_OPTIONS_RESPONSE)
  donors(): object {
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
              _.get(child, mappingDonors.children, []).forEach(
                (gchild: any) => {
                  type.subOptions?.push({
                    label: _.get(gchild, mappingDonors.label, ''),
                    value: _.get(gchild, mappingDonors.value, ''),
                  });
                },
              );
            } else {
              type.subOptions?.push({
                label: _.get(child, mappingDonors.label, ''),
                value: _.get(child, mappingDonors.value, ''),
              });
            }
          });

          options.push(type);
        });

        return {
          name: 'Donors',
          options: _.orderBy(options, 'label', 'asc'),
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

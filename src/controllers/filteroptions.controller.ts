import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import ComponentMapping from '../config/mapping/filter-options/components.json';
import DonorMapping from '../config/mapping/filter-options/donors.json';
import GeographyMapping from '../config/mapping/filter-options/geography.json';
import PrincipalRecipientMapping from '../config/mapping/filter-options/principal-recipients.json';
import ReplenishmentPeriodMapping from '../config/mapping/filter-options/replenishment-periods.json';
import ResultsComponentMapping from '../config/mapping/filter-options/results-components.json';
import StatusMapping from '../config/mapping/filter-options/status.json';
import urls from '../config/urls/index.json';
import {FilterGroupOption} from '../interfaces/filters';
import {handleDataApiError} from '../utils/dataApiError';

export class FilteroptionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/filter-options/geography/{type}')
  @response(200)
  async filterOptionsGeography(@param.path.string('type') type: string) {
    let url = urls.FILTER_OPTIONS_GEOGRAPHIES;
    let dataPath = GeographyMapping.dataPath;
    if (type === 'Portfolio View') {
      url = urls.FILTER_OPTIONS_GEOGRAPHIES_PORTFOLIO_VIEW;
      dataPath = GeographyMapping.dataPathPortfolioView;
    } else if (type === 'Board Constituency View') {
      url = urls.FILTER_OPTIONS_GEOGRAPHIES_BOARD_CONSTITUENCY_VIEW;
      dataPath = GeographyMapping.dataPathBoardConstituencyView;
    }

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, dataPath, []);
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

        const result = {
          data: {
            id: 'geography',
            name: 'Geography',
            options: _.orderBy(data, 'name', 'asc'),
          },
        };

        if (type === 'Standard View') {
          const flattened: FilterGroupOption[] = [];
          result.data.options.forEach((item1: any) => {
            flattened.push({name: item1.name, value: item1.value});
            if (item1.options) {
              item1.options.forEach((item2: any) => {
                flattened.push({name: item2.name, value: item2.value});
                if (item2.options) {
                  item2.options.forEach((item3: any) => {
                    flattened.push({name: item3.name, value: item3.value});
                    if (item3.options) {
                      item3.options.forEach((item4: any) => {
                        flattened.push({name: item4.name, value: item4.value});
                      });
                    }
                  });
                }
              });
            }
          });
          return new Promise(resolve => {
            fs.writeFile(
              `${path.join(__dirname, '../../public/locations-flat.json')}`,
              JSON.stringify(flattened, null, 2),
              () => resolve({}),
            );
          })
            .then(() => result)
            .catch(() => result);
        } else {
          return result;
        }
      })
      .catch(handleDataApiError);
  }

  @get('/filter-options/components/{type}')
  @response(200)
  async filterOptionsComponents(@param.path.string('type') type: string) {
    const url =
      type === 'grouped'
        ? urls.FILTER_OPTIONS_COMPONENTS_GROUPED
        : urls.FILTER_OPTIONS_COMPONENTS_UNGROUPED;

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
            options: _.orderBy(
              donors.map((donor: any) => ({
                name: donor[DonorMapping.label],
                value: donor[DonorMapping.value],
              })),
              'name',
              'asc',
            ),
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

        const groupedByType = _.groupBy(
          rawData,
          PrincipalRecipientMapping.type,
        );

        _.forEach(groupedByType, (values, type) => {
          if (type !== 'null') {
            const typeOptions: FilterGroupOption = {
              name: type,
              value: _.get(values[0], PrincipalRecipientMapping.typeCode, ''),
              options: [],
            };

            const groupedBySubType = _.groupBy(
              values,
              PrincipalRecipientMapping.subType,
            );

            _.forEach(groupedBySubType, (subValues, subType) => {
              const subTypeOptions: FilterGroupOption = {
                name: subType,
                value: _.get(
                  subValues[0],
                  PrincipalRecipientMapping.subTypeCode,
                  '',
                ),
                options: _.orderBy(
                  subValues.map((subValue: any) => ({
                    name: _.get(subValue, PrincipalRecipientMapping.label, ''),
                    value: _.get(subValue, PrincipalRecipientMapping.value, ''),
                  })),
                  'name',
                  'asc',
                ),
              };

              typeOptions.options?.push(subTypeOptions);
            });

            typeOptions.options = _.orderBy(typeOptions.options, 'name', 'asc');

            options.push(typeOptions);
          }
        });

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
}

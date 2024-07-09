import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
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

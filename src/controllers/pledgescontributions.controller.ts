import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _, {orderBy} from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import PledgesContributionsGeoFieldsMapping from '../config/mapping/pledgescontributions/geo.json';
import PledgesContributionsTableFieldsMapping from '../config/mapping/pledgescontributions/table.json';
import PledgesContributionsTimeCycleFieldsMapping from '../config/mapping/pledgescontributions/timeCycle.json';
import PledgesContributionsTimeCycleDrilldownFieldsMapping from '../config/mapping/pledgescontributions/timeCycleDrilldown.json';
import urls from '../config/urls/index.json';
import {BudgetsTreemapDataItem} from '../interfaces/budgetsTreemap';
import {FilterGroupOption} from '../interfaces/filters';
import {PledgesContributionsTreemapDataItem} from '../interfaces/pledgesContributions';
import {SimpleTableRow} from '../interfaces/simpleTable';
import {handleDataApiError} from '../utils/dataApiError';
import {getFilterString} from '../utils/filtering/pledges-contributions/getFilterString';
import {formatFinancialValue} from '../utils/formatFinancialValue';
import {getD2HCoordinates} from '../utils/pledgescontributions/getD2HCoordinates';

const PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE: ResponseObject = {
  description: 'Pledges and Contributions time-cycle Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PledgesContributionsTimeCycleResponse',
        properties: {
          count: {type: 'number'},
          data: {
            type: 'array',
            properties: {
              year: {type: 'string'},
              pledge: {type: 'number'},
              contribution: {type: 'number'},
              pledgeColor: {type: 'string'},
              contributionColor: {type: 'string'},
            },
          },
        },
      },
    },
  },
};

export class PledgescontributionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/pledges-contributions/time-cycle')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  timeCycle(): object {
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsTimeCycleFieldsMapping.pledgescontributionsTimeCycleAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsTimeCycleFieldsMapping.dataPath,
          [],
        );
        const groupByYear = _.groupBy(
          rawData,
          PledgesContributionsTimeCycleFieldsMapping.year,
        );
        const data: Record<string, unknown>[] = [];

        _.orderBy(Object.keys(groupByYear), undefined, 'asc').forEach(
          (year: string) => {
            const pledge = _.find(
              groupByYear[year],
              (item: any) =>
                item[PledgesContributionsTimeCycleFieldsMapping.indicator] ===
                'Pledge',
            );
            const contribution = _.find(
              groupByYear[year],
              (item: any) =>
                item[PledgesContributionsTimeCycleFieldsMapping.indicator] ===
                'Contribution',
            );
            data.push({
              year,
              pledge: _.get(
                pledge,
                PledgesContributionsTimeCycleFieldsMapping.amount,
                0,
              ),
              contribution: _.get(
                contribution,
                PledgesContributionsTimeCycleFieldsMapping.amount,
                0,
              ),
              pledgeColor: '#BFCFEE',
              contributionColor: '#252C34',
            });
          },
        );

        return {
          count: data.length,
          data,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/geomap')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  geomap(): object {
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsGeoFieldsMapping.pledgescontributionsGeoMapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const valueType = (
      this.req.query.valueType ?? PledgesContributionsGeoFieldsMapping.pledge
    ).toString();
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    let pinsSortByValue = 'geoName';
    let featuresSortByValue = 'properties.name';

    if (sortByValue === 'value') {
      pinsSortByValue = 'amounts[0].value';
      featuresSortByValue = 'properties.data.amounts[0].value';
    }

    return axios
      .all([
        axios.get(url),
        axios.get(
          PledgesContributionsGeoFieldsMapping.inAppDonorsFilterOptionsURL,
        ),
        axios.get(urls.geojson),
        axios.get(PledgesContributionsGeoFieldsMapping.d2hspatialshapesURL),
      ])
      .then(
        axios.spread((...responses) => {
          const geoJSONData = responses[2].data.features;
          const donorFilterOptions = responses[1].data.options;
          const D2HDonorCoordinateData: any[] = [];

          responses[3].data.value[0].members.forEach((member: any) => {
            member.donorSpatialShapes.forEach((shape: any) => {
              D2HDonorCoordinateData.push(shape);
            });
          });

          const rawData = _.get(
            responses[0].data,
            PledgesContributionsGeoFieldsMapping.dataPath,
            [],
          );
          const donorCountries = _.groupBy(
            rawData,
            PledgesContributionsGeoFieldsMapping.countryDonors,
          );
          const publicSectorCountries: any[] = [];
          const nonCountrySectorDonors: any[] = [];

          Object.keys(donorCountries).forEach((iso3: string) => {
            if (iso3 !== 'undefined') {
              const items = donorCountries[iso3];
              const pledges = _.filter(items, {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.pledge,
              });
              const contributions = _.filter(items, {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.contribution,
              });
              publicSectorCountries.push({
                code: iso3,
                geoName: items[0].donor.geographicArea.geographicAreaName,
                id: items[0].donorId,
                amounts: [
                  valueType === PledgesContributionsGeoFieldsMapping.pledge
                    ? {
                        label: 'Pledge',
                        value: _.sumBy(
                          pledges,
                          PledgesContributionsGeoFieldsMapping.amount,
                        ),
                      }
                    : {
                        label: 'Contribution',
                        value: _.sumBy(
                          contributions,
                          PledgesContributionsGeoFieldsMapping.amount,
                        ),
                      },
                ],
              });
            } else {
              const nonPublicDonors = _.groupBy(
                donorCountries[iso3],
                PledgesContributionsGeoFieldsMapping.nonCountryDonors,
              );
              Object.keys(nonPublicDonors).forEach(
                (donor: string, index: number) => {
                  const donorData = nonPublicDonors[donor][0];
                  const lat = _.get(
                    donorData,
                    PledgesContributionsGeoFieldsMapping.donorLat,
                    null,
                  );
                  const long = _.get(
                    donorData,
                    PledgesContributionsGeoFieldsMapping.donorLong,
                    null,
                  );
                  if (lat && long) {
                    const pledges = _.filter(nonPublicDonors[donor], {
                      [PledgesContributionsGeoFieldsMapping.indicator]:
                        PledgesContributionsGeoFieldsMapping.pledge,
                    });
                    const contributions = _.filter(nonPublicDonors[donor], {
                      [PledgesContributionsGeoFieldsMapping.indicator]:
                        PledgesContributionsGeoFieldsMapping.contribution,
                    });
                    let subType = '';
                    donorFilterOptions.forEach((option: FilterGroupOption) => {
                      if (_.find(option.subOptions, {label: donor})) {
                        subType = option.label;
                      }
                    });
                    const multiCoordinates =
                      subType === 'Debt2Health'
                        ? getD2HCoordinates(donor, D2HDonorCoordinateData)
                        : null;
                    nonCountrySectorDonors.push({
                      code: donor,
                      geoName: donor,
                      id: _.get(
                        donorData,
                        PledgesContributionsGeoFieldsMapping.donorId,
                      ),
                      latitude: parseFloat(
                        multiCoordinates ? multiCoordinates[0][0] : lat,
                      ),
                      longitude: parseFloat(
                        multiCoordinates ? multiCoordinates[0][1] : long,
                      ),
                      amounts: [
                        valueType ===
                        PledgesContributionsGeoFieldsMapping.pledge
                          ? {
                              label: 'Pledge',
                              value: _.sumBy(
                                pledges,
                                PledgesContributionsGeoFieldsMapping.amount,
                              ),
                            }
                          : {
                              label: 'Contribution',
                              value: _.sumBy(
                                contributions,
                                PledgesContributionsGeoFieldsMapping.amount,
                              ),
                            },
                      ],
                      subType,
                      d2hCoordinates: multiCoordinates,
                      intId: index,
                    });
                  }
                },
              );
            }
          });

          const maxValue: number =
            _.max(
              publicSectorCountries.map((d: any) =>
                _.get(_.find(d.amounts, {label: valueType}), 'value', 0),
              ),
            ) ?? 0;
          let interval = 0;
          if (maxValue) {
            interval = maxValue / 13;
          }
          const intervals: number[] = [];
          for (let i = 0; i < 13; i++) {
            intervals.push(interval * i);
          }
          const features = geoJSONData.map((feature: any) => {
            const fItem = _.find(publicSectorCountries, {
              code: feature.id,
            });
            let itemValue = 0;
            if (fItem) {
              const fItemValue = _.get(
                _.find(fItem.amounts, {label: valueType}),
                'value',
                0,
              );
              if (
                (fItemValue < maxValue || fItemValue === maxValue) &&
                (fItemValue >= intervals[11] || fItemValue === intervals[11])
              ) {
                itemValue = 12;
              }
              if (
                (fItemValue < intervals[11] || fItemValue === intervals[11]) &&
                (fItemValue >= intervals[10] || fItemValue === intervals[10])
              ) {
                itemValue = 11;
              }
              if (
                (fItemValue < intervals[10] || fItemValue === intervals[10]) &&
                (fItemValue >= intervals[9] || fItemValue === intervals[9])
              ) {
                itemValue = 10;
              }
              if (
                (fItemValue < intervals[9] || fItemValue === intervals[9]) &&
                (fItemValue >= intervals[8] || fItemValue === intervals[8])
              ) {
                itemValue = 9;
              }
              if (
                (fItemValue < intervals[8] || fItemValue === intervals[8]) &&
                (fItemValue >= intervals[7] || fItemValue === intervals[7])
              ) {
                itemValue = 8;
              }
              if (
                (fItemValue < intervals[7] || fItemValue === intervals[7]) &&
                (fItemValue >= intervals[6] || fItemValue === intervals[6])
              ) {
                itemValue = 7;
              }
              if (
                (fItemValue < intervals[6] || fItemValue === intervals[6]) &&
                (fItemValue >= intervals[5] || fItemValue === intervals[5])
              ) {
                itemValue = 6;
              }
              if (
                (fItemValue < intervals[5] || fItemValue === intervals[5]) &&
                (fItemValue >= intervals[4] || fItemValue === intervals[4])
              ) {
                itemValue = 5;
              }
              if (
                (fItemValue < intervals[4] || fItemValue === intervals[4]) &&
                (fItemValue >= intervals[3] || fItemValue === intervals[3])
              ) {
                itemValue = 4;
              }
              if (
                (fItemValue < intervals[3] || fItemValue === intervals[3]) &&
                (fItemValue >= intervals[2] || fItemValue === intervals[2])
              ) {
                itemValue = 3;
              }
              if (
                (fItemValue < intervals[2] || fItemValue === intervals[2]) &&
                (fItemValue >= intervals[1] || fItemValue === intervals[1])
              ) {
                itemValue = 2;
              }
              if (
                (fItemValue < intervals[1] || fItemValue === intervals[1]) &&
                (fItemValue >= intervals[0] || fItemValue === intervals[0])
              ) {
                itemValue = 1;
              }
            }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                iso_a3: feature.id,
                value: itemValue,
                data: fItem ? fItem : {},
              },
            };
          });

          return {
            maxValue,
            layers: orderBy(features, featuresSortByValue, sortByDirection),
            pins: orderBy(
              nonCountrySectorDonors,
              pinsSortByValue,
              sortByDirection,
            ),
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/time-cycle/drilldown')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  timeCycleDrilldown(): object {
    const valueType =
      (_.get(this.req.query, 'levelParam', '') as string)
        .split('-')
        .indexOf('pledge') > -1
        ? 'pledge'
        : 'contribution';
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsTimeCycleDrilldownFieldsMapping.aggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.filter(
          _.get(
            resp.data,
            PledgesContributionsTimeCycleDrilldownFieldsMapping.dataPath,
            [],
          ),
          {
            [PledgesContributionsTimeCycleDrilldownFieldsMapping.indicator]:
              PledgesContributionsTimeCycleDrilldownFieldsMapping[valueType],
          },
        );
        const levelComponent = _.get(
          rawData,
          `[0].${PledgesContributionsTimeCycleDrilldownFieldsMapping.year}`,
          '',
        );
        const value = _.sumBy(
          rawData,
          PledgesContributionsTimeCycleDrilldownFieldsMapping.amount,
        );
        const data: PledgesContributionsTreemapDataItem[] = [
          {
            name: levelComponent,
            value,
            formattedValue: formatFinancialValue(value),
            color: '#DFE3E5',
            _children: _.orderBy(
              rawData.map((item: any) => ({
                name: _.get(
                  item,
                  PledgesContributionsTimeCycleDrilldownFieldsMapping.donor,
                  '',
                ),
                value: _.get(
                  item,
                  PledgesContributionsTimeCycleDrilldownFieldsMapping.amount,
                  0,
                ),
                formattedValue: formatFinancialValue(
                  _.get(
                    item,
                    PledgesContributionsTimeCycleDrilldownFieldsMapping.amount,
                    0,
                  ),
                ),
                color: '#595C70',
                tooltip: {
                  header: levelComponent,
                  componentsStats: [
                    {
                      name: _.get(
                        item,
                        PledgesContributionsTimeCycleDrilldownFieldsMapping.donor,
                        '',
                      ),
                      value: _.get(
                        item,
                        PledgesContributionsTimeCycleDrilldownFieldsMapping.amount,
                        0,
                      ),
                    },
                  ],
                  value: _.get(
                    item,
                    PledgesContributionsTimeCycleDrilldownFieldsMapping.amount,
                    0,
                  ),
                },
              })),
              'value',
              'desc',
            ),
            tooltip: {
              header: levelComponent,
              value,
              componentsStats: [
                {
                  name: levelComponent,
                  value,
                },
              ],
            },
          },
        ];
        return {
          data,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/treemap')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  treemap(): object {
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsGeoFieldsMapping.pledgescontributionsGeoMapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const valueType = (
      this.req.query.valueType ?? PledgesContributionsGeoFieldsMapping.pledge
    ).toString();
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsGeoFieldsMapping.dataPath,
          [],
        );

        const donorCountries = _.groupBy(
          rawData,
          PledgesContributionsGeoFieldsMapping.countryDonors,
        );
        const publicSectorCountries: BudgetsTreemapDataItem[] = [];
        const nonCountrySectorDonors: BudgetsTreemapDataItem[] = [];

        Object.keys(donorCountries).forEach((iso3: string) => {
          if (iso3 !== 'undefined') {
            const items = donorCountries[iso3];
            const pledges = _.filter(items, {
              [PledgesContributionsGeoFieldsMapping.indicator]:
                PledgesContributionsGeoFieldsMapping.pledge,
            });
            const contributions = _.filter(items, {
              [PledgesContributionsGeoFieldsMapping.indicator]:
                PledgesContributionsGeoFieldsMapping.contribution,
            });
            publicSectorCountries.push({
              // code: items[0].donorId,
              name: items[0].donor.geographicArea.geographicAreaName,
              value:
                valueType === PledgesContributionsGeoFieldsMapping.pledge
                  ? _.sumBy(
                      pledges,
                      PledgesContributionsGeoFieldsMapping.amount,
                    )
                  : _.sumBy(
                      contributions,
                      PledgesContributionsGeoFieldsMapping.amount,
                    ),
              formattedValue: formatFinancialValue(
                valueType === PledgesContributionsGeoFieldsMapping.pledge
                  ? _.sumBy(
                      pledges,
                      PledgesContributionsGeoFieldsMapping.amount,
                    )
                  : _.sumBy(
                      contributions,
                      PledgesContributionsGeoFieldsMapping.amount,
                    ),
              ),
              color: '#DFE3E5',
              tooltip: {
                header: items[0].donor.geographicArea.geographicAreaName,
                componentsStats: [
                  {
                    name: valueType,
                    value:
                      valueType === PledgesContributionsGeoFieldsMapping.pledge
                        ? _.sumBy(
                            pledges,
                            PledgesContributionsGeoFieldsMapping.amount,
                          )
                        : _.sumBy(
                            contributions,
                            PledgesContributionsGeoFieldsMapping.amount,
                          ),
                  },
                ],
                value:
                  valueType === PledgesContributionsGeoFieldsMapping.pledge
                    ? _.sumBy(
                        pledges,
                        PledgesContributionsGeoFieldsMapping.amount,
                      )
                    : _.sumBy(
                        contributions,
                        PledgesContributionsGeoFieldsMapping.amount,
                      ),
              },
            });
          } else {
            const nonPublicDonors = _.groupBy(
              donorCountries[iso3],
              PledgesContributionsGeoFieldsMapping.nonCountryDonors,
            );
            Object.keys(nonPublicDonors).forEach((donor: string) => {
              // const donorData = nonPublicDonors[donor][0];

              const pledges = _.filter(nonPublicDonors[donor], {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.pledge,
              });
              const contributions = _.filter(nonPublicDonors[donor], {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.contribution,
              });
              nonCountrySectorDonors.push({
                // code: _.get(
                //   donorData,
                //   PledgesContributionsGeoFieldsMapping.donorId,
                // ),
                name: donor,
                value:
                  valueType === PledgesContributionsGeoFieldsMapping.pledge
                    ? _.sumBy(
                        pledges,
                        PledgesContributionsGeoFieldsMapping.amount,
                      )
                    : _.sumBy(
                        contributions,
                        PledgesContributionsGeoFieldsMapping.amount,
                      ),
                formattedValue: formatFinancialValue(
                  valueType === PledgesContributionsGeoFieldsMapping.pledge
                    ? _.sumBy(
                        pledges,
                        PledgesContributionsGeoFieldsMapping.amount,
                      )
                    : _.sumBy(
                        contributions,
                        PledgesContributionsGeoFieldsMapping.amount,
                      ),
                ),
                color: '#DFE3E5',
                tooltip: {
                  header: donor,
                  componentsStats: [
                    {
                      name: valueType,
                      value:
                        valueType ===
                        PledgesContributionsGeoFieldsMapping.pledge
                          ? _.sumBy(
                              pledges,
                              PledgesContributionsGeoFieldsMapping.amount,
                            )
                          : _.sumBy(
                              contributions,
                              PledgesContributionsGeoFieldsMapping.amount,
                            ),
                    },
                  ],
                  value:
                    valueType === PledgesContributionsGeoFieldsMapping.pledge
                      ? _.sumBy(
                          pledges,
                          PledgesContributionsGeoFieldsMapping.amount,
                        )
                      : _.sumBy(
                          contributions,
                          PledgesContributionsGeoFieldsMapping.amount,
                        ),
                },
              });
            });
          }
        });

        const data = [...publicSectorCountries, ...nonCountrySectorDonors];

        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/table')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  table(): object {
    const aggregation =
      PledgesContributionsTableFieldsMapping.aggregations[
        this.req.query.aggregateBy ===
        PledgesContributionsTableFieldsMapping.aggregations[0].key
          ? 0
          : 1
      ].value;
    const aggregationKey =
      this.req.query.aggregateBy ===
      PledgesContributionsTableFieldsMapping.aggregations[1].key
        ? PledgesContributionsTableFieldsMapping.aggregations[1].key
        : PledgesContributionsTableFieldsMapping.aggregations[0].key;
    const filterString = getFilterString(this.req.query, aggregation);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsTableFieldsMapping.dataPath,
          [],
        );
        const groupedByData = _.groupBy(
          rawData,
          _.get(
            PledgesContributionsTableFieldsMapping,
            aggregationKey,
            PledgesContributionsTableFieldsMapping.Donor,
          ),
        );
        const data: SimpleTableRow[] = [];
        Object.keys(groupedByData).forEach(key => {
          data.push({
            name: key,
            Pledges: _.sumBy(
              _.filter(
                groupedByData[key],
                dataItem =>
                  _.get(
                    dataItem,
                    PledgesContributionsTableFieldsMapping.indicator,
                    '',
                  ) === PledgesContributionsTableFieldsMapping.pledge,
              ),
              PledgesContributionsTableFieldsMapping.amount,
            ),
            Contributions: _.sumBy(
              _.filter(
                groupedByData[key],
                dataItem =>
                  _.get(
                    dataItem,
                    PledgesContributionsTableFieldsMapping.indicator,
                    '',
                  ) === PledgesContributionsTableFieldsMapping.contribution,
              ),
              PledgesContributionsTableFieldsMapping.amount,
            ),
          });
        });

        return {
          count: data.length,
          data: _.orderBy(data, sortByValue, sortByDirection),
        };
      })
      .catch(handleDataApiError);
  }
}

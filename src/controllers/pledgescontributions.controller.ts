import {inject} from '@loopback/core';
import {
  get,
  param,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _, {orderBy} from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import PledgesContributionsBarFieldsMapping from '../config/mapping/pledgescontributions/bar.json';
import PledgesContributionsCyclesFieldsMapping from '../config/mapping/pledgescontributions/cycles.json';
import PledgesContributionsGeoFieldsMapping from '../config/mapping/pledgescontributions/geo.json';
import PledgesContributionsStatsFieldsMapping from '../config/mapping/pledgescontributions/stats.json';
import PledgesContributionsSunburstFieldsMapping from '../config/mapping/pledgescontributions/sunburst.json';
import PledgesContributionsTimeCycleFieldsMapping from '../config/mapping/pledgescontributions/timeCycle.json';
import PledgesContributionsTimeCycleDrilldownFieldsMapping from '../config/mapping/pledgescontributions/timeCycleDrilldown.json';
import urls from '../config/urls/index.json';
import {BudgetsTreemapDataItem} from '../interfaces/budgetsTreemap';
import {FilterGroupOption} from '../interfaces/filters';
import {PledgesContributionsTreemapDataItem} from '../interfaces/pledgesContributions';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';
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

async function getBarData(urls: string[]) {
  return axios
    .all(urls.map(url => axios.get(url)))
    .then(async responses => {
      const pledgesData = _.get(
        responses[0].data,
        PledgesContributionsBarFieldsMapping.dataPath,
        [],
      );
      const contributionsData = _.get(
        responses[1].data,
        PledgesContributionsBarFieldsMapping.dataPath,
        [],
      );

      const pledges = _.groupBy(
        pledgesData,
        PledgesContributionsBarFieldsMapping.name,
      );
      const contributions = _.groupBy(
        contributionsData,
        PledgesContributionsBarFieldsMapping.name,
      );

      const years = _.uniq([
        ...Object.keys(pledges),
        ...Object.keys(contributions),
      ]);

      const data = years.map(year => {
        return {
          name: year,
          value: _.sumBy(
            pledges[year],
            PledgesContributionsBarFieldsMapping.value,
          ),
          value1: _.sumBy(
            contributions[year],
            PledgesContributionsBarFieldsMapping.value,
          ),
        };
      });

      return data;
    })
    .catch(handleDataApiError);
}

export class PledgescontributionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

  @get('/pledges-contributions/stats')
  @response(200)
  async stats() {
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsStatsFieldsMapping.totalValuesUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const filterString2 = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsStatsFieldsMapping.donorTypesCountUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return axios
      .all([axios.get(url1), axios.get(url2)])
      .then(responses => {
        const totalValues = _.get(
          responses[0].data,
          PledgesContributionsStatsFieldsMapping.dataPath,
          [],
        );
        const donorTypesCount = _.get(
          responses[1].data,
          PledgesContributionsStatsFieldsMapping.dataPath,
          [],
        );

        const totalPledges = _.get(
          _.find(totalValues, {
            [PledgesContributionsStatsFieldsMapping.indicatorField]:
              PledgesContributionsStatsFieldsMapping.pledgeIndicator,
          }),
          PledgesContributionsStatsFieldsMapping.pledgeAmount,
          0,
        );

        const totalContributions = _.get(
          _.find(totalValues, {
            [PledgesContributionsStatsFieldsMapping.indicatorField]:
              PledgesContributionsStatsFieldsMapping.contributionIndicator,
          }),
          PledgesContributionsStatsFieldsMapping.contributionAmount,
          0,
        );

        const data = {
          totalPledges,
          totalContributions,
          percentage: (totalContributions * 100) / totalPledges,
          donorTypesCount: _.map(donorTypesCount, item => ({
            name: _.get(
              item,
              `[${PledgesContributionsStatsFieldsMapping.donorType}]`,
              '',
            ),
            value: _.get(item, PledgesContributionsStatsFieldsMapping.count, 0),
          })),
        };

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/expandable-bar')
  @response(200)
  async expandableBar() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.donorBarUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsBarFieldsMapping.dataPath,
          [],
        );

        const data: {
          name: string;
          value: number;
          value1: number;
          items: {
            name: string;
            value: number;
            value1: number;
          }[];
        }[] = [];

        const formatted: any[] = [];

        rawData.forEach((item: any) => {
          const obj = {
            indicatorName: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorField,
              '',
            ),
            actualAmount: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorContributionAmount,
              0,
            ),
            plannedAmount: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorPledgeAmount,
              0,
            ),
            donorType: '',
            donorSubType: '',
            donor: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarDonor,
              '',
            ),
          };
          if (
            _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType2,
              null,
            ) !== null
          ) {
            obj.donorType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType2,
              '',
            );
            obj.donorSubType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType,
              '',
            );
          } else {
            obj.donorType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType,
              '',
            );
          }
          formatted.push(obj);
        });

        const groupedByDonorType = _.groupBy(formatted, 'donorType');

        _.forEach(groupedByDonorType, (value, key) => {
          const groupedByDonorSubType = _.groupBy(value, 'donorSubType');
          const obj = {
            name: key,
            value: _.sumBy(value, 'plannedAmount'),
            value1: _.sumBy(value, 'actualAmount'),
            items: _.map(
              groupedByDonorSubType,
              (donorSubTypeValue, donorSubTypeKey) => {
                const groupedByDonor = _.groupBy(donorSubTypeValue, 'donor');
                return {
                  name: donorSubTypeKey,
                  value: _.sumBy(donorSubTypeValue, 'plannedAmount'),
                  value1: _.sumBy(donorSubTypeValue, 'actualAmount'),
                  items: _.map(groupedByDonor, (donorValue, donorKey) => ({
                    name: donorKey,
                    value: _.sumBy(donorValue, 'plannedAmount'),
                    value1: _.sumBy(donorValue, 'actualAmount'),
                  })),
                };
              },
            ),
          };
          const nullObj = _.find(obj.items, {name: ''});
          if (nullObj) {
            nullObj.items.forEach((item: any) => {
              obj.items.push(item);
            });
            obj.items = _.filter(obj.items, item => item.name !== '');
          }
          data.push(obj);
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/sunburst/{type}')
  @response(200)
  async sunburst(@param.path.string('type') type: string) {
    const urlParams =
      type === 'pledge'
        ? PledgesContributionsSunburstFieldsMapping.pledgeUrlParams
        : PledgesContributionsSunburstFieldsMapping.contributionUrlParams;
    const filterString = filterFinancialIndicators(
      this.req.query,
      urlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsSunburstFieldsMapping.dataPath,
          [],
        );

        const data: {
          name: string;
          value: number;
          children: {
            name: string;
            value: number;
          }[];
        }[] = [];

        const formatted: any[] = [];

        rawData.forEach((item: any) => {
          const obj = {
            value: _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.amount,
              0,
            ),
            donorType: '',
            donorSubType: '',
            donor: _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.donor,
              '',
            ),
          };
          if (
            _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.type2,
              null,
            ) !== null
          ) {
            obj.donorType = _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.type2,
              '',
            );
            obj.donorSubType = _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.type,
              '',
            );
          } else {
            obj.donorType = _.get(
              item,
              PledgesContributionsSunburstFieldsMapping.type,
              '',
            );
          }
          formatted.push(obj);
        });

        const groupedByDonorType = _.groupBy(formatted, 'donorType');

        _.forEach(groupedByDonorType, (value, key) => {
          const groupedByDonorSubType = _.groupBy(value, 'donorSubType');
          const obj = {
            name: key,
            value: _.sumBy(value, 'value'),
            children: _.map(
              groupedByDonorSubType,
              (donorSubTypeValue, donorSubTypeKey) => {
                const groupedByDonor = _.groupBy(donorSubTypeValue, 'donor');
                return {
                  name: donorSubTypeKey,
                  value: _.sumBy(donorSubTypeValue, 'value'),
                  children: _.map(groupedByDonor, (donorValue, donorKey) => ({
                    name: donorKey,
                    value: _.sumBy(donorValue, 'value'),
                  })),
                };
              },
            ),
          };
          const nullObj = _.find(obj.children, {name: ''});
          if (nullObj) {
            nullObj.children.forEach((item: any) => {
              obj.children.push(item);
            });
            obj.children = _.filter(obj.children, item => item.name !== '');
          }
          data.push(obj);
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/table')
  @response(200)
  async table() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.donorBarUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsBarFieldsMapping.dataPath,
          [],
        );

        const data: {
          name: string;
          pledge: number;
          contribution: number;
          _children: {
            name: string;
            pledge: number;
            contribution: number;
          }[];
        }[] = [];

        const formatted: any[] = [];

        rawData.forEach((item: any) => {
          const obj = {
            indicatorName: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorField,
              '',
            ),
            actualAmount: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorContributionAmount,
              0,
            ),
            plannedAmount: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarIndicatorPledgeAmount,
              0,
            ),
            donorType: '',
            donorSubType: '',
            donor: _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarDonor,
              '',
            ),
          };
          if (
            _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType2,
              null,
            ) !== null
          ) {
            obj.donorType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType2,
              '',
            );
            obj.donorSubType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType,
              '',
            );
          } else {
            obj.donorType = _.get(
              item,
              PledgesContributionsBarFieldsMapping.donorBarType,
              '',
            );
          }
          formatted.push(obj);
        });

        const groupedByDonorType = _.groupBy(formatted, 'donorType');

        _.forEach(groupedByDonorType, (value, key) => {
          const groupedByDonorSubType = _.groupBy(value, 'donorSubType');
          const obj = {
            name: key,
            pledge: _.sumBy(value, 'plannedAmount'),
            contribution: _.sumBy(value, 'actualAmount'),
            _children: _.map(
              groupedByDonorSubType,
              (donorSubTypeValue, donorSubTypeKey) => {
                const groupedByDonor = _.groupBy(donorSubTypeValue, 'donor');
                return {
                  name: donorSubTypeKey,
                  pledge: _.sumBy(donorSubTypeValue, 'plannedAmount'),
                  contribution: _.sumBy(donorSubTypeValue, 'actualAmount'),
                  _children: _.map(groupedByDonor, (donorValue, donorKey) => ({
                    name: donorKey,
                    pledge: _.sumBy(donorValue, 'plannedAmount'),
                    contribution: _.sumBy(donorValue, 'actualAmount'),
                  })),
                };
              },
            ),
          };
          const nullObj = _.find(obj._children, {name: ''});
          if (nullObj) {
            nullObj._children.forEach((item: any) => {
              obj._children.push(item);
            });
            obj._children = _.filter(obj._children, item => item.name !== '');
          }
          data.push(obj);
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/pledges-contributions/bar')
  @response(200)
  async bar() {
    let filterString1 = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.pledgesUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    let filterString2 = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.contributionsUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    const data = await getBarData([url1, url2]);

    return {data};
  }

  @get('/pledges-contributions/bar/{countryCode}')
  @response(200)
  async barInLocation(@param.path.string('countryCode') countryCode: string) {
    let filterString1 = filterFinancialIndicators(
      {
        ...this.req.query,
        geographies: countryCode,
      },
      PledgesContributionsBarFieldsMapping.pledgesUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    let filterString2 = filterFinancialIndicators(
      {
        ...this.req.query,
        geographies: countryCode,
      },
      PledgesContributionsBarFieldsMapping.contributionsUrlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return getBarData([url1, url2]);
  }

  @get('/pledges-contributions/cycles')
  @response(200)
  async cycles() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      PledgesContributionsCyclesFieldsMapping.urlParams,
      ['donor/geography/name', 'donor/geography/code'],
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsCyclesFieldsMapping.dataPath,
          [],
        );

        const data = _.map(rawData, (item, index) => {
          const from = _.get(
            item,
            PledgesContributionsCyclesFieldsMapping.cycleFrom,
            '',
          );
          const to = _.get(
            item,
            PledgesContributionsCyclesFieldsMapping.cycleTo,
            '',
          );

          let value = from;

          if (from && to) {
            value = `${from} - ${to}`;
          }

          return {
            name: `Cycle ${index + 1}`,
            value,
          };
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  // v2

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
                      if (_.find(option.options, {label: donor})) {
                        subType = option.name;
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

  // @get('/pledges-contributions/table')
  // @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  // table(): object {
  //   const aggregation =
  //     PledgesContributionsTableFieldsMapping.aggregations[
  //       this.req.query.aggregateBy ===
  //       PledgesContributionsTableFieldsMapping.aggregations[0].key
  //         ? 0
  //         : 1
  //     ].value;
  //   const aggregationKey =
  //     this.req.query.aggregateBy ===
  //     PledgesContributionsTableFieldsMapping.aggregations[1].key
  //       ? PledgesContributionsTableFieldsMapping.aggregations[1].key
  //       : PledgesContributionsTableFieldsMapping.aggregations[0].key;
  //   const filterString = getFilterString(this.req.query, aggregation);
  //   const params = querystring.stringify(
  //     {},
  //     '&',
  //     filtering.param_assign_operator,
  //     {
  //       encodeURIComponent: (str: string) => str,
  //     },
  //   );
  //   const url = `${urls.pledgescontributions}/?${params}${filterString}`;
  //   const sortBy = this.req.query.sortBy;
  //   const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
  //   const sortByDirection: any =
  //     sortBy && sortBy.toString().split(' ').length > 1
  //       ? sortBy.toString().split(' ')[1].toLowerCase()
  //       : 'asc';

  //   return axios
  //     .get(url)
  //     .then((resp: AxiosResponse) => {
  //       const rawData = _.get(
  //         resp.data,
  //         PledgesContributionsTableFieldsMapping.dataPath,
  //         [],
  //       );
  //       const groupedByData = _.groupBy(
  //         rawData,
  //         _.get(
  //           PledgesContributionsTableFieldsMapping,
  //           aggregationKey,
  //           PledgesContributionsTableFieldsMapping.Donor,
  //         ),
  //       );
  //       const data: SimpleTableRow[] = [];
  //       Object.keys(groupedByData).forEach(key => {
  //         data.push({
  //           name: key,
  //           Pledges: _.sumBy(
  //             _.filter(
  //               groupedByData[key],
  //               dataItem =>
  //                 _.get(
  //                   dataItem,
  //                   PledgesContributionsTableFieldsMapping.indicator,
  //                   '',
  //                 ) === PledgesContributionsTableFieldsMapping.pledge,
  //             ),
  //             PledgesContributionsTableFieldsMapping.amount,
  //           ),
  //           Contributions: _.sumBy(
  //             _.filter(
  //               groupedByData[key],
  //               dataItem =>
  //                 _.get(
  //                   dataItem,
  //                   PledgesContributionsTableFieldsMapping.indicator,
  //                   '',
  //                 ) === PledgesContributionsTableFieldsMapping.contribution,
  //             ),
  //             PledgesContributionsTableFieldsMapping.amount,
  //           ),
  //         });
  //       });

  //       return {
  //         count: data.length,
  //         data: _.orderBy(data, sortByValue, sortByDirection),
  //       };
  //     })
  //     .catch(handleDataApiError);
  // }
}

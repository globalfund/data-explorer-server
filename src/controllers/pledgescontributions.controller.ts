import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import PledgesContributionsBarFieldsMapping from '../config/mapping/pledgescontributions/bar.json';
import PledgesContributionsCyclesFieldsMapping from '../config/mapping/pledgescontributions/cycles.json';
import PledgesContributionsStatsFieldsMapping from '../config/mapping/pledgescontributions/stats.json';
import PledgesContributionsSunburstFieldsMapping from '../config/mapping/pledgescontributions/sunburst.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

async function getBarData(urls1: string[]) {
  return axios
    .all(urls1.map(url => axios.get(url)))
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

      return years.map(year => {
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
    })
    .catch(handleDataApiError);
}

export class PledgescontributionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/pledges-contributions/stats')
  @response(200)
  async stats() {
    const filterString1 = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsStatsFieldsMapping.totalValuesUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
    );
    const filterString2 = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsStatsFieldsMapping.donorTypesCountUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
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
    const filterString = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.donorBarUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
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
    const filterString = await filterFinancialIndicators(
      this.req.query,
      urlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
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
    const filterString = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.donorBarUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
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
    let filterString1 = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.pledgesUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
    );
    let filterString2 = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsBarFieldsMapping.contributionsUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    const data = await getBarData([url1, url2]);

    return {data};
  }

  @get('/pledges-contributions/bar/{countryCode}')
  @response(200)
  async barInLocation(@param.path.string('countryCode') countryCode: string) {
    let filterString1 = await filterFinancialIndicators(
      {
        ...this.req.query,
        geographies: countryCode,
      },
      PledgesContributionsBarFieldsMapping.pledgesUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
    );
    let filterString2 = await filterFinancialIndicators(
      {
        ...this.req.query,
        geographies: countryCode,
      },
      PledgesContributionsBarFieldsMapping.contributionsUrlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return getBarData([url1, url2]);
  }

  @get('/pledges-contributions/cycles')
  @response(200)
  async cycles() {
    const filterString = await filterFinancialIndicators(
      this.req.query,
      PledgesContributionsCyclesFieldsMapping.urlParams,
      'donor/geography/code',
      'activityArea/name',
      'pledge-contribution',
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
}

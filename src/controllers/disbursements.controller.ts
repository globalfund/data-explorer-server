import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import BarChartFieldsMapping from '../config/mapping/disbursements/barChart.json';
import DisbursementsCyclesMapping from '../config/mapping/disbursements/cycles.json';
import LineChartFieldsMapping from '../config/mapping/disbursements/lineChart.json';
import TableFieldsMapping from '../config/mapping/disbursements/table.json';
import FinancialInsightsStatsMapping from '../config/mapping/financialInsightsStats.json';
import urls from '../config/urls/index.json';
import CycleMapping from '../static-assets/cycle-mapping.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

export class DisbursementsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/financial-insights/stats/{componentField}/{geographyGrouping}')
  @response(200)
  async financialInsightsStats(
    @param.path.string('componentField') componentField: string,
    @param.path.string('geographyGrouping') geographyGrouping: string,
  ) {
    let geographyMappings = [
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/geography/code',
    ];
    if (geographyGrouping === 'Portfolio View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_PortfolioView/name',
        'implementationPeriod/grant/geography_PortfolioView/code',
      ];
    } else if (geographyGrouping === 'Board Constituency View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_BoardConstituencyView/name',
        'implementationPeriod/grant/geography_BoardConstituencyView/code',
      ];
    }
    const filterString = filterFinancialIndicators(
      this.req.query,
      FinancialInsightsStatsMapping.urlParams,
      geographyMappings,
      `${componentField}/name`,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(
          resp.data,
          FinancialInsightsStatsMapping.dataPath,
          [],
        );
        return {
          data: [
            {
              signed: _.get(
                _.find(raw, {
                  [FinancialInsightsStatsMapping.indicatorField]:
                    FinancialInsightsStatsMapping.signed,
                }),
                FinancialInsightsStatsMapping.valueField,
                0,
              ),
              committed: _.get(
                _.find(raw, {
                  [FinancialInsightsStatsMapping.indicatorField]:
                    FinancialInsightsStatsMapping.commitment,
                }),
                FinancialInsightsStatsMapping.valueField,
                0,
              ),
              disbursed: _.get(
                _.find(raw, {
                  [FinancialInsightsStatsMapping.indicatorField]:
                    FinancialInsightsStatsMapping.disbursement,
                }),
                FinancialInsightsStatsMapping.valueField,
                0,
              ),
            },
          ],
        };
      })
      .catch(handleDataApiError);
  }

  @get('/disbursements/bar-chart/{componentField}/{geographyGrouping}')
  @response(200)
  async barChart(
    @param.path.string('componentField') componentField: string,
    @param.path.string('geographyGrouping') geographyGrouping: string,
  ) {
    let geographyMappings = [
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/geography/code',
    ];
    if (geographyGrouping === 'Portfolio View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_PortfolioView/name',
        'implementationPeriod/grant/geography_PortfolioView/code',
      ];
    } else if (geographyGrouping === 'Board Constituency View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_BoardConstituencyView/name',
        'implementationPeriod/grant/geography_BoardConstituencyView/code',
      ];
    }
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      BarChartFieldsMapping.urlParams1.replace(
        '<componentField>',
        componentField,
      ),
      geographyMappings,
      `implementationPeriod/grant/${componentField}/name`,
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const nameField1 = BarChartFieldsMapping.name.replace(
      '<componentField>',
      componentField,
    );

    let filterString2 = '';
    let url2 = '';
    const nameField2 = BarChartFieldsMapping.name.replace(
      '<componentField>',
      `${componentField}.parent`,
    );

    if (componentField === 'activityAreaGroup') {
      filterString2 = filterFinancialIndicators(
        this.req.query,
        BarChartFieldsMapping.urlParams2.replace(
          '<componentField>',
          componentField,
        ),
        geographyMappings,
        `implementationPeriod/grant/${componentField}/parent/name`,
      );
      url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;
    }

    return axios
      .all(
        _.filter([url1, url2], url => url !== '').map((url: string) =>
          axios.get(url),
        ),
      )
      .then(
        axios.spread((...responses) => {
          const rawData1 = _.get(
            responses[0],
            `data.${BarChartFieldsMapping.dataPath}`,
            [],
          );
          const rawData2 = _.get(
            responses[1],
            `data.${BarChartFieldsMapping.dataPath}`,
            [],
          );

          const data: {
            name: string;
            value: number;
            itemStyle: {color: string};
          }[] = [];

          (componentField === 'activityAreaGroup'
            ? _.filter(
                rawData1,
                item =>
                  BarChartFieldsMapping.url1Items.indexOf(
                    _.get(item, nameField1, ''),
                  ) !== -1,
              )
            : rawData1
          ).forEach((item: any) => {
            data.push({
              name: _.get(item, nameField1, ''),
              value: _.get(item, BarChartFieldsMapping.value, 0),
              itemStyle: {
                color: BarChartFieldsMapping.barColor,
              },
            });
          });

          _.filter(
            rawData2,
            item =>
              BarChartFieldsMapping.url2Items.indexOf(
                _.get(item, nameField2, ''),
              ) !== -1,
          ).forEach((item: any) => {
            data.push({
              name: _.get(item, nameField2, ''),
              value: _.get(item, BarChartFieldsMapping.value, 0),
              itemStyle: {
                color: BarChartFieldsMapping.barColor,
              },
            });
          });

          return {data: _.orderBy(data, 'value', 'desc')};
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/disbursements/line-chart/{componentField}/{geographyGrouping}')
  @response(200)
  async lineChart(
    @param.path.string('componentField') componentField: string,
    @param.path.string('geographyGrouping') geographyGrouping: string,
  ) {
    let geographyMappings = [
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/geography/code',
    ];
    if (geographyGrouping === 'Portfolio View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_PortfolioView/name',
        'implementationPeriod/grant/geography_PortfolioView/code',
      ];
    } else if (geographyGrouping === 'Board Constituency View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_BoardConstituencyView/name',
        'implementationPeriod/grant/geography_BoardConstituencyView/code',
      ];
    }
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      LineChartFieldsMapping.urlParams1.replace(
        '<componentField>',
        componentField,
      ),
      geographyMappings,
      `implementationPeriod/grant/${componentField}/name`,
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const nameField1 = LineChartFieldsMapping.line.replace(
      '<componentField>',
      componentField,
    );

    let filterString2 = '';
    let url2 = '';
    const nameField2 = LineChartFieldsMapping.line.replace(
      '<componentField>',
      `${componentField}.parent`,
    );

    if (componentField === 'activityAreaGroup') {
      filterString2 = filterFinancialIndicators(
        this.req.query,
        LineChartFieldsMapping.urlParams2.replace(
          '<componentField>',
          componentField,
        ),
        geographyMappings,
        `implementationPeriod/grant/${componentField}/parent/name`,
      );
      url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;
    }

    return axios
      .all(
        _.filter([url1, url2], url => url !== '').map((url: string) =>
          axios.get(url),
        ),
      )
      .then(
        axios.spread((...responses) => {
          const rawData1 = _.get(
            responses[0],
            `data.${LineChartFieldsMapping.dataPath}`,
            [],
          );
          const rawData2 = _.get(
            responses[1],
            `data.${LineChartFieldsMapping.dataPath}`,
            [],
          );

          const data: {
            name: string;
            data: number[];
            itemStyle: {color: string};
          }[] = [];

          const groupedByLine1 = _.groupBy(rawData1, nameField1);
          const lines1 = Object.keys(groupedByLine1);
          const years1 = Object.keys(
            _.groupBy(rawData1, LineChartFieldsMapping.cycle),
          );

          const groupedByLine2 = _.groupBy(rawData2, nameField2);
          const lines2 = Object.keys(groupedByLine2);
          const years2 = Object.keys(
            _.groupBy(rawData2, LineChartFieldsMapping.cycle),
          );

          const years = _.uniq([...years1, ...years2]);

          (componentField === 'activityAreaGroup'
            ? _.filter(
                lines1,
                item => LineChartFieldsMapping.url1Items.indexOf(item) !== -1,
              )
            : lines1
          ).forEach(line => {
            const items = groupedByLine1[line];
            data.push({
              name: line,
              data: years.map(year => {
                return _.get(
                  _.find(items, {
                    [LineChartFieldsMapping.cycle]: year,
                  }),
                  LineChartFieldsMapping.value,
                  null,
                );
              }),
              itemStyle: {
                color: '',
              },
            });
          });

          _.filter(
            lines2,
            item => LineChartFieldsMapping.url2Items.indexOf(item) !== -1,
          ).forEach(line => {
            const items = groupedByLine2[line];
            data.push({
              name: line,
              data: years.map(year => {
                return _.get(
                  _.find(items, {
                    [LineChartFieldsMapping.cycle]: year,
                  }),
                  LineChartFieldsMapping.value,
                  null,
                );
              }),
              itemStyle: {
                color: '',
              },
            });
          });

          _.orderBy(data, 'name', 'asc').forEach((item, index) => {
            item.itemStyle.color = _.get(
              LineChartFieldsMapping.colors,
              `[${index}]`,
              '',
            );
          });

          return {
            data,
            xAxisKeys: years,
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/disbursements/table/{componentField}/{geographyGrouping}')
  @response(200)
  async table(
    @param.path.string('componentField') componentField: string,
    @param.path.string('geographyGrouping') geographyGrouping: string,
  ) {
    let geographyMappings = [
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/geography/code',
    ];
    if (geographyGrouping === 'Portfolio View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_PortfolioView/name',
        'implementationPeriod/grant/geography_PortfolioView/code',
      ];
    } else if (geographyGrouping === 'Board Constituency View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_BoardConstituencyView/name',
        'implementationPeriod/grant/geography_BoardConstituencyView/code',
      ];
    }
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      TableFieldsMapping.urlParams1.replace('<componentField>', componentField),
      geographyMappings,
      `implementationPeriod/grant/${componentField}/name`,
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const nameField1 = TableFieldsMapping.component.replace(
      '<componentField>',
      componentField,
    );

    let filterString2 = '';
    let url2 = '';
    const nameField2 = TableFieldsMapping.component.replace(
      '<componentField>',
      `${componentField}.parent`,
    );

    if (componentField === 'activityAreaGroup') {
      filterString2 = filterFinancialIndicators(
        this.req.query,
        TableFieldsMapping.urlParams2.replace(
          '<componentField>',
          componentField,
        ),
        geographyMappings,
        `implementationPeriod/grant/${componentField}/parent/name`,
      );
      url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;
    }

    return axios
      .all(
        _.filter([url1, url2], url => url !== '').map((url: string) =>
          axios.get(url),
        ),
      )
      .then(
        axios.spread((...responses) => {
          const rawData1 = _.get(
            responses[0],
            `data.${TableFieldsMapping.dataPath}`,
            [],
          );
          const rawData2 = _.get(
            responses[1],
            `data.${TableFieldsMapping.dataPath}`,
            [],
          );

          const groupedByComponent1 = _.groupBy(rawData1, nameField1);
          const groupedByComponent2 = _.groupBy(rawData2, nameField2);

          return {
            data: _.orderBy(
              [
                ...(componentField === 'activityAreaGroup'
                  ? _.filter(groupedByComponent1, (_var, component) => {
                      return (
                        TableFieldsMapping.url1Items.indexOf(component) !== -1
                      );
                    })
                  : _.map(groupedByComponent1)
                ).map(items => {
                  return {
                    component: _.get(items[0], nameField1, ''),
                    grants: _.get(items[0], TableFieldsMapping.grants, 0),
                    signed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.signedIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                    committed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.commitmentIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                    disbursed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.disbursementIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                  };
                }),
                ..._.filter(groupedByComponent2, (_var, component) => {
                  return TableFieldsMapping.url2Items.indexOf(component) !== -1;
                }).map(items => {
                  return {
                    component: _.get(items[0], nameField2, ''),
                    grants: _.get(items[0], TableFieldsMapping.grants, 0),
                    signed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.signedIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                    committed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.commitmentIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                    disbursed: _.get(
                      _.find(items, {
                        [TableFieldsMapping.indicatorField]:
                          TableFieldsMapping.disbursementIndicator,
                      }),
                      TableFieldsMapping.valueField,
                      0,
                    ),
                  };
                }),
              ],
              'disbursed',
              'desc',
            ),
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/disbursements/cycles')
  @response(200)
  async cycles() {
    let geographyMappings = [
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/geography/code',
    ];
    if (this.req.query.geographyGrouping === 'Portfolio View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_PortfolioView/name',
        'implementationPeriod/grant/geography_PortfolioView/code',
      ];
    } else if (this.req.query.geographyGrouping === 'Board Constituency View') {
      geographyMappings = [
        'implementationPeriod/grant/geography_BoardConstituencyView/name',
        'implementationPeriod/grant/geography_BoardConstituencyView/code',
      ];
    }
    const filterString = filterFinancialIndicators(
      this.req.query,
      DisbursementsCyclesMapping.urlParams,
      geographyMappings,
      'activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          DisbursementsCyclesMapping.dataPath,
          [],
        );

        const data = _.map(
          _.filter(
            rawData,
            item =>
              _.get(item, DisbursementsCyclesMapping.cycleFrom, null) !== null,
          ),
          item => {
            const from = _.get(item, DisbursementsCyclesMapping.cycleFrom, '');
            const to = _.get(item, DisbursementsCyclesMapping.cycleTo, '');

            let value = from;

            if (from && to) {
              value = `${from} - ${to}`;
            }

            const name = _.find(CycleMapping, {value})?.name ?? value;

            return {
              name,
              value: name,
            };
          },
        );

        return {data};
      })
      .catch(handleDataApiError);
  }
}

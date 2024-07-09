import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import BudgetsBreakdownFieldsMapping from '../config/mapping/budgets/breakdown.json';
import BudgetsCyclesMapping from '../config/mapping/budgets/cycles.json';
import BudgetsMetricsFieldsMapping from '../config/mapping/budgets/metrics.json';
import BudgetsRadialFieldsMapping from '../config/mapping/budgets/radial.json';
import BudgetsSankeyFieldsMapping from '../config/mapping/budgets/sankey.json';
import BudgetsTableFieldsMapping from '../config/mapping/budgets/table.json';
import BudgetsTreemapFieldsMapping from '../config/mapping/budgets/treemap.json';
import urls from '../config/urls/index.json';
import {BudgetSankeyChartData} from '../interfaces/budgetSankey';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

export class BudgetsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/budgets/radial')
  @response(200)
  async radial() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      BudgetsRadialFieldsMapping.urlParams,
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return _.get(resp.data, BudgetsRadialFieldsMapping.dataPath, []).map(
          (item: any, index: number) => ({
            name: _.get(item, BudgetsRadialFieldsMapping.name, ''),
            value: _.get(item, BudgetsRadialFieldsMapping.value, 0),
            itemStyle: {
              color: _.get(BudgetsRadialFieldsMapping.colors, index, ''),
            },
          }),
        );
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/sankey')
  @response(200)
  async sankey() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      BudgetsSankeyFieldsMapping.urlParams,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          BudgetsSankeyFieldsMapping.dataPath,
          [],
        );
        const data: BudgetSankeyChartData = {
          nodes: [
            {
              name: 'Total budget',
              level: 0,
              itemStyle: {
                color: BudgetsSankeyFieldsMapping.nodeColors[0],
              },
            },
          ],
          links: [],
        };
        const groupedDataLevel1 = _.groupBy(
          rawData,
          BudgetsSankeyFieldsMapping.level1Field,
        );
        _.forEach(groupedDataLevel1, (level1Data, level1) => {
          data.nodes.push({
            name: level1,
            level: 1,
            itemStyle: {
              color: BudgetsSankeyFieldsMapping.nodeColors[1],
            },
          });
          data.links.push({
            source: data.nodes[0].name,
            target: level1,
            value: _.sumBy(level1Data, BudgetsSankeyFieldsMapping.valueField),
          });

          const groupedDataLevel2 = _.groupBy(
            level1Data,
            BudgetsSankeyFieldsMapping.level2Field,
          );
          _.forEach(groupedDataLevel2, (level2Data, level2) => {
            const level2inLevel1 = _.find(data.nodes, {
              name: level2,
              level: 1,
            });
            data.nodes.push({
              name: level2inLevel1 ? `${level2}1` : level2,
              level: 2,
              itemStyle: {
                color: BudgetsSankeyFieldsMapping.nodeColors[2],
              },
            });
            data.links.push({
              source: level1,
              target: level2inLevel1 ? `${level2}1` : level2,
              value: _.sumBy(level2Data, BudgetsSankeyFieldsMapping.valueField),
            });

            const groupedDataLevel3 = _.groupBy(
              level2Data,
              BudgetsSankeyFieldsMapping.level3Field,
            );
            _.forEach(groupedDataLevel3, (level3Data, level3) => {
              const level3inLevel2 = _.find(data.nodes, {
                name: level3,
                level: 2,
              });
              data.nodes.push({
                name: level3inLevel2 ? `${level3}1` : level3,
                level: 3,
                itemStyle: {
                  color: BudgetsSankeyFieldsMapping.nodeColors[2],
                },
              });
              data.links.push({
                source: level2,
                target: level3inLevel2 ? `${level3}1` : level3,
                value: _.sumBy(
                  level3Data,
                  BudgetsSankeyFieldsMapping.valueField,
                ),
              });
            });
          });
        });
        data.nodes = _.uniqBy(data.nodes, 'name');
        data.nodes = _.orderBy(
          data.nodes,
          node => {
            const links = _.filter(data.links, {target: node.name});
            return _.sumBy(links, 'value');
          },
          'desc',
        );
        data.links = _.orderBy(data.links, 'value', 'desc');
        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/treemap/{componentField}')
  @response(200)
  async treemap(@param.path.string('componentField') componentField: string) {
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      BudgetsTreemapFieldsMapping.urlParams1.replace(
        '<componentField>',
        componentField,
      ),
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      `implementationPeriod/grant/${componentField}/name`,
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const nameField1 = BudgetsTreemapFieldsMapping.name.replace(
      '<componentField>',
      componentField,
    );

    let filterString2 = '';
    let url2 = '';
    const nameField2 = BudgetsTreemapFieldsMapping.name.replace(
      '<componentField>',
      `${componentField}.parent`,
    );

    if (componentField === 'activityAreaGroup') {
      filterString2 = filterFinancialIndicators(
        this.req.query,
        BudgetsTreemapFieldsMapping.urlParams2.replace(
          '<componentField>',
          componentField,
        ),
        'implementationPeriod/grant/geography/name',
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
            `data.${BudgetsTreemapFieldsMapping.dataPath}`,
            [],
          );
          const rawData2 = _.get(
            responses[1],
            `data.${BudgetsTreemapFieldsMapping.dataPath}`,
            [],
          );

          const data: {
            name: string;
            value: number;
            itemStyle: {
              color: string;
            };
            label: {
              normal: {
                color: string;
              };
            };
          }[] = [];

          (componentField === 'activityAreaGroup'
            ? _.filter(
                rawData1,
                item =>
                  BudgetsTreemapFieldsMapping.url1Items.indexOf(
                    _.get(item, nameField1, ''),
                  ) !== -1,
              )
            : rawData1
          ).forEach((item: any) => {
            data.push({
              name: _.get(item, nameField1, ''),
              value: _.get(item, BudgetsTreemapFieldsMapping.value, 0),
              itemStyle: {
                color: '',
              },
              label: {
                normal: {
                  color: '',
                },
              },
            });
          });

          _.filter(
            rawData2,
            item =>
              BudgetsTreemapFieldsMapping.url2Items.indexOf(
                _.get(item, nameField2, ''),
              ) !== -1,
          ).forEach(item => {
            data.push({
              name: _.get(item, nameField2, ''),
              value: _.get(item, BudgetsTreemapFieldsMapping.value, 0),
              itemStyle: {
                color: '',
              },
              label: {
                normal: {
                  color: '',
                },
              },
            });
          });

          _.orderBy(data, 'value', 'desc').forEach((item, index) => {
            item.itemStyle.color = _.get(
              BudgetsTreemapFieldsMapping.textbgcolors,
              `[${index}].color`,
              '',
            );
            item.label.normal.color = _.get(
              BudgetsTreemapFieldsMapping.textbgcolors,
              `[${index}].textcolor`,
              '',
            );
          });

          return {data};
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/budgets/table')
  @response(200)
  async table() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      BudgetsTableFieldsMapping.urlParams,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          BudgetsTableFieldsMapping.dataPath,
          [],
        );
        const groupedByLevel1 = _.groupBy(
          rawData,
          BudgetsTableFieldsMapping.level1Field,
        );

        const data: {
          name: string;
          amount: number;
          _children: {
            name: string;
            amount: number;
            _children: {
              name: string;
              amount: number;
            }[];
          }[];
        }[] = [];

        _.forEach(groupedByLevel1, (level1Data, level1) => {
          const grouepdByLevel2 = _.groupBy(
            level1Data,
            BudgetsTableFieldsMapping.level2Field,
          );
          const level1Amount = _.sumBy(
            level1Data,
            BudgetsTableFieldsMapping.valueField,
          );
          const level1Children = _.map(
            grouepdByLevel2,
            (level2Data, level2) => {
              const groupedByLevel3 = _.groupBy(
                level2Data,
                BudgetsTableFieldsMapping.level3Field,
              );
              const level2Amount = _.sumBy(
                level2Data,
                BudgetsTableFieldsMapping.valueField,
              );
              return {
                name: level2,
                amount: level2Amount,
                _children: _.map(groupedByLevel3, (level3Data, level3) => {
                  const level3Amount = _.sumBy(
                    level3Data,
                    BudgetsTableFieldsMapping.valueField,
                  );
                  return {
                    name: level3,
                    amount: level3Amount,
                  };
                }),
              };
            },
          );
          data.push({
            name: level1,
            amount: level1Amount,
            _children: level1Children,
          });
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/cycles')
  @response(200)
  async cycles() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      BudgetsCyclesMapping.urlParams,
      'implementationPeriod/grant/geography/code',
      'implementationPeriod/grant/activityArea/name',
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, BudgetsCyclesMapping.dataPath, []);

        const data = _.orderBy(
          _.map(
            _.filter(
              rawData,
              item =>
                _.get(item, BudgetsCyclesMapping.cycleFrom, null) !== null,
            ),
            (item, index) => {
              const from = _.get(item, BudgetsCyclesMapping.cycleFrom, '');
              const to = _.get(item, BudgetsCyclesMapping.cycleTo, '');

              let value = from;

              if (from && to) {
                value = `${from} - ${to}`;
              }

              return {
                name: `Cycle ${index + 1}`,
                value,
              };
            },
          ),
          item => parseInt(item.value.toString().split(' - ')[0], 10),
          'asc',
        );

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/breakdown/{cycle}/{componentField}')
  @response(200)
  async breakdown(
    @param.path.string('cycle') cycle: string,
    @param.path.string('componentField') componentField: string,
  ) {
    const years = cycle.split('-');

    const filterString1 = filterFinancialIndicators(
      {
        ...this.req.query,
        years: years[0],
        yearsTo: years[1],
      },
      BudgetsBreakdownFieldsMapping.urlParams1.replace(
        '<componentField>',
        componentField,
      ),
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      `implementationPeriod/grant/${componentField}/name`,
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const nameField1 = BudgetsBreakdownFieldsMapping.name.replace(
      '<componentField>',
      componentField,
    );

    let filterString2 = '';
    let url2 = '';
    const nameField2 = BudgetsBreakdownFieldsMapping.name.replace(
      '<componentField>',
      `${componentField}.parent`,
    );

    if (componentField === 'activityAreaGroup') {
      filterString2 = filterFinancialIndicators(
        {
          ...this.req.query,
          years: years[0],
          yearsTo: years[1],
        },
        BudgetsBreakdownFieldsMapping.urlParams2.replace(
          '<componentField>',
          componentField,
        ),
        'implementationPeriod/grant/geography/name',
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
            `data.${BudgetsTreemapFieldsMapping.dataPath}`,
            [],
          );
          const rawData2 = _.get(
            responses[1],
            `data.${BudgetsTreemapFieldsMapping.dataPath}`,
            [],
          );

          const data: {
            name: string;
            value: number;
            color: string;
          }[] = [];

          (componentField === 'activityAreaGroup'
            ? _.filter(
                rawData1,
                item =>
                  BudgetsTreemapFieldsMapping.url1Items.indexOf(
                    _.get(item, nameField1, ''),
                  ) !== -1,
              )
            : rawData1
          ).forEach((item: any) => {
            data.push({
              name: _.get(item, nameField1, ''),
              value: _.get(item, BudgetsTreemapFieldsMapping.value, 0),
              color: '',
            });
          });

          _.filter(
            rawData2,
            item =>
              BudgetsTreemapFieldsMapping.url2Items.indexOf(
                _.get(item, nameField2, ''),
              ) !== -1,
          ).forEach(item => {
            data.push({
              name: _.get(item, nameField2, ''),
              value: _.get(item, BudgetsTreemapFieldsMapping.value, 0),
              color: '',
            });
          });

          const total = _.sumBy(data, 'value');

          data.forEach((item, index) => {
            item.value = (item.value / total) * 100;
          });

          return {
            data: _.orderBy(data, 'value', 'desc').map((item, index) => {
              item.color = _.get(
                BudgetsBreakdownFieldsMapping.colors,
                index,
                '',
              );
              return item;
            }),
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/budgets/utilization')
  @response(200)
  async utilization() {
    // (disbursement + cash balance) / budget
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParams,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const filterString2 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParamsOrganisations,
      'implementationPeriod/grant/geography/name',
      'implementationPeriod/grant/activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return axios
      .all([axios.get(url1), axios.get(url2)])
      .then(
        axios.spread((...responses) => {
          const raw1 = _.get(
            responses[0].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const raw2 = _.get(
            responses[1].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const disbursement = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.disbursementIndicatorName,
          });
          const cashBalance = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.cashBalanceIndicatorName,
          });
          const budget = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.budgetIndicatorName,
          });
          const disbursementValue = _.get(
            disbursement,
            BudgetsMetricsFieldsMapping.disbursementValue,
            0,
          );
          const cashBalanceValue = _.get(
            cashBalance,
            BudgetsMetricsFieldsMapping.cashBalanceValue,
            0,
          );
          const budgetValue = _.get(
            budget,
            BudgetsMetricsFieldsMapping.budgetValue,
            0,
          );
          const totalValue = disbursementValue + cashBalanceValue;
          const utilization = (totalValue / budgetValue) * 100;

          const groupedByOrganisationType = _.groupBy(
            raw2,
            BudgetsMetricsFieldsMapping.organisationType,
          );
          const items = _.map(groupedByOrganisationType, (value, key) => {
            const disbursement = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.disbursementIndicatorName,
            );
            const cashBalance = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.cashBalanceIndicatorName,
            );
            const budget = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.budgetIndicatorName,
            );
            const disbursementValue = _.sumBy(
              disbursement,
              BudgetsMetricsFieldsMapping.disbursementValue,
            );
            const cashBalanceValue = _.sumBy(
              cashBalance,
              BudgetsMetricsFieldsMapping.cashBalanceValue,
            );
            const budgetValue = _.sumBy(
              budget,
              BudgetsMetricsFieldsMapping.budgetValue,
            );
            const totalValue = disbursementValue + cashBalanceValue;
            const utilization = (totalValue / budgetValue) * 100;
            const groupedBySubOrganisations = _.groupBy(
              value,
              BudgetsMetricsFieldsMapping.organisationSubType,
            );
            return {
              level: 0,
              name: key,
              value: utilization,
              color: '#013E77',
              items: _.orderBy(
                _.map(groupedBySubOrganisations, (value2, key2) => {
                  const disbursement = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.disbursementIndicatorName,
                  );
                  const cashBalance = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.cashBalanceIndicatorName,
                  );
                  const budget = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.budgetIndicatorName,
                  );
                  const disbursementValue = _.sumBy(
                    disbursement,
                    BudgetsMetricsFieldsMapping.disbursementValue,
                  );
                  const cashBalanceValue = _.sumBy(
                    cashBalance,
                    BudgetsMetricsFieldsMapping.cashBalanceValue,
                  );
                  const budgetValue = _.sumBy(
                    budget,
                    BudgetsMetricsFieldsMapping.budgetValue,
                  );
                  const totalValue = disbursementValue + cashBalanceValue;
                  const utilization = (totalValue / budgetValue) * 100;
                  const groupedByOrganisations = _.groupBy(
                    value2,
                    BudgetsMetricsFieldsMapping.organisationName,
                  );
                  return {
                    level: 1,
                    name: key2,
                    value: utilization,
                    color: '#013E77',
                    items: _.orderBy(
                      _.map(groupedByOrganisations, (value3, key3) => {
                        const disbursement = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.disbursementIndicatorName,
                        );
                        const cashBalance = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.cashBalanceIndicatorName,
                        );
                        const budget = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.budgetIndicatorName,
                        );
                        const disbursementValue = _.sumBy(
                          disbursement,
                          BudgetsMetricsFieldsMapping.disbursementValue,
                        );
                        const cashBalanceValue = _.sumBy(
                          cashBalance,
                          BudgetsMetricsFieldsMapping.cashBalanceValue,
                        );
                        const budgetValue = _.sumBy(
                          budget,
                          BudgetsMetricsFieldsMapping.budgetValue,
                        );
                        const totalValue = disbursementValue + cashBalanceValue;
                        const utilization = (totalValue / budgetValue) * 100;
                        return {
                          level: 2,
                          name: key3,
                          value: utilization,
                          color: '#013E77',
                          items: [],
                        };
                      }),
                      'name',
                      'asc',
                    ),
                  };
                }),
                'name',
                'asc',
              ),
            };
          });

          return {
            data: [
              {
                value: utilization,
                items: _.orderBy(items, 'name', 'asc'),
              },
            ],
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/budgets/absorption')
  @response(200)
  async absorption() {
    // expenditure / budget
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParams,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const filterString2 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParamsOrganisations,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return axios
      .all([axios.get(url1), axios.get(url2)])
      .then(
        axios.spread((...responses) => {
          const raw1 = _.get(
            responses[0].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const raw2 = _.get(
            responses[1].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const expenditure = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.expenditureIndicatorName,
          });
          const budget = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.budgetIndicatorName,
          });
          const expenditureValue = _.get(
            expenditure,
            BudgetsMetricsFieldsMapping.expenditureValue,
            0,
          );
          const budgetValue = _.get(
            budget,
            BudgetsMetricsFieldsMapping.budgetValue,
            0,
          );
          const absorption = (expenditureValue / budgetValue) * 100;

          const groupedByOrganisationType = _.groupBy(
            raw2,
            BudgetsMetricsFieldsMapping.organisationType,
          );
          const items = _.map(groupedByOrganisationType, (value, key) => {
            const expenditure = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.expenditureIndicatorName,
            );
            const budget = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.budgetIndicatorName,
            );
            const expenditureValue = _.sumBy(
              expenditure,
              BudgetsMetricsFieldsMapping.expenditureValue,
            );
            const budgetValue = _.sumBy(
              budget,
              BudgetsMetricsFieldsMapping.budgetValue,
            );
            const absorption = (expenditureValue / budgetValue) * 100;
            const groupedBySubOrganisations = _.groupBy(
              value,
              BudgetsMetricsFieldsMapping.organisationSubType,
            );
            return {
              level: 0,
              name: key,
              value: absorption,
              color: '#00B5AE',
              items: _.orderBy(
                _.map(groupedBySubOrganisations, (value2, key2) => {
                  const expenditure = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.expenditureIndicatorName,
                  );
                  const budget = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.budgetIndicatorName,
                  );
                  const expenditureValue = _.sumBy(
                    expenditure,
                    BudgetsMetricsFieldsMapping.expenditureValue,
                  );
                  const budgetValue = _.sumBy(
                    budget,
                    BudgetsMetricsFieldsMapping.budgetValue,
                  );
                  const absorption = (expenditureValue / budgetValue) * 100;
                  const groupedByOrganisations = _.groupBy(
                    value2,
                    BudgetsMetricsFieldsMapping.organisationName,
                  );
                  return {
                    level: 1,
                    name: key2,
                    value: absorption,
                    color: '#00B5AE',
                    items: _.orderBy(
                      _.map(groupedByOrganisations, (value3, key3) => {
                        const expenditure = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.expenditureIndicatorName,
                        );
                        const budget = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.budgetIndicatorName,
                        );
                        const expenditureValue = _.sumBy(
                          expenditure,
                          BudgetsMetricsFieldsMapping.expenditureValue,
                        );
                        const budgetValue = _.sumBy(
                          budget,
                          BudgetsMetricsFieldsMapping.budgetValue,
                        );
                        const absorption =
                          (expenditureValue / budgetValue) * 100;
                        return {
                          level: 2,
                          name: key3,
                          value: absorption,
                          color: '#00B5AE',
                          items: [],
                        };
                      }),
                      'name',
                      'asc',
                    ),
                  };
                }),
                'name',
                'asc',
              ),
            };
          });

          return {
            data: [
              {
                value: absorption,
                items: _.orderBy(items, 'name', 'asc'),
              },
            ],
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/disbursements/utilization')
  @response(200)
  async disbursementsUtilization() {
    // expenditure / disbursement
    const filterString1 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParams,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const filterString2 = filterFinancialIndicators(
      this.req.query,
      BudgetsMetricsFieldsMapping.urlParamsOrganisations,
      [
        'implementationPeriod/grant/geography/name',
        'implementationPeriod/grant/geography/code',
      ],
      'implementationPeriod/grant/activityArea/name',
    );
    const url1 = `${urls.FINANCIAL_INDICATORS}/${filterString1}`;
    const url2 = `${urls.FINANCIAL_INDICATORS}/${filterString2}`;

    return axios
      .all([axios.get(url1), axios.get(url2)])
      .then(
        axios.spread((...responses) => {
          const raw1 = _.get(
            responses[0].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const raw2 = _.get(
            responses[1].data,
            BudgetsMetricsFieldsMapping.dataPath,
            [],
          );
          const expenditure = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.expenditureIndicatorName,
          });
          const disbursement = _.find(raw1, {
            [BudgetsMetricsFieldsMapping.indicatorNameField]:
              BudgetsMetricsFieldsMapping.disbursementIndicatorName,
          });
          const expenditureValue = _.get(
            expenditure,
            BudgetsMetricsFieldsMapping.expenditureValue,
            0,
          );
          const disbursementValue = _.get(
            disbursement,
            BudgetsMetricsFieldsMapping.disbursementValue,
            0,
          );
          const utilization = (expenditureValue / disbursementValue) * 100;

          const groupedByOrganisationType = _.groupBy(
            raw2,
            BudgetsMetricsFieldsMapping.organisationType,
          );
          const items = _.map(groupedByOrganisationType, (value, key) => {
            const expenditure = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.expenditureIndicatorName,
            );
            const disbursement = _.filter(
              value,
              (item: any) =>
                item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                BudgetsMetricsFieldsMapping.disbursementIndicatorName,
            );
            const expenditureValue = _.sumBy(
              expenditure,
              BudgetsMetricsFieldsMapping.expenditureValue,
            );
            const disbursementValue = _.sumBy(
              disbursement,
              BudgetsMetricsFieldsMapping.disbursementValue,
            );
            const utilization = (expenditureValue / disbursementValue) * 100;
            const groupedBySubOrganisations = _.groupBy(
              value,
              BudgetsMetricsFieldsMapping.organisationSubType,
            );
            return {
              level: 0,
              name: key,
              value: utilization,
              color: '#0A2840',
              items: _.orderBy(
                _.map(groupedBySubOrganisations, (value2, key2) => {
                  const expenditure = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.expenditureIndicatorName,
                  );
                  const disbursement = _.filter(
                    value2,
                    (item: any) =>
                      item[BudgetsMetricsFieldsMapping.indicatorNameField] ===
                      BudgetsMetricsFieldsMapping.disbursementIndicatorName,
                  );
                  const expenditureValue = _.sumBy(
                    expenditure,
                    BudgetsMetricsFieldsMapping.expenditureValue,
                  );
                  const disbursementValue = _.sumBy(
                    disbursement,
                    BudgetsMetricsFieldsMapping.disbursementValue,
                  );
                  const utilization =
                    (expenditureValue / disbursementValue) * 100;
                  const groupedByOrganisations = _.groupBy(
                    value2,
                    BudgetsMetricsFieldsMapping.organisationName,
                  );
                  return {
                    level: 1,
                    name: key2,
                    value: utilization,
                    color: '#0A2840',
                    items: _.orderBy(
                      _.map(groupedByOrganisations, (value3, key3) => {
                        const expenditure = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.expenditureIndicatorName,
                        );
                        const disbursement = _.filter(
                          value3,
                          (item: any) =>
                            item[
                              BudgetsMetricsFieldsMapping.indicatorNameField
                            ] ===
                            BudgetsMetricsFieldsMapping.disbursementIndicatorName,
                        );
                        const expenditureValue = _.sumBy(
                          expenditure,
                          BudgetsMetricsFieldsMapping.expenditureValue,
                        );
                        const disbursementValue = _.sumBy(
                          disbursement,
                          BudgetsMetricsFieldsMapping.disbursementValue,
                        );
                        const utilization =
                          (expenditureValue / disbursementValue) * 100;
                        return {
                          level: 2,
                          name: key3,
                          value: utilization,
                          color: '#0A2840',
                          items: [],
                        };
                      }),
                      'name',
                      'asc',
                    ),
                  };
                }),
                'name',
                'asc',
              ),
            };
          });

          return {
            data: [
              {
                value: utilization,
                items: _.orderBy(items, 'name', 'asc'),
              },
            ],
          };
        }),
      )
      .catch(handleDataApiError);
  }
}

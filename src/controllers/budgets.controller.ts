import {inject} from '@loopback/core';
import {
  get,
  param,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import center from '@turf/center';
import {points, Position} from '@turf/helpers';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import BudgetsBreakdownFieldsMapping from '../config/mapping/budgets/breakdown.json';
import BudgetsCyclesMapping from '../config/mapping/budgets/cycles.json';
import BudgetsFlowFieldsMapping from '../config/mapping/budgets/flow.json';
import BudgetsFlowDrilldownFieldsMapping from '../config/mapping/budgets/flowDrilldown.json';
import BudgetsGeomapFieldsMapping from '../config/mapping/budgets/geomap.json';
import BudgetsMetricsFieldsMapping from '../config/mapping/budgets/metrics.json';
import BudgetsRadialFieldsMapping from '../config/mapping/budgets/radial.json';
import BudgetsSankeyFieldsMapping from '../config/mapping/budgets/sankey.json';
import BudgetsTableFieldsMapping from '../config/mapping/budgets/table.json';
import BudgetsTimeCycleFieldsMapping from '../config/mapping/budgets/timeCycle.json';
import BudgetsTreemapFieldsMapping from '../config/mapping/budgets/treemap.json';
import urls from '../config/urls/index.json';
import {BudgetSankeyChartData} from '../interfaces/budgetSankey';
import {BudgetsFlowData} from '../interfaces/budgetsFlow';
import {BudgetsTimeCycleData} from '../interfaces/budgetsTimeCycle';
import {BudgetsTreemapDataItem} from '../interfaces/budgetsTreemap';
import staticCountries from '../static-assets/countries.json';
import {handleDataApiError} from '../utils/dataApiError';
import {getDrilldownFilterString} from '../utils/filtering/budgets/getDrilldownFilterString';
import {getFilterString} from '../utils/filtering/budgets/getFilterString';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';
import {formatFinancialValue} from '../utils/formatFinancialValue';

const BUDGETS_FLOW_RESPONSE: ResponseObject = {
  description: 'Budgets Flow Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'BudgetsFlowResponse',
        properties: {
          totalBudget: {type: 'number'},
          data: {
            type: 'object',
            properties: {
              nodes: {
                type: 'array',
                item: {
                  type: 'object',
                  properties: {
                    id: {type: 'string'},
                    filterStr: {type: 'string'},
                  },
                },
              },
              links: {
                type: 'array',
                item: {
                  type: 'object',
                  properties: {
                    source: {type: 'string'},
                    target: {type: 'string'},
                    amount: {type: 'number'},
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
const BUDGETS_TIME_CYCLE_RESPONSE: ResponseObject = {
  description: 'Budgets Time Cycle Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'BudgetsTimeCycleResponse',
        properties: {
          data: {
            type: 'object',
          },
        },
      },
    },
  },
};

export class BudgetsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

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
      'implementationPeriod/grant/geography/name',
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
      'implementationPeriod/grant/geography/name',
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
      'implementationPeriod/grant/geography/name',
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
      'implementationPeriod/grant/geography/name',
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
      'implementationPeriod/grant/geography/name',
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
      'implementationPeriod/grant/geography/name',
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

  // v2

  @get('/budgets/flow')
  @response(200, BUDGETS_FLOW_RESPONSE)
  flow(): object {
    const filterString = getFilterString(
      this.req.query,
      BudgetsFlowFieldsMapping.budgetsFlowAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, BudgetsFlowFieldsMapping.dataPath, []);
        let formattedRawData = [];
        if (_.get(rawData, `[0].${BudgetsFlowFieldsMapping.level1}`, null)) {
          formattedRawData = rawData.map((item: any) => ({
            amount: _.get(item, BudgetsFlowFieldsMapping.amount, 0),
            count: _.get(item, BudgetsFlowFieldsMapping.count, 0),
            level1: _.get(item, BudgetsFlowFieldsMapping.level1, ''),
            level2: _.get(item, BudgetsFlowFieldsMapping.level2, ''),
            costCategory: _.get(item, BudgetsFlowFieldsMapping.costCategory, '')
              .replace(/\(/g, '- ')
              .replace(/\)/g, ''),
            rawCostCategory: _.get(
              item,
              BudgetsFlowFieldsMapping.costCategory,
              '',
            ),
            component: _.get(item, BudgetsFlowFieldsMapping.component, ''),
          }));
        }
        const totalBudget = _.sumBy(formattedRawData, 'amount');

        const data: BudgetsFlowData = {nodes: [], links: []};

        // 4th column
        const costCategoryGroupBy = _.groupBy(formattedRawData, 'costCategory');
        Object.keys(costCategoryGroupBy).forEach(costCategory => {
          const groupedByTotalBudget = _.sumBy(
            costCategoryGroupBy[costCategory],
            'amount',
          );
          const groupedByComponents = _.groupBy(
            costCategoryGroupBy[costCategory],
            'component',
          );
          data.nodes.push({
            id: costCategory,
            filterStr: `budgetCategory/budgetCategoryName eq '${costCategoryGroupBy[costCategory][0].rawCostCategory}'`,
            components: _.sortBy(Object.keys(groupedByComponents)).map(
              componentKey => {
                const compValue = _.sumBy(
                  groupedByComponents[componentKey],
                  'amount',
                );
                const compCount = _.sumBy(
                  groupedByComponents[componentKey],
                  'count',
                );
                return {
                  id: componentKey,
                  color: _.get(
                    BudgetsFlowFieldsMapping.componentColors,
                    componentKey,
                    '',
                  ),
                  value: compValue,
                  count: compCount,
                  height: (compValue * 100) / groupedByTotalBudget,
                };
              },
            ),
          });
        });

        // 3rd column
        const level2GroupBy = _.groupBy(formattedRawData, 'level2');
        Object.keys(level2GroupBy).forEach(level2 => {
          const groupedByTotalBudget = _.sumBy(level2GroupBy[level2], 'amount');
          const groupedByComponents = _.groupBy(
            level2GroupBy[level2],
            'component',
          );
          data.nodes.push({
            id: level2,
            filterStr: `budgetCategory/budgetCategoryParent/budgetCategoryName eq '${level2}'`,
            components: _.sortBy(Object.keys(groupedByComponents)).map(
              componentKey => {
                const compValue = _.sumBy(
                  groupedByComponents[componentKey],
                  'amount',
                );
                const compCount = _.sumBy(
                  groupedByComponents[componentKey],
                  'count',
                );
                return {
                  id: componentKey,
                  color: _.get(
                    BudgetsFlowFieldsMapping.componentColors,
                    componentKey,
                    '',
                  ),
                  value: compValue,
                  count: compCount,
                  height: (compValue * 100) / groupedByTotalBudget,
                };
              },
            ),
          });
          level2GroupBy[level2].forEach(item => {
            const foundIndex = _.findIndex(
              data.links,
              l => l.source === level2 && l.target === item.costCategory,
            );
            if (foundIndex === -1) {
              if (level2 !== item.costCategory) {
                data.links.push({
                  source: level2,
                  target: item.costCategory,
                  value: item.amount,
                });
              }
            } else {
              data.links[foundIndex].value += item.amount;
            }
          });
        });

        // 2nd column
        const level1GroupBy = _.groupBy(formattedRawData, 'level1');
        Object.keys(level1GroupBy).forEach(level1 => {
          const groupedByTotalBudget = _.sumBy(level1GroupBy[level1], 'amount');
          const groupedByComponents = _.groupBy(
            level1GroupBy[level1],
            'component',
          );
          data.nodes.push({
            id: level1,
            filterStr: `budgetCategory/budgetCategoryParent/budgetCategoryParent/budgetCategoryName eq '${level1}'`,
            components: _.sortBy(Object.keys(groupedByComponents)).map(
              componentKey => {
                const compValue = _.sumBy(
                  groupedByComponents[componentKey],
                  'amount',
                );
                const compCount = _.sumBy(
                  groupedByComponents[componentKey],
                  'count',
                );
                return {
                  id: componentKey,
                  color: _.get(
                    BudgetsFlowFieldsMapping.componentColors,
                    componentKey,
                    '',
                  ),
                  value: compValue,
                  count: compCount,
                  height: (compValue * 100) / groupedByTotalBudget,
                };
              },
            ),
          });
          level1GroupBy[level1].forEach(item => {
            const foundIndex = _.findIndex(
              data.links,
              l => l.source === level1 && l.target === item.level2,
            );
            if (foundIndex === -1) {
              data.links.push({
                source: level1,
                target: item.level2,
                value: item.amount,
              });
            } else {
              data.links[foundIndex].value += item.amount;
            }
          });
          data.links.push({
            source: 'Budgets',
            target: level1,
            value: _.sumBy(level1GroupBy[level1], 'amount'),
          });
        });

        const groupedByComponents = _.groupBy(formattedRawData, 'component');

        // 1st column
        data.nodes.push({
          id: 'Budgets',
          filterStr: 'activityArea/activityAreaParent/activityAreaName ne null',
          components: _.sortBy(Object.keys(groupedByComponents)).map(
            componentKey => {
              const compValue = _.sumBy(
                groupedByComponents[componentKey],
                'amount',
              );
              const compCount = _.sumBy(
                groupedByComponents[componentKey],
                'count',
              );
              return {
                id: componentKey,
                color: _.get(
                  BudgetsFlowFieldsMapping.componentColors,
                  componentKey,
                  '',
                ),
                value: compValue,
                count: compCount,
                height: (compValue * 100) / totalBudget,
              };
            },
          ),
        });

        data.nodes = _.uniqBy(data.nodes, 'id');
        data.nodes = _.sortBy(data.nodes, 'id');
        data.links = _.sortBy(data.links, ['source', 'target']);

        return {
          ...data,
          totalBudget,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/time-cycle')
  @response(200, BUDGETS_TIME_CYCLE_RESPONSE)
  timeCycle(): object {
    const filterString = getFilterString(
      this.req.query,
      BudgetsTimeCycleFieldsMapping.budgetsTimeCycleAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let rawData = _.get(
          resp.data,
          BudgetsTimeCycleFieldsMapping.dataPath,
          [],
        );
        if (rawData.length > 0) {
          if (
            _.get(rawData[0], BudgetsTimeCycleFieldsMapping.year, '').length > 4
          ) {
            rawData = _.filter(
              rawData,
              (item: any) => item[BudgetsTimeCycleFieldsMapping.year],
            ).map((item: any) => ({
              ...item,
              [BudgetsTimeCycleFieldsMapping.year]: item[
                BudgetsTimeCycleFieldsMapping.year
              ].slice(0, 4),
            }));
          }
        }
        const returnData: BudgetsTimeCycleData = {data: []};
        const groupedYears = _.groupBy(
          rawData,
          BudgetsTimeCycleFieldsMapping.year,
        );
        Object.keys(groupedYears).forEach(yKey => {
          const instance = groupedYears[yKey];
          let components = {};
          const groupedYComponents = _.groupBy(
            instance,
            BudgetsTimeCycleFieldsMapping.component,
          );
          Object.keys(groupedYComponents).forEach(ycKey => {
            components = {
              ...components,
              [ycKey]: _.sumBy(
                groupedYComponents[ycKey],
                BudgetsTimeCycleFieldsMapping.amount,
              ),
              [`${ycKey}Color`]: _.get(
                BudgetsTimeCycleFieldsMapping.componentColors,
                ycKey,
                '#000',
              ),
            };
          });
          returnData.data.push({
            year: yKey,
            ...components,
            amount: _.sumBy(instance, BudgetsTimeCycleFieldsMapping.amount),
          });
        });
        return returnData;
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/drilldown')
  @response(200, BUDGETS_FLOW_RESPONSE)
  flowDrilldown(): object {
    if (!this.req.query.levelParam) {
      return {
        count: 0,
        data: [],
        message: '"levelParam" parameters are required.',
      };
    }
    const filterString = getDrilldownFilterString(
      this.req.query,
      BudgetsFlowDrilldownFieldsMapping.aggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const groupedDataByComponent = _.groupBy(
          _.get(resp.data, BudgetsFlowDrilldownFieldsMapping.dataPath, []),
          BudgetsFlowDrilldownFieldsMapping.component,
        );
        const data: BudgetsTreemapDataItem[] = [];
        Object.keys(groupedDataByComponent).forEach((component: string) => {
          const dataItems = groupedDataByComponent[component];
          const children: BudgetsTreemapDataItem[] = [];
          dataItems.forEach((item: any) => {
            children.push({
              name: _.get(item, BudgetsFlowDrilldownFieldsMapping.child, ''),
              value: item[BudgetsFlowDrilldownFieldsMapping.amount],
              formattedValue: formatFinancialValue(
                item[BudgetsFlowDrilldownFieldsMapping.amount],
              ),
              color: '#595C70',
              tooltip: {
                header: component,
                componentsStats: [
                  {
                    name: _.get(
                      item,
                      BudgetsFlowDrilldownFieldsMapping.child,
                      '',
                    ),
                    value: item[BudgetsFlowDrilldownFieldsMapping.amount],
                  },
                ],
                value: item[BudgetsFlowDrilldownFieldsMapping.amount],
              },
            });
          });
          const value = _.sumBy(children, 'value');
          data.push({
            name: component,
            color: '#DFE3E5',
            value,
            formattedValue: formatFinancialValue(value),
            _children: _.orderBy(children, 'value', 'desc'),
            tooltip: {
              header: component,
              value,
              componentsStats: [
                {
                  name: component,
                  value: _.sumBy(children, 'value'),
                },
              ],
            },
          });
        });
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/drilldown/2')
  @response(200, BUDGETS_FLOW_RESPONSE)
  flowDrilldownLevel2(): object {
    if (!this.req.query.levelParam || !this.req.query.activityAreaName) {
      return {
        count: 0,
        data: [],
        message: '"levelParam" and "activityAreaName" parameters are required.',
      };
    }
    const filterString = getDrilldownFilterString(
      this.req.query,
      BudgetsFlowDrilldownFieldsMapping.aggregation2,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          BudgetsFlowDrilldownFieldsMapping.dataPath,
          [],
        );
        const totalValue = _.sumBy(
          rawData,
          BudgetsFlowDrilldownFieldsMapping.amount,
        );
        const areaName = this.req.query.activityAreaName as string;
        const data: BudgetsTreemapDataItem[] = [
          {
            name: areaName,
            color: '#DFE3E5',
            value: totalValue,
            formattedValue: formatFinancialValue(totalValue),
            _children: _.orderBy(
              rawData.map((item: any) => ({
                name: _.get(item, BudgetsFlowDrilldownFieldsMapping.grant, ''),
                value: item[BudgetsFlowDrilldownFieldsMapping.amount],
                formattedValue: formatFinancialValue(
                  item[BudgetsFlowDrilldownFieldsMapping.amount],
                ),
                color: '#595C70',
                tooltip: {
                  header: areaName,
                  componentsStats: [
                    {
                      name: _.get(
                        item,
                        BudgetsFlowDrilldownFieldsMapping.grant,
                        '',
                      ),
                      value: item[BudgetsFlowDrilldownFieldsMapping.amount],
                    },
                  ],
                  value: item[BudgetsFlowDrilldownFieldsMapping.amount],
                },
              })),
              'value',
              'desc',
            ),
            tooltip: {
              header: areaName,
              value: totalValue,
              componentsStats: [
                {
                  name: areaName,
                  value: totalValue,
                },
              ],
            },
          },
        ];
        return {
          count: data.length,
          data: _.orderBy(data, 'value', 'desc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/budgets/geomap')
  @response(200, BUDGETS_FLOW_RESPONSE)
  geomap(): object {
    const filterString = getFilterString(
      this.req.query,
      BudgetsGeomapFieldsMapping.aggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .all([axios.get(url), axios.get(urls.geojson)])
      .then(
        axios.spread((...responses) => {
          const geoJSONData = responses[1].data.features;
          const data: any = [];
          const groupedDataByLocation = _.groupBy(
            responses[0].data.value,
            BudgetsGeomapFieldsMapping.locationCode,
          );
          Object.keys(groupedDataByLocation).forEach((iso3: string) => {
            const dataItems = groupedDataByLocation[iso3];
            const locationComponents: any = [];
            dataItems.forEach((item: any) => {
              locationComponents.push({
                name: _.get(item, BudgetsGeomapFieldsMapping.component, ''),
                value: item[BudgetsGeomapFieldsMapping.amount],
              });
            });
            data.push({
              code: iso3,
              components: locationComponents,
              value: _.sumBy(locationComponents, 'value'),
            });
          });
          const maxValue: number = _.max(data.map((d: any) => d.value)) ?? 0;
          let interval = 0;
          if (maxValue) {
            interval = maxValue / 13;
          }
          const intervals: number[] = [];
          for (let i = 0; i < 13; i++) {
            intervals.push(interval * i);
          }
          const features = geoJSONData.map((feature: any) => {
            const fItem = _.find(data, {code: feature.id});
            let itemValue = 0;
            if (fItem) {
              if (
                (fItem.value < maxValue || fItem.value === maxValue) &&
                (fItem.value >= intervals[11] || fItem.value === intervals[11])
              ) {
                itemValue = 12;
              }
              if (
                (fItem.value < intervals[11] ||
                  fItem.value === intervals[11]) &&
                (fItem.value >= intervals[10] || fItem.value === intervals[10])
              ) {
                itemValue = 11;
              }
              if (
                (fItem.value < intervals[10] ||
                  fItem.value === intervals[10]) &&
                (fItem.value >= intervals[9] || fItem.value === intervals[9])
              ) {
                itemValue = 10;
              }
              if (
                (fItem.value < intervals[9] || fItem.value === intervals[9]) &&
                (fItem.value >= intervals[8] || fItem.value === intervals[8])
              ) {
                itemValue = 9;
              }
              if (
                (fItem.value < intervals[8] || fItem.value === intervals[8]) &&
                (fItem.value >= intervals[7] || fItem.value === intervals[7])
              ) {
                itemValue = 8;
              }
              if (
                (fItem.value < intervals[7] || fItem.value === intervals[7]) &&
                (fItem.value >= intervals[6] || fItem.value === intervals[6])
              ) {
                itemValue = 7;
              }
              if (
                (fItem.value < intervals[6] || fItem.value === intervals[6]) &&
                (fItem.value >= intervals[5] || fItem.value === intervals[5])
              ) {
                itemValue = 6;
              }
              if (
                (fItem.value < intervals[5] || fItem.value === intervals[5]) &&
                (fItem.value >= intervals[4] || fItem.value === intervals[4])
              ) {
                itemValue = 5;
              }
              if (
                (fItem.value < intervals[4] || fItem.value === intervals[4]) &&
                (fItem.value >= intervals[3] || fItem.value === intervals[3])
              ) {
                itemValue = 4;
              }
              if (
                (fItem.value < intervals[3] || fItem.value === intervals[3]) &&
                (fItem.value >= intervals[2] || fItem.value === intervals[2])
              ) {
                itemValue = 3;
              }
              if (
                (fItem.value < intervals[2] || fItem.value === intervals[2]) &&
                (fItem.value >= intervals[1] || fItem.value === intervals[1])
              ) {
                itemValue = 2;
              }
              if (
                (fItem.value < intervals[1] || fItem.value === intervals[1]) &&
                (fItem.value >= intervals[0] || fItem.value === intervals[0])
              ) {
                itemValue = 1;
              }
            }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                value: itemValue,
                iso_a3: feature.id,
                data: fItem
                  ? {
                      components: fItem.components,
                      value: fItem.value,
                    }
                  : {},
              },
            };
          });
          return {
            count: features.length,
            data: features,
            maxValue,
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/budgets/geomap/multicountries')
  @response(200, BUDGETS_FLOW_RESPONSE)
  geomapMulticountries(): object {
    const filterString = getFilterString(
      this.req.query,
      BudgetsGeomapFieldsMapping.aggregationMulticountry,
      'grantAgreementImplementationPeriod/grantAgreement/multiCountry/multiCountryName ne null',
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.budgets}/?${params}${filterString}`;

    return axios
      .all([axios.get(url), axios.get(urls.multicountriescountriesdata)])
      .then(
        axios.spread((...responses) => {
          const rawData = _.get(
            responses[0].data,
            BudgetsGeomapFieldsMapping.dataPath,
            [],
          );
          const mcGeoData = _.get(
            responses[1].data,
            BudgetsGeomapFieldsMapping.dataPath,
            [],
          );
          const data: any = [];
          const groupedByMulticountry = _.groupBy(
            rawData,
            BudgetsGeomapFieldsMapping.multicountry,
          );
          Object.keys(groupedByMulticountry).forEach((mc: string) => {
            const fMCGeoItem = _.find(
              mcGeoData,
              (mcGeoItem: any) =>
                _.get(
                  mcGeoItem,
                  BudgetsGeomapFieldsMapping.geodatamulticountry,
                  '',
                ) === mc,
            );
            let latitude = 0;
            let longitude = 0;
            if (fMCGeoItem) {
              const coordinates: Position[] = [];
              const composition = _.get(
                fMCGeoItem,
                BudgetsGeomapFieldsMapping.multiCountryComposition,
                [],
              );
              composition.forEach((item: any) => {
                const iso3 = _.get(
                  item,
                  BudgetsGeomapFieldsMapping.multiCountryCompositionItem,
                  '',
                );
                const fCountry = _.find(staticCountries, {iso3: iso3});
                if (fCountry) {
                  coordinates.push([fCountry.longitude, fCountry.latitude]);
                }
              });
              if (coordinates.length > 0) {
                const lonlat = center(points(coordinates));
                longitude = lonlat.geometry.coordinates[0];
                latitude = lonlat.geometry.coordinates[1];
              }
            }
            data.push({
              id: mc,
              code: mc.replace(/\//g, '|'),
              geoName: mc,
              components: groupedByMulticountry[mc].map((item: any) => ({
                name: _.get(
                  item,
                  BudgetsGeomapFieldsMapping.multicountryComponent,
                  '',
                ),
                value: _.get(item, BudgetsGeomapFieldsMapping.amount, 0),
              })),
              latitude: latitude,
              longitude: longitude,
              value: _.sumBy(
                groupedByMulticountry[mc],
                BudgetsGeomapFieldsMapping.amount,
              ),
            });
          });
          return {
            pins: data,
          };
        }),
      )
      .catch(handleDataApiError);
  }
}

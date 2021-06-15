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
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import BudgetsFlowFieldsMapping from '../config/mapping/budgets/flow.json';
import BudgetsTimeCycleFieldsMapping from '../config/mapping/budgets/timeCycle.json';
import urls from '../config/urls/index.json';
import {BudgetsFlowData} from '../interfaces/budgetsFlow';
import {BudgetsTimeCycleData} from '../interfaces/budgetsTimeCycle';
import {getFilterString} from '../utils/filtering/budgets/getFilterString';

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
          }));
        }
        const totalBudget = _.sumBy(formattedRawData, 'amount');

        const data: BudgetsFlowData = {nodes: [], links: []};

        // 4th column
        const costCategoryGroupBy = _.groupBy(formattedRawData, 'costCategory');
        Object.keys(costCategoryGroupBy).forEach(costCategory => {
          data.nodes.push({
            id: costCategory,
            filterStr: `budgetCategory/budgetCategoryName eq '${costCategoryGroupBy[costCategory][0].rawCostCategory}'`,
          });
        });

        // 3rd column
        const level2GroupBy = _.groupBy(formattedRawData, 'level2');
        Object.keys(level2GroupBy).forEach(level2 => {
          data.nodes.push({
            id: level2,
            filterStr: `budgetCategory/budgetCategoryParent/budgetCategoryName eq '${level2}'`,
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
          data.nodes.push({
            id: level1,
            filterStr: `budgetCategory/budgetCategoryParent/budgetCategoryParent/budgetCategoryName eq '${level1}'`,
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

        // 1st column
        data.nodes.push({
          id: 'Budgets',
          filterStr: 'activityArea/activityAreaParent/activityAreaName ne null',
        });

        data.nodes = _.uniqBy(data.nodes, 'id');
        data.nodes = _.sortBy(data.nodes, 'id');
        data.links = _.sortBy(data.links, ['source', 'target']);

        return {
          data,
          totalBudget,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
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
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

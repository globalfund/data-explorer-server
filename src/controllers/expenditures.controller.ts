import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios from 'axios';
import _ from 'lodash';
import mapping from '../config/mapping/expenditures/index.json';
import urls from '../config/urls/index.json';
import {getFilterString} from '../utils/filtering/expenditures/getFilterString';

const EXPENDITURE_RESPONSE: ResponseObject = {
  description: 'Expenditure Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'ExpenditureResponse',
        properties: {
          data: {
            type: 'object',
            properties: {
              total: {type: 'number'},
              values: {type: 'array', items: {type: 'number'}},
              keys: {type: 'array', items: {type: 'string'}},
              colors: {type: 'array', items: {type: 'string'}},
            },
          },
        },
      },
    },
  },
};

export class ExpendituresController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/expenditures-0')
  @response(200, EXPENDITURE_RESPONSE)
  _expenditures(): object {
    let dataset = this.req.query.dataset ?? 'moduleInterventions';
    dataset = dataset.toString();
    if (
      ['moduleInterventions', 'investmentLandscapes'].indexOf(dataset) === -1
    ) {
      dataset = 'moduleInterventions';
    }

    const fields =
      dataset === 'moduleInterventions'
        ? mapping.modulesInterventionsFields
        : mapping.investmentLandscapesFields;

    let rowDimension = this.req.query.rowDimension ?? fields.component;
    rowDimension = rowDimension.toString();
    if (Object.keys(fields).indexOf(rowDimension) === -1) {
      rowDimension = fields.component;
    }
    const isRowDimensionArray = Array.isArray(
      _.get(fields, rowDimension, null),
    );
    let rowDimensionArray: string[] = [];
    if (isRowDimensionArray) {
      rowDimensionArray = _.get(fields, rowDimension, []);
      rowDimension = rowDimensionArray.join(',');
    }
    rowDimension = rowDimension.toString();

    let columnDimension = this.req.query.columnDimension ?? fields.grantCycle;
    columnDimension = columnDimension.toString();
    if (Object.keys(fields).indexOf(columnDimension) === -1) {
      columnDimension = fields.grantCycle;
    }
    const isColumnDimensionArray = Array.isArray(
      _.get(fields, columnDimension, null),
    );
    let columnDimensionArray: string[] = [];
    if (isColumnDimensionArray) {
      columnDimensionArray = _.get(fields, columnDimension, []);
      columnDimension = columnDimensionArray.join(',');
    }
    columnDimension = columnDimension.toString();

    let url =
      dataset === 'moduleInterventions'
        ? urls.expendituremoduleinterventions
        : urls.expenditureinvestmentlandscapes;
    url =
      url +
      '?' +
      mapping.aggregation
        .replace('<filterString>', 'filter(isLatestAnnualExpenditure eq true)/')
        .replace('groupby1', rowDimension.replace(/\./g, '/'))
        .replace('groupby2', columnDimension.replace(/\./g, '/'))
        .replace(/aggregate1/g, mapping.expenditureAmount)
        .replace(/aggregate2/g, mapping.budgetAmount);

    console.log(url);

    return axios
      .get(url)
      .then(resp => {
        const data =
          dataset === 'moduleInterventions' ? resp.data.value : resp.data;

        const returnData: {
          rowName: string;
          values: {
            name: string;
            expenditure: number;
            budget: number;
            percentage: number;
          }[];
          subItems?: {
            name: string;
            expenditure: number;
            budget: number;
            percentage: number;
          }[];
        }[] = [];

        const columns: string[] = _.uniq(
          data.map((item: any) => _.get(item, columnDimension as string, '')),
        );

        const groupedByRowDimension = _.groupBy(
          data,
          isRowDimensionArray ? rowDimensionArray[0] : rowDimension,
        );

        Object.keys(groupedByRowDimension).forEach(rowDimensionValue => {
          const subItems: any[] = [];

          if (isRowDimensionArray) {
            let tempSubItems: any[] = [];
            columns.forEach(columnDimensionValue => {
              tempSubItems = [
                ...tempSubItems,
                ..._.filter(
                  groupedByRowDimension[rowDimensionValue],
                  (item: any) => {
                    return (
                      _.get(item, columnDimension as string) ===
                      columnDimensionValue
                    );
                  },
                ).map((subItem: any) => ({
                  column: columnDimensionValue,
                  rowName: _.get(subItem, rowDimensionArray[1]).toString(),
                  expenditure: _.get(
                    subItem,
                    mapping.expenditureAmount as string,
                  ),
                  budget: _.get(subItem, mapping.budgetAmount as string),
                })),
              ];
            });
            const groupedBySubItems = _.groupBy(tempSubItems, 'rowName');
            Object.keys(groupedBySubItems).forEach(subItem => {
              subItems.push({
                rowName: subItem,
                values: groupedBySubItems[subItem].map((item: any) => {
                  return {
                    name: item.column,
                    expenditure: item.expenditure,
                    budget: item.budget,
                    percentage:
                      item.budgetAmount && item.budgetAmount > 0
                        ? (item.expenditureAmount / item.budgetAmount) * 100
                        : 120,
                  };
                }),
              });
            });
          }

          returnData.push({
            rowName: rowDimensionValue,
            values: columns.map(columnDimensionValue => {
              const columnSubItemsValues: {
                name: string;
                expenditure: number;
                budget: number;
                percentage: number;
              }[] = [];

              subItems.forEach(subItem => {
                subItem.values.forEach((subItemValue: any) => {
                  if (subItemValue.name === columnDimensionValue) {
                    columnSubItemsValues.push(subItemValue);
                  }
                });
              });

              const expenditureAmount = _.sumBy(
                columnSubItemsValues,
                'expenditure',
              );

              const budgetAmount = _.sumBy(columnSubItemsValues, 'budget');

              return {
                name: columnDimensionValue,
                expenditure: expenditureAmount,
                budget: budgetAmount,
                percentage:
                  budgetAmount && budgetAmount > 0
                    ? (expenditureAmount / budgetAmount) * 100
                    : 120,
              };
            }),
            subItems,
          });
        });

        return returnData;
      })
      .catch(error => {
        return error;
      });
  }

  @get('/expenditures')
  @response(200, EXPENDITURE_RESPONSE)
  expenditures(): object {
    // params validation
    let dataset = this.req.query.dataset ?? 'moduleInterventions';
    dataset = dataset.toString();
    if (
      ['moduleInterventions', 'investmentLandscapes'].indexOf(dataset) === -1
    ) {
      dataset = 'moduleInterventions';
    }

    const fields =
      dataset === 'moduleInterventions'
        ? mapping.modulesInterventionsFields
        : mapping.investmentLandscapesFields;

    let rowDimension = _.get(
      fields,
      this.req.query.rowDimension as string,
      fields.component,
    );
    if (
      Object.keys(fields).indexOf(this.req.query.rowDimension as string) === -1
    ) {
      rowDimension = fields.component;
    }
    const isRowDimensionArray = Array.isArray(rowDimension);
    let rowDimensionArray: string[] = [];
    if (isRowDimensionArray) {
      rowDimensionArray = rowDimension;
      rowDimension = rowDimensionArray.join(',');
    }
    rowDimension = rowDimension.toString();

    let columnDimension = _.get(
      fields,
      this.req.query.columnDimension as string,
      fields.grantCycle,
    );
    if (
      Object.keys(fields).indexOf(this.req.query.columnDimension as string) ===
      -1
    ) {
      columnDimension = fields.grantCycle;
    }
    const isColumnDimensionArray = Array.isArray(columnDimension);
    let columnDimensionArray: string[] = [];
    if (isColumnDimensionArray) {
      columnDimensionArray = columnDimension;
      columnDimension = columnDimensionArray.join(',');
    }
    columnDimension = columnDimension.toString();

    // console.log(this.req.query);
    // console.log('rowDimension', rowDimension);
    // console.log('columnDimension', columnDimension);

    // url preparation
    let url =
      dataset === 'moduleInterventions'
        ? urls.expendituremoduleinterventions
        : urls.expenditureinvestmentlandscapes;
    url =
      url +
      '?' +
      getFilterString(
        this.req.query,
        mapping.aggregation,
        'isLatestAnnualExpenditure eq true',
      )
        .replace('groupby1', rowDimension.replace(/\./g, '/'))
        .replace('groupby2', columnDimension.replace(/\./g, '/'))
        .replace(/aggregate1/g, mapping.expenditureAmount)
        .replace(/aggregate2/g, mapping.budgetAmount);

    // api call
    return axios
      .get(url)
      .then(resp => {
        const data =
          dataset === 'moduleInterventions' ? resp.data.value : resp.data;

        const returnData: {
          row: string;
          column: string;
          budget: number;
          expenditure: number;
          percentage: number;
          parentRow?: string;
          parentColumn?: string;
        }[] = [];

        (isRowDimensionArray ? rowDimensionArray : [rowDimension]).forEach(
          (rowDimensionValue, rowIndex) => {
            (isColumnDimensionArray
              ? columnDimensionArray
              : [columnDimension]
            ).forEach((columnDimensionValue, columnIndex) => {
              // console.log('rowDimensionValue', rowDimensionValue);
              // console.log('columnDimensionValue', columnDimensionValue);
              data.forEach((item: any) => {
                const row = _.get(item, rowDimensionValue as string, '');
                const column = _.get(item, columnDimensionValue as string, '');
                const expenditureAmount = _.get(
                  item,
                  mapping.expenditureAmount as string,
                  0,
                );
                const budgetAmount = _.get(
                  item,
                  mapping.budgetAmount as string,
                  0,
                );

                const fItemIndex = _.findIndex(
                  returnData,
                  dataItem =>
                    dataItem.row === row && dataItem.column === column,
                );

                if (fItemIndex > -1) {
                  returnData[fItemIndex].budget += budgetAmount;
                  returnData[fItemIndex].expenditure += expenditureAmount;
                  returnData[fItemIndex].percentage =
                    returnData[fItemIndex].budget > 0
                      ? (returnData[fItemIndex].expenditure /
                          returnData[fItemIndex].budget) *
                        100
                      : 120;
                } else if (row && column) {
                  let parentRow =
                    rowIndex > 0
                      ? _.get(item, rowDimensionArray[rowIndex - 1] as string)
                      : undefined;
                  if (parentRow === 'null' || parentRow === null) {
                    parentRow = undefined;
                  }
                  let parentColumn =
                    columnIndex > 0
                      ? _.get(
                          item,
                          columnDimensionArray[columnIndex - 1] as string,
                        )
                      : undefined;
                  if (parentColumn === 'null' || parentColumn === null) {
                    parentColumn = undefined;
                  }
                  returnData.push({
                    row,
                    parentRow,
                    column,
                    parentColumn,
                    budget: budgetAmount,
                    expenditure: expenditureAmount,
                    percentage:
                      budgetAmount && budgetAmount > 0
                        ? (expenditureAmount / budgetAmount) * 100
                        : 120,
                  });
                }
              });
            });
          },
        );

        return {
          vizData: _.orderBy(returnData, ['row', 'column'], ['asc', 'asc']),
          total: _.sumBy(
            _.filter(returnData, {
              parentRow: undefined,
              parentColumn: undefined,
            }),
            'expenditure',
          ),
        };
      })
      .catch(error => {
        return error;
      });
  }

  @get('/expenditures/stats')
  @response(200, EXPENDITURE_RESPONSE)
  expendituresStats(): object {
    // params validation
    let dataset = this.req.query.dataset ?? 'moduleInterventions';
    dataset = dataset.toString();
    if (
      ['moduleInterventions', 'investmentLandscapes'].indexOf(dataset) === -1
    ) {
      dataset = 'moduleInterventions';
    }

    // url preparation
    let url =
      dataset === 'moduleInterventions'
        ? urls.expendituremoduleinterventions
        : urls.expenditureinvestmentlandscapes;
    url =
      url +
      '?' +
      getFilterString(
        this.req.query,
        mapping.totalAggregation,
        'isLatestAnnualExpenditure eq true',
      );

    // api call
    return axios
      .get(url)
      .then(resp => {
        return {
          total: (dataset === 'moduleInterventions'
            ? resp.data.value
            : resp.data)[0].expenditureAmount,
        };
      })
      .catch(error => {
        return error;
      });
  }
}

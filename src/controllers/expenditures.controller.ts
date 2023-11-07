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

  @get('/expenditures')
  @response(200, EXPENDITURE_RESPONSE)
  async expenditures(): Promise<object> {
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
        `IsLatestReportedExpenditure eq true${
          this.req.query.rowDimension === 'multicountry' ||
          this.req.query.columnDimension === 'multicountry'
            ? ' and grantAgreementImplementationPeriod/grantAgreement/multiCountryId ne null'
            : ''
        }`,
      )
        .replace('groupby1', rowDimension.replace(/\./g, '/'))
        .replace('groupby2', columnDimension.replace(/\./g, '/'))
        .replace(/aggregate1/g, mapping.expenditureAmount)
        .replace(/aggregate2/g, mapping.budgetAmount);

    let mcData: any = null;

    if (
      this.req.query.rowDimension === 'location' ||
      this.req.query.columnDimension === 'location'
    ) {
      mcData = await axios.get(
        `http://${this.req.hostname}:${
          this.req.connection.localPort
        }/expenditures?dataset=${dataset}&rowDimension=${
          this.req.query.rowDimension === 'location'
            ? 'multicountry'
            : this.req.query.rowDimension
        }&columnDimension=${
          this.req.query.columnDimension === 'location'
            ? 'multicountry'
            : this.req.query.columnDimension
        }`,
      );
    }

    // api call
    return axios
      .get(url)
      .then(resp => {
        const data =
          dataset === 'moduleInterventions' ? resp.data.value : resp.data;

        let returnData: {
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
                  returnData[fItemIndex].percentage = Math.round(
                    returnData[fItemIndex].percentage,
                  );
                  if (returnData[fItemIndex].percentage > 120) {
                    returnData[fItemIndex].percentage = 120;
                  }
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
                        ? Math.round((expenditureAmount / budgetAmount) * 100)
                        : 120,
                  });
                  if (returnData[returnData.length - 1].percentage > 120) {
                    returnData[returnData.length - 1].percentage = 120;
                  }
                }
              });
            });
          },
        );

        if (
          (this.req.query.rowDimension === 'location' ||
            this.req.query.columnDimension === 'location') &&
          mcData
        ) {
          const parentPath =
            this.req.query.rowDimension === 'location'
              ? 'parentRow'
              : 'parentColumn';
          const mcDataValues = _.filter(
            _.get(mcData, 'data.vizData', []),
            (item: any) => item[parentPath],
          );
          returnData = [...returnData, ...mcDataValues];
        }

        return {
          vizData: _.orderBy(returnData, ['row', 'column'], ['asc', 'asc']),
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
    const baseUrl =
      dataset === 'moduleInterventions'
        ? urls.expendituremoduleinterventions
        : urls.expenditureinvestmentlandscapes;
    const totalUrl =
      baseUrl +
      '?' +
      getFilterString(
        {},
        mapping.totalAggregation,
        'IsLatestReportedExpenditure eq true',
      );
    const viewUrl =
      baseUrl +
      '?' +
      getFilterString(
        this.req.query,
        mapping.totalAggregation,
        'IsLatestReportedExpenditure eq true',
      );

    // api calls
    return Promise.all([axios.get(totalUrl), axios.get(viewUrl)])
      .then(([totalResp, viewResp]) => {
        return {
          total: (dataset === 'moduleInterventions'
            ? totalResp.data.value
            : totalResp.data)[0].cumulativeExpenditureAmount,
          view: (dataset === 'moduleInterventions'
            ? viewResp.data.value
            : viewResp.data)[0].cumulativeExpenditureAmount,
        };
      })
      .catch(error => {
        return error;
      });
  }
}

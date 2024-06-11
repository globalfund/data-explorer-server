import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import ExpendituresBarChartMapping from '../config/mapping/expenditures/bar.json';
import ExpendituresCyclesMapping from '../config/mapping/expenditures/cycles.json';
import ExpendituresHeatmapMapping from '../config/mapping/expenditures/heatmap.json';
import ExpendituresTableMapping from '../config/mapping/expenditures/table.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

export class ExpendituresController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/expenditures/heatmap/{row}/{column}/{componentField}')
  @response(200)
  async heatmap(
    @param.path.string('row') row: string,
    @param.path.string('column') column: string,
    @param.path.string('componentField') componentField: string,
  ) {
    let filterString = ExpendituresHeatmapMapping.urlParams;
    let rowField = '';
    let subRowField = '';
    let subSubRowField = '';
    let columnField = '';
    let subColumnField = '';
    if (row.split(',').length > 1) {
      rowField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${row.split(',')[0]}"]`,
        ExpendituresHeatmapMapping.fields.principalRecipientType,
      );
      subRowField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${row.split(',')[1]}"]`,
        ExpendituresHeatmapMapping.fields.principalRecipient,
      );
      if (row.split(',').length > 2) {
        subSubRowField = _.get(
          ExpendituresHeatmapMapping,
          `fields["${row.split(',')[2]}"]`,
          ExpendituresHeatmapMapping.fields.principalRecipient,
        );
      }
    } else {
      rowField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${row}"]`,
        ExpendituresHeatmapMapping.fields.principalRecipientType,
      );
    }
    if (column.split(',').length > 1) {
      columnField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${column.split(',')[0]}"]`,
        ExpendituresHeatmapMapping.fields.principalRecipientType,
      );
      subColumnField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${column.split(',')[1]}"]`,
        ExpendituresHeatmapMapping.fields.principalRecipient,
      );
    } else {
      columnField = _.get(
        ExpendituresHeatmapMapping,
        `fields["${column}"]`,
        ExpendituresHeatmapMapping.fields.component,
      ).replace(/<componentField>/g, componentField);
    }
    const rowFieldArray = [rowField, subRowField, subSubRowField].filter(
      item => item.length > 0,
    );
    filterString = filterString.replace(
      '<rowField>',
      rowFieldArray.join(',').replace(/(^,)|(,$)/g, ''),
    );
    filterString = filterString.replace(
      '<columnField>',
      [columnField, subColumnField].join(',').replace(/(^,)|(,$)/g, ''),
    );
    filterString = filterFinancialIndicators(this.req.query, filterString);

    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    rowField = rowField.replace(/\//g, '.');
    subRowField = subRowField.replace(/\//g, '.');
    subSubRowField = subSubRowField.replace(/\//g, '.');
    columnField = columnField.replace(/\//g, '.');
    subColumnField = subColumnField.replace(/\//g, '.');

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, ExpendituresHeatmapMapping.dataPath, []);
        const data = _.filter(
          raw.map((item: any) => {
            const budget = _.get(item, ExpendituresHeatmapMapping.budget, 0);
            const expenditure = _.get(
              item,
              ExpendituresHeatmapMapping.expenditure,
              0,
            );
            return {
              row: subRowField
                ? _.get(item, subRowField, '')
                : _.get(item, rowField),
              parentRow: subRowField ? _.get(item, rowField) : undefined,
              column: subColumnField
                ? _.get(item, subColumnField, '')
                : _.get(item, columnField),
              parentColumn: subColumnField
                ? _.get(item, columnField)
                : undefined,
              value: expenditure,
              budget,
              percentage:
                budget && budget > 0
                  ? Math.round((expenditure / budget) * 100)
                  : 120,
            };
          }),
          (item: any) => item.row && item.column,
        );

        const rows = _.uniq(data.map((item: any) => item.row));
        const columns = _.uniq(data.map((item: any) => item.column));
        const parentRows = _.uniq(
          _.filter(
            data.map((item: any) => item.parentRow),
            (item: any) => item,
          ),
        );
        const parentColumns = _.uniq(
          _.filter(
            data.map((item: any) => item.parentColumn),
            (item: any) => item,
          ),
        );

        if (parentRows.length > 0) {
          parentRows.forEach((parentRow: any) => {
            columns.forEach((column: any) => {
              const expenditure = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentRow === parentRow && item.column === column,
                ),
                'value',
              );
              const budget = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentRow === parentRow && item.column === column,
                ),
                'budget',
              );
              data.push({
                row: parentRow,
                column,
                value: expenditure,
                budget,
                percentage:
                  budget && budget > 0
                    ? Math.round((expenditure / budget) * 100)
                    : 120,
              });
            });
          });
        }

        if (parentColumns.length > 0) {
          console.log(1.1, parentColumns.length);
          parentColumns.forEach((parentColumn: any) => {
            rows.forEach((row: any) => {
              const expenditure = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentColumn === parentColumn && item.row === row,
                ),
                'value',
              );
              const budget = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentColumn === parentColumn && item.row === row,
                ),
                'budget',
              );
              data.push({
                row,
                column: parentColumn,
                value: expenditure,
                budget,
                percentage:
                  budget && budget > 0
                    ? Math.round((expenditure / budget) * 100)
                    : 120,
              });
            });
          });
        }

        if (parentRows.length > 0 && parentColumns.length > 0) {
          console.log(1.2, parentRows.length, parentColumns.length);
          parentRows.forEach((parentRow: any) => {
            parentColumns.forEach((parentColumn: any) => {
              const expenditure = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentRow === parentRow &&
                    item.parentColumn === parentColumn,
                ),
                'value',
              );
              const budget = _.sumBy(
                data.filter(
                  (item: any) =>
                    item.parentRow === parentRow &&
                    item.parentColumn === parentColumn,
                ),
                'budget',
              );
              data.push({
                row: parentRow,
                column: parentColumn,
                value: expenditure,
                budget,
                percentage:
                  budget && budget > 0
                    ? Math.round((expenditure / budget) * 100)
                    : 120,
              });
            });
          });
        }

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/expenditures/expandable-bar/{componentField}')
  @response(200)
  async expandableBar(
    @param.path.string('componentField') componentField: string,
  ) {
    const filterString = filterFinancialIndicators(
      this.req.query,
      ExpendituresBarChartMapping.urlParams.replace(
        /<componentField>/g,
        componentField,
      ),
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, ExpendituresBarChartMapping.dataPath, []);

        const groupedByName = _.groupBy(
          raw,
          ExpendituresBarChartMapping.name.replace(
            /<componentField>/g,
            componentField,
          ),
        );

        const data = _.map(groupedByName, (value, key) => {
          const groupedByItem = _.groupBy(
            value,
            ExpendituresBarChartMapping.itemName.replace(
              /<componentField>/g,
              componentField,
            ),
          );
          return {
            name: key,
            value: _.sumBy(value, ExpendituresBarChartMapping.value),
            items: _.map(groupedByItem, (subValue, subKey) => ({
              name: subKey,
              value: _.sumBy(subValue, ExpendituresBarChartMapping.value),
            })),
          };
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/expenditures/table/{componentField}')
  @response(200)
  async table(@param.path.string('componentField') componentField: string) {
    const filterString = filterFinancialIndicators(
      this.req.query,
      ExpendituresTableMapping.urlParams.replace(
        /<componentField>/g,
        componentField,
      ),
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, ExpendituresTableMapping.dataPath, []);

        const groupedByName = _.groupBy(
          raw,
          ExpendituresTableMapping.name.replace(
            /<componentField>/g,
            componentField,
          ),
        );

        const data = _.map(groupedByName, (value, key) => {
          const groupedByItem = _.groupBy(
            value,
            ExpendituresTableMapping.itemName.replace(
              /<componentField>/g,
              componentField,
            ),
          );
          return {
            name: key,
            cumulativeExpenditure: _.sumBy(
              value,
              ExpendituresTableMapping.cumulativeExpenditureValue,
            ),
            periodExpenditure: _.sumBy(
              value,
              ExpendituresTableMapping.periodExpenditureValue,
            ),
            _children: _.map(groupedByItem, (subValue, subKey) => ({
              name: subKey,
              cumulativeExpenditure: _.sumBy(
                subValue,
                ExpendituresTableMapping.cumulativeExpenditureValue,
              ),
              periodExpenditure: _.sumBy(
                subValue,
                ExpendituresTableMapping.periodExpenditureValue,
              ),
            })),
          };
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  @get('/expenditures/cycles')
  @response(200)
  async cycles() {
    return axios
      .get(`${urls.FINANCIAL_INDICATORS}${ExpendituresCyclesMapping.urlParams}`)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          ExpendituresCyclesMapping.dataPath,
          [],
        );

        const data = _.map(rawData, (item, index) => {
          const from = _.get(item, ExpendituresCyclesMapping.cycleFrom, '');
          const to = _.get(item, ExpendituresCyclesMapping.cycleTo, '');

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

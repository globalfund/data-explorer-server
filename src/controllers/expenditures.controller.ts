import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import ExpendituresBarChartMapping from '../config/mapping/expenditures/bar.json';
import ExpendituresHeatmapMapping from '../config/mapping/expenditures/heatmap.json';
import ExpendituresTableMapping from '../config/mapping/expenditures/table.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFinancialIndicators} from '../utils/filtering/financialIndicators';

export class ExpendituresController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/expenditures/heatmap/{row}/{column}')
  @response(200)
  async heatmap(
    @param.path.string('row') row: string,
    @param.path.string('column') column: string,
  ) {
    let filterString = ExpendituresHeatmapMapping.urlParams;
    let rowField = '';
    let subRowField = '';
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
      );
    }
    filterString = filterString.replace(
      '<rowField>',
      [rowField, subRowField].join(',').replace(/(^,)|(,$)/g, ''),
    );
    filterString = filterString.replace(
      '<columnField>',
      [columnField, subColumnField].join(',').replace(/(^,)|(,$)/g, ''),
    );
    filterString = filterFinancialIndicators(this.req.query, filterString);

    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    rowField = rowField.replace(/\//g, '.');
    subRowField = subRowField.replace(/\//g, '.');
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

  @get('/expenditures/expandable-bar')
  @response(200)
  async expandableBar() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      ExpendituresBarChartMapping.urlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, ExpendituresBarChartMapping.dataPath, []);

        const groupedByName = _.groupBy(raw, ExpendituresBarChartMapping.name);

        const data = _.map(groupedByName, (value, key) => {
          const groupedByItem = _.groupBy(
            value,
            ExpendituresBarChartMapping.itemName,
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

  @get('/expenditures/table')
  @response(200)
  async table() {
    const filterString = filterFinancialIndicators(
      this.req.query,
      ExpendituresTableMapping.urlParams,
    );
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, ExpendituresTableMapping.dataPath, []);

        const groupedByName = _.groupBy(raw, ExpendituresTableMapping.name);

        const data = _.map(groupedByName, (value, key) => {
          const groupedByItem = _.groupBy(
            value,
            ExpendituresTableMapping.itemName,
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
}

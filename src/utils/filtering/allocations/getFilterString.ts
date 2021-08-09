import _ from 'lodash';
import filteringAllocations from '../../../config/filtering/allocations.json';
import filtering from '../../../config/filtering/index.json';

export function getFilterString(
  params: any,
  aggregationString?: string,
  extraFilterString?: string,
) {
  let str = extraFilterString ?? '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `(${filteringAllocations.country}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}) OR ${filteringAllocations.multicountry}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}))`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringAllocations.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (period: string) => period.length > 0,
  ).map((period: string) => period);
  if (periods.length > 0) {
    const startPeriods = periods.map((period: string) =>
      period.split('-')[0].trim(),
    );
    const endPeriods = periods.map((period: string) =>
      period.split('-')[1].trim(),
    );
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringAllocations.periodStart
    }${filtering.in}(${startPeriods.join(filtering.multi_param_separator)})`;
    str += `${str.length > 0 ? ' AND ' : ''}${filteringAllocations.periodEnd}${
      filtering.in
    }(${endPeriods.join(filtering.multi_param_separator)})`;
  }

  str += `${
    str.length > 0 && _.get(params, 'levelParam', '').length > 0 ? ' AND ' : ''
  }${_.get(params, 'levelParam', '')}`;

  if (str.length > 0) {
    str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
    if (aggregationString) {
      str = aggregationString.replace(
        '<filterString>',
        `${str
          .replace(
            `${filtering.filter_operator}${filtering.param_assign_operator}`,
            'filter(',
          )
          .replace('&', ')/')}`,
      );
    }
  } else if (aggregationString) {
    str = aggregationString.replace('<filterString>', '');
  }

  return str;
}

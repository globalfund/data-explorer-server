import _ from 'lodash';
import filtering from '../../../config/filtering/index.json';
import filteringResults from '../../../config/filtering/results.json';

export function getFilterString(params: any, defaultFilter?: string) {
  let str = defaultFilter ?? '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringResults.country}${
      filtering.in
    }(${locations.join(filtering.multi_param_separator)})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringResults.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  if (str.length > 0) {
    if (!defaultFilter) {
      str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
    }
  }

  return str;
}

export function getFilterStringForStats(
  params: any,
  aggregationString?: string,
) {
  let str = '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringResults.country}${
      filtering.in
    }(${locations.join(filtering.multi_param_separator)})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringResults.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  if (str.length > 0) {
    if (aggregationString) {
      str = aggregationString.replace('<filterString>', ` AND ${str}`);
    }
  } else if (aggregationString) {
    str = aggregationString.replace('<filterString>', '');
  }

  return str;
}

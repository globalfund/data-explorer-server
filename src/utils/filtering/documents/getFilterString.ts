import _ from 'lodash';
import filteringDocuments from '../../../config/filtering/documents.json';
import filtering from '../../../config/filtering/index.json';

export function getFilterString(params: any, defaultFilter?: string) {
  let str = defaultFilter ?? '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringDocuments.country}${
      filtering.in
    }(${locations.join(filtering.multi_param_separator)})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringDocuments.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const grantId = _.get(params, 'grantId', null);
  if (grantId) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringDocuments.grantId}${
      filtering.eq
    }${grantId}`;
  }

  const multicountries = _.filter(
    _.get(params, 'multicountries', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (multicountries.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringDocuments.multicountry}${
      filtering.in
    }(${multicountries.join(filtering.multi_param_separator)})`;
  }

  const search = _.get(params, 'q', '');
  if (search.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringDocuments.search.replace(
      /<value>/g,
      `'${search}'`,
    )}`;
  }

  if (str.length > 0) {
    str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
  }

  return str;
}

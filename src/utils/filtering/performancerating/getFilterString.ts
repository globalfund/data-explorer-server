import _ from 'lodash';
import filtering from '../../../config/filtering/index.json';
import filteringPF from '../../../config/filtering/performancerating.json';

export function getFilterString(params: any) {
  let str = '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `(${filteringPF.country}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}) OR ${filteringPF.multicountry}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}))`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringPF.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const statuses = _.filter(
    _.get(params, 'status', '').split(','),
    (stat: string) => stat.length > 0,
  ).map((stat: string) => `'${stat}'`);
  if (statuses.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringPF.status}${
      filtering.in
    }(${statuses.join(filtering.multi_param_separator)})`;
  }

  const partners = _.filter(
    _.get(params, 'partners', '').split(','),
    (partner: string) => partner.length > 0,
  ).map((partner: string) => `'${partner}'`);
  if (partners.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringPF.partner}${
      filtering.in
    }(${partners.join(filtering.multi_param_separator)})`;
  }

  if (str.length > 0) {
    str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
  }

  return str;
}

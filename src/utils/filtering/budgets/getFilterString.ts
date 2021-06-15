import _ from 'lodash';
import filteringBudgets from '../../../config/filtering/budgets.json';
import filtering from '../../../config/filtering/index.json';

export function getFilterString(params: any, aggregationString?: string) {
  let str = '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `${filteringBudgets.country}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringBudgets.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const statuses = _.filter(
    _.get(params, 'status', '').split(','),
    (stat: string) => stat.length > 0,
  ).map((stat: string) => `'${stat}'`);
  if (statuses.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringBudgets.status}${
      filtering.in
    }(${statuses.join(filtering.multi_param_separator)})`;
  }

  // const partners = _.filter(
  //   _.get(params, 'partners', '').split(','),
  //   (partner: string) => partner.length > 0,
  // ).map((partner: string) => `'${partner}'`);
  // if (partners.length > 0) {
  //   str += `${str.length > 0 ? ' AND ' : ''}${filteringBudgets.partner}${
  //     filtering.in
  //   }(${partners.join(filtering.multi_param_separator)})`;
  // }

  const partnerTypes = _.filter(
    _.get(params, 'partnerTypes', '').split(','),
    (type: string) => type.length > 0,
  ).map((type: string) => `'${type}'`);
  if (partnerTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringBudgets.partner_type}${
      filtering.in
    }(${partnerTypes.join(filtering.multi_param_separator)})`;
  }

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

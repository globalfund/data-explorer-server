import _ from 'lodash';
import filteringGrants from '../../../config/filtering/grants.json';
import filtering from '../../../config/filtering/index.json';

export function getFilterString(params: any, aggregationString?: string) {
  let str = '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `(${filteringGrants.country}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}) OR ${filteringGrants.multicountry}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}))`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const statuses = _.filter(
    _.get(params, 'status', '').split(','),
    (stat: string) => stat.length > 0,
  ).map((stat: string) => `'${stat}'`);
  if (statuses.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.status}${
      filtering.in
    }(${statuses.join(filtering.multi_param_separator)})`;
  }

  const partners = _.filter(
    _.get(params, 'partners', '').split(','),
    (partner: string) => partner.length > 0,
  ).map((partner: string) => `'${partner}'`);
  if (partners.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.partner}${
      filtering.in
    }(${partners.join(filtering.multi_param_separator)})`;
  }

  const partnerSubTypes = _.filter(
    _.get(params, 'partnerSubTypes', '').split(','),
    (type: string) => type.length > 0,
  ).map((type: string) => `'${type}'`);
  if (partnerSubTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrants.partner_sub_type
    }${filtering.in}(${partnerSubTypes.join(filtering.multi_param_separator)})`;
  }

  const partnerTypes = _.filter(
    _.get(params, 'partnerTypes', '').split(','),
    (type: string) => type.length > 0,
  ).map((type: string) => `'${type}'`);
  if (partnerTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.partner_type}${
      filtering.in
    }(${partnerTypes.join(filtering.multi_param_separator)})`;
  }

  const grantId = _.get(params, 'grantId', null);
  if (grantId) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.grantId}${
      filtering.eq
    }${grantId}`;
  }

  const IPnumber = _.get(params, 'IPnumber', null);
  if (IPnumber) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.IPnumber}${
      filtering.eq
    }${IPnumber}`;
  }

  const barPeriod = _.get(params, 'barPeriod', null);
  if (barPeriod) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.barPeriod}${
      filtering.eq
    }${barPeriod}`;
  }
  const signedBarPeriod = _.get(params, 'signedBarPeriod', null);
  if (signedBarPeriod) {
    str += `${
      str.length > 0 ? ' AND ' : ''
    }${filteringGrants.signedBarPeriod
      .replace('<date1>', `${signedBarPeriod}-01-01`)
      .replace('<date2>', `${parseInt(signedBarPeriod, 10) + 1}-01-01`)}`;
  }
  const committedBarPeriod = _.get(params, 'committedBarPeriod', null);
  if (committedBarPeriod) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrants.committedBarPeriod
    }${filtering.eq}${committedBarPeriod}`;
  }

  const search = _.get(params, 'q', '');
  if (search.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringGrants.search.replace(
      '<value>',
      `'${search}'`,
    )}`;
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

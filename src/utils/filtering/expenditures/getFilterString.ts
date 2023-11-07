import _ from 'lodash';
import filteringExpenditures from '../../../config/filtering/expenditures.json';
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
    str += `${str.length > 0 ? ' AND ' : ''}${filteringExpenditures.country}${
      filtering.in
    }(${locations.join(filtering.multi_param_separator)}) OR ${
      filteringExpenditures.multicountry
    }${filtering.in}(${locations.join(filtering.multi_param_separator)})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringExpenditures.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const partners = _.filter(
    _.get(params, 'partners', '').split(','),
    (partner: string) => partner.length > 0,
  ).map((partner: string) => `'${partner}'`);
  if (partners.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringExpenditures.partner}${
      filtering.in
    }(${partners.join(filtering.multi_param_separator)})`;
  }

  const partnerSubTypes = _.filter(
    _.get(params, 'partnerSubTypes', '').split(','),
    (type: string) => type.length > 0,
  ).map((type: string) => `'${type}'`);
  if (partnerSubTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.partner_sub_type
    }${filtering.in}(${partnerSubTypes.join(filtering.multi_param_separator)})`;
  }

  const partnerTypes = _.filter(
    _.get(params, 'partnerTypes', '').split(','),
    (type: string) => type.length > 0,
  ).map((type: string) => `'${type}'`);
  if (partnerTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.partner_type
    }${filtering.in}(${partnerTypes.join(filtering.multi_param_separator)})`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (period: string) => period.length > 0,
  ).map((period: string) => period);
  if (periods.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringExpenditures.period}${
      filtering.in
    }(${periods.join(filtering.multi_param_separator)})`;
  }

  const grantCycles = _.filter(
    _.get(params, 'grantCycles', '').split(','),
    (grantCycle: string) => grantCycle.length > 0,
  ).map((grantCycle: string) => `'${grantCycle}'`);
  if (grantCycles.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringExpenditures.cycle}${
      filtering.in
    }(${grantCycles.join(filtering.multi_param_separator)})`;
  }

  const moduleInterventionsLevel0 = _.filter(
    _.get(params, 'moduleInterventionsLevel0', '').split(','),
    (item: string) => item.length > 0,
  ).map((item: string) => `'${item}'`);
  if (moduleInterventionsLevel0.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.moduleInterventionsLevel0
    }${filtering.in}(${moduleInterventionsLevel0.join(
      filtering.multi_param_separator,
    )})`;
  }

  const moduleInterventionsLevel1 = _.filter(
    _.get(params, 'moduleInterventionsLevel1', '').split(','),
    (item: string) => item.length > 0,
  ).map((item: string) => `'${item}'`);
  if (moduleInterventionsLevel1.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.moduleInterventionsLevel1
    }${filtering.in}(${moduleInterventionsLevel1.join(
      filtering.multi_param_separator,
    )})`;
  }

  const investmentLandscapesLevel0 = _.filter(
    _.get(params, 'investmentLandscapesLevel0', '').split(','),
    (item: string) => item.length > 0,
  ).map((item: string) => `'${item}'`);
  if (investmentLandscapesLevel0.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.investmentLandscapesLevel0
    }${filtering.in}(${investmentLandscapesLevel0.join(
      filtering.multi_param_separator,
    )})`;
  }

  const investmentLandscapesLevel1 = _.filter(
    _.get(params, 'investmentLandscapesLevel1', '').split(','),
    (item: string) => item.length > 0,
  ).map((item: string) => `'${item}'`);
  if (investmentLandscapesLevel1.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.investmentLandscapesLevel1
    }${filtering.in}(${investmentLandscapesLevel1.join(
      filtering.multi_param_separator,
    )})`;
  }

  const investmentLandscapesLevel2 = _.filter(
    _.get(params, 'investmentLandscapesLevel2', '').split(','),
    (item: string) => item.length > 0,
  ).map((item: string) => `'${item}'`);
  if (investmentLandscapesLevel2.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringExpenditures.investmentLandscapesLevel2
    }${filtering.in}(${investmentLandscapesLevel2.join(
      filtering.multi_param_separator,
    )})`;
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

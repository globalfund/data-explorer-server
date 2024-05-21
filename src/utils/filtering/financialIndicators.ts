import _ from 'lodash';
import filtering from '../../config/filtering/index.json';

const MAPPING = {
  geography: ['geography/code', 'implementationPeriod/grant/geography/code'],
  donor: 'donor/name',
  donorType: 'donor/type/name',
  period: 'periodCovered',
  donorGeography: 'donor/geography/code',
  year: 'implementationPeriod/periodFrom',
  yearTo: 'implementationPeriod/periodTo',
  grantIP: 'implementationPeriod/code',
  search: `(contains(donor/type/name,<value>) OR contains(donor/name,<value>) OR contains(periodCovered,<value>))`,
};

export function filterFinancialIndicators(
  params: Record<string, any>,
  urlParams: string,
): string {
  let str = '';

  const geographies = _.filter(
    _.get(params, 'geographies', '').split(','),
    (o: string) => o.length > 0,
  ).map((geography: string) => `'${geography}'`);
  if (geographies.length > 0) {
    if (MAPPING.geography instanceof Array) {
      str += `${str.length > 0 ? ' AND ' : ''}(${MAPPING.geography
        .map(
          m =>
            `${m}${filtering.in}(${geographies.join(
              filtering.multi_param_separator,
            )})`,
        )
        .join(' OR ')})`;
    }
  }

  const donors = _.filter(
    _.get(params, 'donors', '').split(','),
    (o: string) => o.length > 0,
  ).map((donor: string) => `'${donor}'`);
  if (donors.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.donor}${
      filtering.in
    }(${donors.join(filtering.multi_param_separator)})`;
  }

  const donorTypes = _.filter(
    _.get(params, 'donorTypes', '').split(','),
    (o: string) => o.length > 0,
  ).map((donorType: string) => `'${donorType}'`);
  if (donorTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.donorType}${
      filtering.in
    }(${donors.join(filtering.multi_param_separator)})`;
  }

  const donorGeographies = _.filter(
    _.get(params, 'donorGeographies', '').split(','),
    (o: string) => o.length > 0,
  ).map((donorGeography: string) => `'${donorGeography}'`);
  if (donorGeographies.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.donorGeography}${
      filtering.in
    }(${donorGeographies.join(filtering.multi_param_separator)})`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (o: string) => o.length > 0,
  ).map((period: string) => `'${period}'`);
  if (periods.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.period}${
      filtering.in
    }(${periods.join(filtering.multi_param_separator)})`;
  }

  const years = _.filter(
    [
      ..._.get(params, 'years', '').split(','),
      ..._.get(params, 'cycle', '').split(','),
    ],
    (o: string) => o.length > 0,
  ).map((year: string) => `'${year}'`);
  if (years.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.year}${
      filtering.in
    }(${years.join(filtering.multi_param_separator)})`;
  }

  const yearsTo = _.filter(
    _.get(params, 'yearsTo', '').split(','),
    (o: string) => o.length > 0,
  ).map((yearTo: string) => `'${yearTo}'`);
  if (yearsTo.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.yearTo}${
      filtering.in
    }(${yearsTo.join(filtering.multi_param_separator)})`;
  }

  const grantIPs = _.filter(
    _.get(params, 'grantIP', '').split(','),
    (o: string) => o.length > 0,
  ).map((grantIP: string) => `'${grantIP}'`);
  if (grantIPs.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.grantIP}${
      filtering.in
    }(${grantIPs.join(filtering.multi_param_separator)})`;
  }

  const search = _.get(params, 'q', '');
  if (search.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.search.replace(
      /<value>/g,
      `'${search}'`,
    )}`;
  }

  if (str.length > 0) {
    if (urlParams) {
      str = urlParams.replace('<filterString>', ` AND ${str}`);
    }
  } else if (urlParams) {
    str = urlParams.replace('<filterString>', '');
  }

  return str;
}

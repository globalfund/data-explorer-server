import _ from 'lodash';
import filtering from '../../config/filtering/index.json';
import CycleMapping from '../../static-assets/cycle-mapping.json';
import {getGeographyValues} from './geographies';

const MAPPING = {
  geography: [
    'geography/code',
    'geography/name',
    'implementationPeriod/grant/geography/code',
    'implementationPeriod/grant/geography/name',
  ],
  component: [
    'activityArea/name',
    'activityAreaGroup/name',
    'activityArea/parent/parent/name',
    'activityAreaGroup/parent/parent/name',
  ],
  donor: 'donor/name',
  donorType: 'donor/type/name',
  principalRecipient: 'implementationPeriod/grant/principalRecipient/name',
  principalRecipientSubType:
    'implementationPeriod/grant/principalRecipient/type/name',
  principalRecipientType:
    'implementationPeriod/grant/principalRecipient/type/parent/name',
  period: 'periodCovered',
  cycle: 'periodCovered',
  year: 'implementationPeriod/periodFrom',
  yearTo: 'implementationPeriod/periodTo',
  grantIP: 'implementationPeriod/code',
  status: 'implementationPeriod/status/statusName',
  search: `(contains(donor/type/name,<value>) OR contains(donor/name,<value>) OR contains(periodCovered,<value>))`,
};

export function filterFinancialIndicators(
  params: Record<string, any>,
  urlParams: string,
  geographyMapping: string | string[],
  componentMapping: string,
): string {
  let str = '';

  if (_.get(params, 'cycleNames', '')) {
    const cycles = _.get(params, 'cycleNames', '').split(',');
    const cycleValues = _.filter(
      cycles.map(
        (cycle: string) => _.find(CycleMapping, {name: cycle})?.value ?? '',
      ),
      (c: string) => c.length > 0,
    );
    cycleValues.forEach((cycle: string) => {
      const splits = cycle.split(' - ');
      params = {
        ...params,
        years: splits[0],
        yearsTo: splits[1],
      };
    });
  }

  const geos = _.filter(
    _.get(params, 'geographies', '').split(','),
    (o: string) => o.length > 0,
  );
  const geographies = geos.map(
    (geography: string) => `'${geography.replace(/'/g, "''")}'`,
  );
  if (geos.length > 0) {
    const values: string[] = [...geographies, ...getGeographyValues(geos)];
    const geoMapping =
      geographyMapping instanceof Array ? geographyMapping : [geographyMapping];
    str += `${str.length > 0 ? ' AND ' : ''}(${geoMapping
      .map(
        m =>
          `${m}${filtering.in}(${values.join(
            filtering.multi_param_separator,
          )})`,
      )
      .join(' OR ')})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (o: string) => o.length > 0,
  ).map((component: string) => `'${component}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${componentMapping}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
  }

  const donors = _.filter(
    _.get(params, 'donors', '').split(','),
    (o: string) => o.length > 0,
  ).map((donor: string) => `'${donor.replace(/'/g, "''")}'`);
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
    }(${donorTypes.join(filtering.multi_param_separator)})`;
  }

  const principalRecipients = _.filter(
    _.get(params, 'principalRecipients', '').split(','),
    (o: string) => o.length > 0,
  ).map((principalRecipient: string) => `'${principalRecipient}'`);
  if (principalRecipients.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.principalRecipient}${
      filtering.in
    }(${principalRecipients.join(filtering.multi_param_separator)})`;
  }

  const principalRecipientTypes = _.filter(
    _.get(params, 'principalRecipientTypes', '').split(','),
    (o: string) => o.length > 0,
  ).map((principalRecipientType: string) => `'${principalRecipientType}'`);
  if (principalRecipientTypes.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.principalRecipientType}${
      filtering.in
    }(${principalRecipientTypes.join(filtering.multi_param_separator)})`;
  }

  const periods = _.filter(
    [
      ..._.get(params, 'periods', '').split(','),
      ..._.get(params, 'cycles', '').split(','),
    ],
    (o: string) => o.length > 0,
  ).map((period: string) => `'${period.replace(/ /g, '').replace(' - ', '')}'`);
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

  const statuses = _.filter(
    _.get(params, 'status', '').split(','),
    (o: string) => o.length > 0,
  ).map((status: string) => `'${status}'`);
  if (statuses.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.status}${
      filtering.in
    }(${statuses.join(filtering.multi_param_separator)})`;
  }

  const search = _.get(params, 'q', '');
  if (search.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.search.replace(
      /<value>/g,
      `'${search}'`,
    )}`;
  }

  let res = urlParams;

  if (str.length > 0) {
    str = str.replace(/&/g, '%26');
    if (urlParams) {
      res = res.replace('filter(<filterString>)', `filter(${str})`);
      res = res.replace('<filterString>', ` AND ${str}`);
      res = res.replace('= AND ', '=');
    }
  } else if (urlParams) {
    res = res.replace('$filter=<filterString>&', '');
    res = res.replace('filter(<filterString>)/', '');
    res = res.replace('<filterString>/', '');
    res = res.replace('<filterString>', '');
  }

  return res;
}
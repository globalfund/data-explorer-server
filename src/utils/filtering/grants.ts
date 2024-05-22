import _ from 'lodash';
import filtering from '../../config/filtering/index.json';

const MAPPING = {
  geography: 'geography/code',
  status: 'status/statusName',
  component: 'activityArea/name',
  principalRecipient: 'principalRecipient/name',
  startDate: 'periodStartDate',
  endDate: 'periodEndDate',
  search:
    'contains(geography/name,<value>) OR contains(activityArea/name,<value>) OR contains(principalRecipient/name,<value>) OR contains(status/statusName,<value>) OR contains(code,<value>)',
};

export function filterGrants(
  params: Record<string, any>,
  urlParams: string,
): string {
  let str = '';

  const geographies = _.filter(
    _.get(params, 'geographies', '').split(','),
    (o: string) => o.length > 0,
  ).map((geography: string) => `'${geography}'`);
  if (geographies.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.geography}${
      filtering.in
    }(${geographies.join(filtering.multi_param_separator)})`;
  }

  const statuses = _.filter(
    _.get(params, 'statuses', '').split(','),
    (o: string) => o.length > 0,
  ).map((status: string) => `'${status}'`);
  if (statuses.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.status}${
      filtering.in
    }(${statuses.join(filtering.multi_param_separator)})`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (o: string) => o.length > 0,
  ).map((component: string) => `'${component}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.component}${
      filtering.in
    }(${components.join(filtering.multi_param_separator)})`;
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

  const startDate = _.get(params, 'startDate', '');
  if (startDate.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.startDate}${
      filtering.gte
    }'${startDate}'`;
  }

  const endDate = _.get(params, 'endDate', '');
  if (endDate.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.endDate}${
      filtering.lte
    }'${endDate}'`;
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
      str = urlParams.replace('<filterString>', str);
    }
  } else if (urlParams) {
    str = urlParams.replace('$filter=<filterString>&', '');
  }

  return str;
}

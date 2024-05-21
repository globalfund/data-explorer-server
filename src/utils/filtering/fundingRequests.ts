import _ from 'lodash';
import filtering from '../../config/filtering/index.json';

const MAPPING = {
  geography: 'geography/code',
  component: 'activityArea/name',
  period: 'periodFrom',
  trpWindow: 'window',
  portfolioCategory: 'differentiationCategory',
};

export function filterFundingRequests(
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

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (o: string) => o.length > 0,
  ).map((component: string) => `'${component}'`);
  if (components.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.component.replace(
      /<value>/g,
      components.join(filtering.multi_param_separator),
    )}`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (o: string) => o.length > 0,
  ).map((period: string) => period);
  if (periods.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.period}${
      filtering.in
    }(${periods.join(filtering.multi_param_separator)})`;
  }

  const trpWindows = _.filter(
    _.get(params, 'trpWindows', '').split(','),
    (o: string) => o.length > 0,
  ).map((trpWindow: string) => `'${trpWindow}'`);
  if (trpWindows.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.trpWindow}${
      filtering.in
    }(${trpWindows.join(filtering.multi_param_separator)})`;
  }

  const portfolioCategories = _.filter(
    _.get(params, 'portfolioCategories', '').split(','),
    (o: string) => o.length > 0,
  ).map((portfolioCategory: string) => `'${portfolioCategory}'`);
  if (portfolioCategories.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.portfolioCategory}${
      filtering.in
    }(${portfolioCategories.join(filtering.multi_param_separator)})`;
  }

  // const search = _.get(params, 'q', '');
  // if (search.length > 0) {
  //   str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.search.replace(
  //     /<value>/g,
  //     `'${search}'`,
  //   )}`;
  // }

  if (str.length > 0) {
    if (urlParams) {
      str = urlParams.replace('<filterString>', ` AND ${str}`);
      str = str.replace('= AND ', '=');
    }
  } else if (urlParams) {
    str = urlParams.replace('<filterString>', '').replace('$filter=&', '');
  }

  return str;
}

import _ from 'lodash';
import filteringFunding from '../../../config/filtering/fundingrequests.json';
import filtering from '../../../config/filtering/index.json';

export function getFilterString(params: any, defaultFilter?: string) {
  let str = defaultFilter ?? '';

  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((loc: string) => `'${loc}'`);
  if (locations.length > 0) {
    str += `(${filteringFunding.country}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}) OR ${filteringFunding.multicountry}${filtering.in}(${locations.join(
      filtering.multi_param_separator,
    )}))`;
  }

  const components = _.filter(
    _.get(params, 'components', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (components.length > 0) {
    str += `${
      str.length > 0 ? ' AND ' : ''
    }${filteringFunding.component.replace(
      '<value>',
      components.join(filtering.multi_param_separator),
    )}`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (period: string) => period.length > 0,
  ).map((period: string) => period);
  if (periods.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringFunding.cycle}${
      filtering.in
    }(${periods.join(filtering.multi_param_separator)})`;
  }

  const trpWindows = _.filter(
    _.get(params, 'trpWindows', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (trpWindows.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringFunding.trpwindow}${
      filtering.in
    }(${trpWindows.join(filtering.multi_param_separator)})`;
  }

  const portfolioCategories = _.filter(
    _.get(params, 'portfolioCategories', '').split(','),
    (comp: string) => comp.length > 0,
  ).map((comp: string) => `'${comp}'`);
  if (portfolioCategories.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringFunding.portfolioCategory
    }${filtering.in}(${portfolioCategories.join(
      filtering.multi_param_separator,
    )})`;
  }

  const cycles = _.filter(
    _.get(params, 'cycles', '').split(','),
    (cycle: string) => cycle.length > 0,
  ).map((cycle: string) => `'${cycle}'`);
  if (cycles.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringFunding.cycle}${
      filtering.in
    }(${cycles.join(filtering.multi_param_separator)})`;
  }

  const search = _.get(params, 'q', '');
  if (search.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${filteringFunding.search.replace(
      /<value>/g,
      `'${search}'`,
    )}`;
  }

  if (str.length > 0) {
    if (!defaultFilter) {
      str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
    }
  }

  return str;
}

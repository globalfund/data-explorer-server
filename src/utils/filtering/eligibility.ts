import _ from 'lodash';
import filtering from '../../config/filtering/index.json';
import {getGeographyValues} from './geographies';

const MAPPING = {
  geography: ['geography/name', 'geography/code'],
  component: 'activityArea/name',
  year: 'eligibilityYear',
  cycle: 'fundingStream',
};

export function filterEligibility(
  params: Record<string, any>,
  urlParams: string,
): string {
  let str = '';

  const geos = _.filter(
    _.get(params, 'geographies', '').split(','),
    (o: string) => o.length > 0,
  );
  const geographies = geos.map((geography: string) => `'${geography}'`);
  if (geos.length > 0) {
    const values: string[] = [...geographies, ...getGeographyValues(geos)];
    if (MAPPING.geography instanceof Array) {
      str += `${str.length > 0 ? ' AND ' : ''}(${MAPPING.geography
        .map(
          m =>
            `${m}${filtering.in}(${values.join(
              filtering.multi_param_separator,
            )})`,
        )
        .join(' OR ')})`;
    }
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

  const years = _.filter(
    _.get(params, 'years', '').split(','),
    (o: string) => o.length > 0,
  ).map((year: string) => `'${year}'`);
  if (years.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.year}${
      filtering.in
    }(${years.join(filtering.multi_param_separator)})`;
  }

  const cycles = _.filter(
    _.get(params, 'cycles', '').split(','),
    (o: string) => o.length > 0,
  ).map((cycle: string) => `'${cycle}'`);
  if (cycles.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.cycle}${
      filtering.in
    }(${cycles.join(filtering.multi_param_separator)})`;
  }

  // const search = _.get(params, 'q', '');
  // if (search.length > 0) {
  //   str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.search.replace(
  //     /<value>/g,
  //     `'${search}'`,
  //   )}`;
  // }

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

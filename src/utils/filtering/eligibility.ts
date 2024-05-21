import _ from 'lodash';
import filtering from '../../config/filtering/index.json';

const MAPPING = {
  geography: 'geography/code',
  year: 'eligibilityYear',
};

export function filterEligibility(
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

  const years = _.filter(
    _.get(params, 'years', '').split(','),
    (o: string) => o.length > 0,
  ).map((year: string) => `'${year}'`);
  if (years.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.year}${
      filtering.in
    }(${years.join(filtering.multi_param_separator)})`;
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
    }
  } else if (urlParams) {
    str = urlParams.replace('<filterString>/', '');
  }

  return str;
}

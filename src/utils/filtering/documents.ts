import _ from 'lodash';
import filtering from '../../config/filtering/index.json';
import {getGeographyValues} from './geographies';

const MAPPING = {
  geography: ['geography/code', 'geography/name'],
  type: 'documentType/parent/name',
  search: `(contains(documentType/parent/name,<value>) OR contains(title,<value>))`,
};

export function filterDocuments(
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
    str += `${str.length > 0 ? ' AND ' : ''}(${MAPPING.geography
      .map(
        m =>
          `${m}${filtering.in}(${values.join(
            filtering.multi_param_separator,
          )})`,
      )
      .join(' OR ')})`;
  }

  const types = _.filter(
    _.get(params, 'types', '').split(','),
    (o: string) => o.length > 0,
  ).map((type: string) => `'${type}'`);
  if (types.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${MAPPING.type}${
      filtering.in
    }(${types.join(filtering.multi_param_separator)})`;
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
    str = urlParams.replace('<filterString>', '');
  }

  return str;
}

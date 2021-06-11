import _ from 'lodash';
import filtering from '../../config/filtering/index.json';

export function getFilterString(params: any) {
  const locations = _.filter(
    _.get(params, 'locations', '').split(','),
    (loc: string) => loc.length > 0,
  );

  if (locations.length > 0) {
    return `${filtering.filter_operator}${filtering.param_assign_operator}${
      filtering.country
    }${filtering.in}(${locations.join(filtering.multi_param_separator)})&`;
  }
  return '';
}

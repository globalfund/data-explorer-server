import _ from 'lodash';
import filtering from '../../../config/filtering/index.json';
import filteringPledgesContributions from '../../../config/filtering/pledgescontributions.json';
import PledgesContributionsTimeCycleFieldsMapping from '../../../config/mapping/pledgescontributions/timeCycle.json';

export function getFilterString(params: any, aggregationString?: string) {
  let str = '';

  const donors = _.filter(
    _.get(params, 'donors', '').split(','),
    (loc: string) => loc.length > 0,
  ).map((donor: string) => `'${donor}'`);
  if (donors.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringPledgesContributions.donors
    }${filtering.in}(${donors.join(filtering.multi_param_separator)})`;
  } else {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringPledgesContributions.donors
    }${filtering.in}(${
      PledgesContributionsTimeCycleFieldsMapping.defaultDonorFilter
    })`;
  }

  const periods = _.filter(
    _.get(params, 'periods', '').split(','),
    (period: string) => period.length > 0,
  ).map((period: string) => `'${period}'`);
  if (periods.length > 0) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringPledgesContributions.period
    }${filtering.in}(${periods.join(filtering.multi_param_separator)})`;
  }

  if (_.get(params, 'levelParam', '').length > 0) {
    const lParam = _.get(params, 'levelParam', '').split('-');
    if (lParam.length === 1 || lParam.length > 2) {
      str += `${str.length > 0 ? ' AND ' : ''}${_.get(
        lParam,
        '[0]',
        '',
      )}-${_.get(lParam, '[1]', '')}`;
    }
  }

  if (str.length > 0) {
    if (aggregationString) {
      str = aggregationString.replace('<filterString>', ` AND ${str}`);
    }
  } else if (aggregationString) {
    str = aggregationString.replace('<filterString>', '');
  }

  return str;
}

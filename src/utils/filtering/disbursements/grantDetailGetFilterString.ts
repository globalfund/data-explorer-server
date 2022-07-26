import _ from 'lodash';
import filteringGrantDetailDisbursements from '../../../config/filtering/grantDetailDisbursements.json';
import filteringGrantDetailTreemapDisbursements from '../../../config/filtering/grantDetailTreemapDisbursements.json';
import filtering from '../../../config/filtering/index.json';

export function grantDetailGetFilterString(
  params: any,
  aggregationString?: string,
) {
  let str = '';

  const grantId = _.get(params, 'grantId', null);
  if (grantId) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrantDetailDisbursements.grantId
    }${filtering.eq}${grantId}`;
  }

  const IPnumber = _.get(params, 'IPnumber', null);
  if (IPnumber) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrantDetailDisbursements.IPnumber
    }${filtering.eq}${IPnumber}`;
  }

  if (str.length > 0) {
    str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
    if (aggregationString) {
      str = aggregationString.replace(
        '<filterString>',
        `${str
          .replace(
            `${filtering.filter_operator}${filtering.param_assign_operator}`,
            'filter(',
          )
          .replace('&', ')/')}`,
      );
    }
  } else if (aggregationString) {
    str = aggregationString.replace('<filterString>', '');
  }

  return str;
}

export function grantDetailTreemapGetFilterString(
  params: any,
  aggregationString?: string,
) {
  let str = '';

  const grantId = _.get(params, 'grantId', null);
  if (grantId) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrantDetailTreemapDisbursements.grantId
    }${filtering.eq}${grantId}`;
  }

  const IPnumber = _.get(params, 'IPnumber', null);
  if (IPnumber) {
    str += `${str.length > 0 ? ' AND ' : ''}${
      filteringGrantDetailTreemapDisbursements.IPnumber
    }${filtering.eq}${IPnumber}`;
  }

  if (str.length > 0) {
    str = `${filtering.filter_operator}${filtering.param_assign_operator}${str}&`;
    if (aggregationString) {
      str = aggregationString.replace(
        '<filterString>',
        `${str
          .replace(
            `${filtering.filter_operator}${filtering.param_assign_operator}`,
            'filter(',
          )
          .replace('&', ')/')}`,
      );
    }
  } else if (aggregationString) {
    str = aggregationString.replace('<filterString>', '');
  }

  return str;
}

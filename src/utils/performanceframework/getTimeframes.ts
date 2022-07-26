import _ from 'lodash/';
import moment from 'moment';

export function getTimeframes(rawData: any) {
  let timeframes: any[] = [];
  rawData.forEach((item: any) => {
    if (item.startDate) timeframes.push(item.startDate);
    if (item.endDate) timeframes.push(item.endDate);
  });
  timeframes = _.uniq(timeframes);
  timeframes = timeframes.map(tf => {
    return {
      raw: tf,
      formatted: moment(tf).format('MMM, YYYY'),
      number: new Date(tf).getTime(),
    };
  });
  timeframes = _.sortBy(timeframes, 'number');
  return timeframes;
}

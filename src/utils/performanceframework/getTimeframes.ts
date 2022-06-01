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

export function getTimeframeGroups(rawData: any) {
  let timeframes: any[] = [];
  rawData.forEach((item: any) => {
    if (item.startDate && item.endDate) {
      timeframes.push({
        start: item.startDate,
        startFormatted: moment(item.startDate).format('MMM, YYYY'),
        end: item.endDate,
        endFormatted: moment(item.endDate).format('MMM, YYYY'),
        number:
          new Date(item.startDate).getTime() + new Date(item.endDate).getTime(),
      });
    }
  });
  timeframes = _.uniqBy(timeframes, 'number');
  timeframes = _.orderBy(timeframes, 'number', 'asc');
  return timeframes;
}

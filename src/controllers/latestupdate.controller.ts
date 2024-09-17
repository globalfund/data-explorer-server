import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import LatestUpdateMapping from '../config/mapping/latestupdate/index.json';

export class LatestUpdateController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/latest-update')
  @response(200)
  async latestUpdate() {
    const responses = await Promise.all(
      LatestUpdateMapping.datasets.map(dataset => axios.get(dataset.url)),
    );

    const data = responses.map((response, index) => {
      const updated = _.get(
        response,
        `data.${LatestUpdateMapping.dataPath}[${LatestUpdateMapping.updated}]`,
        '',
      );
      const created = _.get(
        response,
        `data.${LatestUpdateMapping.dataPath}[${LatestUpdateMapping.created}]`,
        '',
      );
      return {
        name: _.get(LatestUpdateMapping.datasets, `[${index}].name`, ''),
        date: moment(updated ?? created).format('DD MMMM YYYY'),
      };
    });

    return {data};
  }
}

import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import LatestUpdateMapping from '../config/mapping/latestupdate/index.json';
import urls from '../config/urls/index.json';

export class LatestUpdateController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/latest-update')
  @response(200)
  async latestUpdate() {
    const resp = await axios.get(urls.DATASET_INFORMATION);
    const rawData = _.get(resp.data, LatestUpdateMapping.dataPath, []);

    const data = LatestUpdateMapping.datasets.map(dataset => {
      const fDataset = _.find(rawData, {
        [LatestUpdateMapping.dataset]: dataset.datasetLabel,
      });
      const updated = _.get(fDataset, `[${LatestUpdateMapping.updated}]`, '');
      return {
        name: dataset.name,
        date: moment(updated).format('DD MMMM YYYY'),
      };
    });

    return {data};
  }
}

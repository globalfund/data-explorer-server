import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import fs from 'fs-extra';
import urls from '../../config/urls/index.json';
import {handleDataApiError} from '../../utils/dataApiError';

export class BudgetsDatasetController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/budgets-dataset')
  @response(200)
  flow(): object {
    const url = `${urls.budgets}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        let dataTypes = {};
        const filterOptionGroups: any = [];
        const data = resp.data.value;
        console.log(data, 'data');
        const element = data[0];
        Object.keys(element).forEach(key => {
          if (element[key]) {
            filterOptionGroups.push(key);
            dataTypes = {
              ...dataTypes,
              [key]: typeof element[key],
            };
          }
        });
        const body = {
          count: resp.data.value.length,
          dataset: resp.data.value,
          sample: resp.data.value,
          dataTypes,
          errors: [],
          filterOptionGroups,
          stats: [],
        };
        fs.writeFileSync(
          `./src/parsed-data-files/budgets-dataset.json`,
          JSON.stringify(body, null, 4),
        );

        return body;
      })
      .catch(handleDataApiError);
  }
}

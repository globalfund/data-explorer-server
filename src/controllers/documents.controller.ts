import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError, AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import docsMap from '../config/mapping/documents/index.json';
import docsUtils from '../config/mapping/documents/utils.json';
import urls from '../config/urls/index.json';
import {DocumentsTableRow} from '../interfaces/documentsTable';
import {getFilterString} from '../utils/filtering/documents/getFilterString';

const RESULTS_RESPONSE: ResponseObject = {
  description: 'Results Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'Results Response',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                title: {type: 'string'},
                value: {type: 'number'},
                component: {type: 'string'},
                geoLocations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {type: 'string'},
                      value: {type: 'number'},
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export class DocumentsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/documents')
  @response(200, RESULTS_RESPONSE)
  documents(): object {
    const mapper = mapTransform(docsMap);
    const filterString = getFilterString(
      this.req.query,
      docsUtils.defaultFilter,
    );
    // const params = querystring.stringify(
    //   {
    //     ...getPage(filtering.page, parseInt(page, 10), parseInt(pageSize, 10)),
    //     [filtering.page_size]: pageSize,
    //   },
    //   '&',
    //   filtering.param_assign_operator,
    //   {
    //     encodeURIComponent: (str: string) => str,
    //   },
    // );
    const url = `${urls.documents}/?${docsUtils.defaultSelect}${docsUtils.defaultOrderBy}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        const data: DocumentsTableRow[] = [];

        const countryDocs = _.filter(
          mappedData,
          (doc: any) =>
            doc.organizationId ||
            doc.organizationId === '00000000-0000-0000-0000-000000000000',
        );
        // const multicountryDocs = _.filter(
        //   mappedData,
        //   (doc: any) =>
        //     doc.organizationId &&
        //     doc.organizationId !== '00000000-0000-0000-0000-000000000000',
        // );
        const groupedByCountry = _.groupBy(countryDocs, 'country');
        _.orderBy(Object.keys(groupedByCountry), undefined, 'asc').forEach(
          (country: string) => {
            const groupedByCategory = _.groupBy(
              groupedByCountry[country],
              'category',
            );
            const docCategories: any[] = [];
            _.orderBy(Object.keys(groupedByCategory), undefined, 'asc').forEach(
              (category: string) => {
                docCategories.push({
                  name: category,
                  count: groupedByCategory[category].length,
                  docs: groupedByCategory[category].map((item: any) => {
                    let title = '';
                    if (item.processName)
                      title = `${title} ${item.processName}`;
                    if (item.component) title = `${title} ${item.component}`;
                    if (item.processYear && item.processWindow) {
                      title = `${title} - ${item.processYear} ${item.processWindow}`;
                    } else if (item.processYear) {
                      title = `${title} - ${item.processYear}`;
                    } else if (item.processWindow) {
                      title = `${title} - ${item.processWindow}`;
                    }
                    return {
                      title,
                      link: item.fileURL,
                    };
                  }),
                });
              },
            );
            data.push({
              name: country,
              count: groupedByCountry[country].length,
              docCategories,
            });
          },
        );
        return {
          count: data.length,
          data,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}

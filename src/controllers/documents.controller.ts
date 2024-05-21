import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import docsMap from '../config/mapping/documents/index.json';
import DocumentsListMapping from '../config/mapping/documents/list.json';
import docsUtils from '../config/mapping/documents/utils.json';
import urls from '../config/urls/index.json';
import {DocumentsTableRow} from '../interfaces/documentsTable';
import {handleDataApiError} from '../utils/dataApiError';
import {filterDocuments} from '../utils/filtering/documents';
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

  // v3

  @get('/documents')
  @response(200)
  async documents() {
    const filterString = filterDocuments(
      this.req.query,
      DocumentsListMapping.urlParams,
    );
    const url = `${urls.DOCUMENTS}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, DocumentsListMapping.dataPath, []);

        const groupedByLocation = _.groupBy(
          raw,
          DocumentsListMapping.geography,
        );

        return {
          data: _.map(groupedByLocation, (value, key) => {
            const groupedByType = _.groupBy(value, DocumentsListMapping.type);

            return {
              name: key,
              documents: Object.keys(value).length,
              _children: _.map(groupedByType, (value1, key) => ({
                name: key,
                documents: Object.keys(value1).length,
                _children: _.map(value1, value2 => ({
                  name: _.get(value2, DocumentsListMapping.title, ''),
                  documents: _.get(value2, DocumentsListMapping.url, ''),
                })),
              })),
            };
          }),
        };
      })
      .catch(handleDataApiError);
  }

  // v2

  @get('/v2/documents')
  @response(200, RESULTS_RESPONSE)
  documentsV2(): object {
    const mapper = mapTransform(docsMap);
    const filterString = getFilterString(
      this.req.query,
      docsUtils.defaultFilter,
    );
    const url = `${urls.documents}/?${docsUtils.defaultSelect}${docsUtils.defaultOrderBy}${filterString}`;

    console.log(url);

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        const data: DocumentsTableRow[] = [];

        const countryDocs = _.filter(
          mappedData,
          (doc: any) =>
            doc.country &&
            (!doc.organizationId ||
              doc.organizationId === '00000000-0000-0000-0000-000000000000'),
        );
        const multicountryDocs = _.filter(
          mappedData,
          (doc: any) =>
            doc.organizationId &&
            doc.organizationId !== '00000000-0000-0000-0000-000000000000' &&
            doc.organizationName,
        );
        const groupedByCountry = _.groupBy(countryDocs, 'country');
        Object.keys(groupedByCountry).forEach((country: string) => {
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
                  if (item.processName) title = `${title} ${item.processName}`;
                  if (item.component) title = `${title} ${item.component}`;
                  if (item.processYear && item.processWindow) {
                    title = `${title} - ${item.processYear} ${item.processWindow}`;
                  } else if (item.processYear) {
                    title = `${title} - ${item.processYear}`;
                  } else if (item.processWindow) {
                    title = `${title} - ${item.processWindow}`;
                  }
                  if (item.fileLanguage) {
                    title = `${title} - ${item.fileLanguage}`;
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
        });
        const groupedByMulticountry = _.groupBy(
          multicountryDocs,
          'organizationName',
        );
        _.orderBy(Object.keys(groupedByMulticountry), undefined, 'asc').forEach(
          (country: string) => {
            const groupedByCategory = _.groupBy(
              groupedByMulticountry[country],
              'category',
            );
            const docCategories: any[] = [];
            Object.keys(groupedByCategory).forEach((category: string) => {
              docCategories.push({
                name: category,
                count: groupedByCategory[category].length,
                docs: groupedByCategory[category].map((item: any) => {
                  let title = '';
                  if (item.processName) title = `${title} ${item.processName}`;
                  if (item.component) title = `${title} ${item.component}`;
                  if (item.processYear && item.processWindow) {
                    title = `${title} - ${item.processYear} ${item.processWindow}`;
                  } else if (item.processYear) {
                    title = `${title} - ${item.processYear}`;
                  } else if (item.processWindow) {
                    title = `${title} - ${item.processWindow}`;
                  }
                  if (item.fileLanguage) {
                    title = `${title} - ${item.fileLanguage}`;
                  }
                  return {
                    title,
                    link: item.fileURL,
                  };
                }),
              });
            });
            data.push({
              name: country,
              count: groupedByMulticountry[country].length,
              docCategories,
            });
          },
        );
        return {
          count: data.length,
          data: _.orderBy(data, 'name', 'asc'),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant-documents')
  @response(200, RESULTS_RESPONSE)
  grantDocuments(): object {
    const mapper = mapTransform(docsMap);
    const filterString = getFilterString(this.req.query);
    const url = `${urls.documents}/?${docsUtils.defaultSelect}${docsUtils.defaultOrderBy}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        const data: DocumentsTableRow[] = [];

        const groupedByCategory = _.groupBy(mappedData, 'category');
        _.orderBy(Object.keys(groupedByCategory), undefined, 'asc').forEach(
          (category: string) => {
            data.push({
              name: category,
              count: groupedByCategory[category].length,
              docs: _.orderBy(
                groupedByCategory[category].map((item: any) => ({
                  title: `${item.processName}${
                    item.fileIndex ? ` - ${item.fileIndex}` : ''
                  }`,
                  link: item.fileURL,
                })),
                'title',
                'asc',
              ),
            });
          },
        );
        return {
          count: data.length,
          data,
        };
      })
      .catch(handleDataApiError);
  }
}

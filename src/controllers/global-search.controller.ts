import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import globalSearchMapping from '../config/mapping/globalsearch/index.json';
import {SearchResultsTabModel} from '../interfaces/globalSearch';
import {buildGlobalSearchFilterString} from '../utils/filtering/globalsearch';
import {stringReplaceKeyValue} from '../utils/stringReplaceKeyValue';

const GLOBAL_SEARCH_RESPONSE: ResponseObject = {
  description: 'Global Search Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'GlobalSearchResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                title: {type: 'string'},
                status: {type: 'string'},
                component: {type: 'string'},
                geoLocation: {type: 'string'},
                rating: {type: 'string'},
                disbursed: {type: 'number'},
                committed: {type: 'number'},
                signed: {type: 'number'},
              },
            },
          },
        },
      },
    },
  },
};

export class GlobalSearchController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/global-search')
  @response(200, GLOBAL_SEARCH_RESPONSE)
  globalSearch(): object {
    const keyword = (this.req.query.q ?? '').toString().trim();
    if (keyword.length === 0) {
      return {
        data: [],
        message: '"q" param is required.',
      };
    }
    const keywords = keyword.split(' ');
    const calls = _.filter(
      globalSearchMapping.categories,
      (category: any) => category.url.length > 0,
    ).map((category: any) => {
      return axios.get(
        category.url
          .replace(
            '<filterStr>',
            buildGlobalSearchFilterString(
              category.filterFields,
              category.filterTemplate,
              keywords,
            ),
          )
          .replace('<keyword>', keyword),
      );
    });
    return axios
      .all(calls)
      .then(
        axios.spread((...responses) => {
          const results: SearchResultsTabModel[] = [];
          globalSearchMapping.categories.map((cat: any, index: number) => {
            const mapper = mapTransform(cat.mappings);
            const categoryResults =
              cat.url.length > 0
                ? (mapper(responses[index].data) as never[]).map(
                    (item: any) => ({
                      type: cat.type === '<type>' ? item.type : cat.type,
                      label:
                        cat.itemname.length > 0
                          ? stringReplaceKeyValue(cat.itemname, item)
                          : item.name,
                      value: item.code,
                      link: cat.link.replace('<code>', item.code),
                    }),
                  )
                : _.filter(
                    cat.options,
                    (option: any) =>
                      option.type.toLowerCase().indexOf(keyword.toLowerCase()) >
                        -1 ||
                      option.value
                        .toLowerCase()
                        .indexOf(keyword.toLowerCase()) > -1 ||
                      _.find(
                        option.terms,
                        (term: string) =>
                          term.toLowerCase().indexOf(keyword.toLowerCase()) >
                          -1,
                      ),
                  );
            results.push({
              name: cat.name,
              results: categoryResults,
            });
          });
          return {
            data: results,
          };
        }),
      )
      .catch((error: AxiosError) => console.error(error));
  }
}

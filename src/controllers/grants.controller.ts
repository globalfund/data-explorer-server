import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import {getPage} from '../config/filtering/utils';
import GrantMapping from '../config/mapping/grants/grant.json';
import GrantImplementationMapping from '../config/mapping/grants/grantImplementation.json';
import GrantOverviewMapping from '../config/mapping/grants/grantOverview.json';
import GrantsListMapping from '../config/mapping/grants/list.json';
import GrantTargetsResultsMapping from '../config/mapping/grants/targetsResults.json';
import urls from '../config/urls/index.json';
import {GrantListItemModel} from '../interfaces/grantList';
import {handleDataApiError} from '../utils/dataApiError';
import {filterGrants} from '../utils/filtering/grants';

export class GrantsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/grants/{page}/{pageSize}')
  @response(200)
  async grants(
    @param.path.string('page') page: string,
    @param.path.string('pageSize') pageSize: string,
  ) {
    const mapper = mapTransform(GrantsListMapping.map);
    const params = querystring.stringify(
      {
        ...getPage(filtering.page, parseInt(page, 10), parseInt(pageSize, 10)),
        [filtering.page_size]: pageSize,
      },
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const filterString = filterGrants(
      this.req.query,
      GrantsListMapping.urlParams,
    );
    const url = `${urls.GRANTS}${filterString}&${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantListItemModel[] = mapper(resp.data) as never[];
        res.forEach(item => {
          item.percentage = Math.round((item.disbursed / item.committed) * 100);
        });
        return {
          count: _.get(resp.data, GrantsListMapping.count, 0),
          data: res,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant/{id}')
  @response(200)
  async grant(@param.path.string('id') id: string) {
    const url = `${urls.GRANTS}/${GrantMapping.urlParams.replace(
      '<code>',
      id,
    )}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantMapping.dataPath, {});
        return {
          data: [
            {
              code: _.get(raw, GrantMapping.code, ''),
              title: _.get(
                _.get(raw, GrantMapping.titleArray, []),
                `[0].${GrantMapping.title.text}`,
                '',
              ),
              periods: _.orderBy(
                _.get(raw, GrantMapping.implementationPeriodArray, []),
                [GrantMapping.implementationPeriodFrom],
                ['asc'],
              ).map((p, index: number) => ({
                code: index + 1,
                name: `Implementation Period ${_.get(
                  p,
                  GrantMapping.implementationPeriodFrom,
                  '',
                )}-${_.get(p, GrantMapping.implementationPeriodTo, '')}`,
                title: _.get(p, GrantMapping.implementationPeriodTitle, ''),
              })),
              countryName: _.get(raw, GrantMapping.countryName, ''),
              countryCode: _.get(raw, GrantMapping.countryCode, ''),
              principalRecipientId: _.get(
                raw,
                GrantMapping.principalRecipientId,
                '',
              ),
              principalRecipientName: _.get(
                raw,
                GrantMapping.principalRecipientName,
                '',
              ),
              principalRecipientShortName: _.get(
                raw,
                GrantMapping.principalRecipientShortName,
                '',
              ),
              component: _.get(raw, GrantMapping.component, ''),
              FPMName: [
                _.get(raw, GrantMapping.FPMSalutation, ''),
                _.get(raw, GrantMapping.FPMFirstName, ''),
                _.get(raw, GrantMapping.FPMMiddleName, ''),
                _.get(raw, GrantMapping.FPMLastName, ''),
              ]
                .join(' ')
                .trim()
                .replace(/  /g, ' '),
              FPMEmail: _.get(raw, GrantMapping.FPMEmail, ''),
            },
          ],
        };
      })
      .catch(handleDataApiError);
  }

  @get('grant/{id}/{ip}/overview')
  @response(200)
  async grantOverview(
    @param.path.string('id') id: string,
    @param.path.string('ip') ip: number,
  ) {
    const url = `${urls.GRANTS}/${GrantOverviewMapping.urlParams.replace(
      '<code>',
      id,
    )}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantOverviewMapping.dataPath, {});
        const periods = _.orderBy(
          _.get(raw, GrantOverviewMapping.implementationPeriodArray, []),
          [GrantOverviewMapping.implementationPeriodFrom],
          ['asc'],
        );
        const period = _.find(periods, {
          [GrantOverviewMapping.implementationPeriod.code]: `${id}P0${ip}`,
        });
        const data: {
          status: string;
          goals: string[];
          objectives: string[];
          disbursement: number;
          commitment: number;
          signed: number;
          boardApprovedDate: string;
          dates: string[];
        } = {
          status: '',
          goals: [],
          objectives: [],
          disbursement: 0,
          commitment: 0,
          signed: 0,
          boardApprovedDate: '',
          dates: ['', ''],
        };
        if (period) {
          const narratives = _.orderBy(
            _.get(
              period,
              GrantOverviewMapping.implementationPeriod.narratives,
              [],
            ),
            [
              GrantOverviewMapping.implementationPeriod.narrative.index,
              GrantOverviewMapping.implementationPeriod.narrative.text,
            ],
            ['asc', 'asc'],
          );
          data.goals = _.filter(narratives, {
            [GrantOverviewMapping.implementationPeriod.narrative.type]:
              GrantOverviewMapping.implementationPeriod.narrative.types[0],
          }).map((n: any) =>
            _.get(
              n,
              GrantOverviewMapping.implementationPeriod.narrative.text,
              '',
            ),
          );
          data.objectives = _.filter(narratives, {
            [GrantOverviewMapping.implementationPeriod.narrative.type]:
              GrantOverviewMapping.implementationPeriod.narrative.types[1],
          }).map((n: any) =>
            _.get(
              n,
              GrantOverviewMapping.implementationPeriod.narrative.text,
              '',
            ),
          );
          data.status = _.get(
            period,
            GrantOverviewMapping.implementationPeriod.status,
            '',
          );
          const financialIndicators = _.get(
            period,
            GrantOverviewMapping.implementationPeriod.financialIndicators,
            [],
          );
          data.disbursement = _.sumBy(
            _.filter(financialIndicators, {
              [GrantOverviewMapping.implementationPeriod.financialIndicator
                .type]:
                GrantOverviewMapping.implementationPeriod.financialIndicator
                  .types[0].value,
            }),
            GrantOverviewMapping.implementationPeriod.financialIndicator.value,
          );
          data.commitment = _.sumBy(
            _.filter(financialIndicators, {
              [GrantOverviewMapping.implementationPeriod.financialIndicator
                .type]:
                GrantOverviewMapping.implementationPeriod.financialIndicator
                  .types[1].value,
            }),
            GrantOverviewMapping.implementationPeriod.financialIndicator.value,
          );
          data.signed = _.sumBy(
            _.filter(financialIndicators, {
              [GrantOverviewMapping.implementationPeriod.financialIndicator
                .type]:
                GrantOverviewMapping.implementationPeriod.financialIndicator
                  .types[2].value,
            }),
            GrantOverviewMapping.implementationPeriod.financialIndicator.value,
          );
          data.boardApprovedDate = moment(
            _.get(
              period,
              GrantOverviewMapping.implementationPeriod.boardApprovedDate,
              '',
            ),
          ).format('DD MMM YYYY');
          data.dates = [
            moment(
              _.get(
                period,
                GrantOverviewMapping.implementationPeriod.startDate,
                '',
              ),
            ).format('DD MMM YYYY'),
            moment(
              _.get(
                period,
                GrantOverviewMapping.implementationPeriod.endDate,
                '',
              ),
            ).format('DD MMM YYYY'),
          ];
        }
        return {data: [data]};
      })
      .catch(handleDataApiError);
  }

  @get('grant/{id}/{ip}/grant-implementation/radial')
  @response(200)
  async grantImplementationRadial(
    @param.path.string('id') id: string,
    @param.path.string('ip') ip: number,
  ) {
    let filterString = GrantImplementationMapping.radialUrlParams
      .replace('<code>', id)
      .replace('<code-ip>', `${id}P0${ip}`);
    if (this.req.query.cycle) {
      filterString = filterString.replace(
        '<filterString>',
        ` AND ${GrantImplementationMapping.cycle} eq '${this.req.query.cycle}'`,
      );
    } else {
      filterString = filterString.replace('<filterString>', '');
    }
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantImplementationMapping.dataPath, []);
        const groupedByName = _.groupBy(
          raw,
          GrantImplementationMapping.category,
        );
        const data: any = [];
        Object.keys(groupedByName).forEach((name: string, index: number) => {
          const value = _.sumBy(
            groupedByName[name],
            GrantImplementationMapping.value,
          );
          data.push({
            name: _.get(
              GrantImplementationMapping.categories,
              `["${name}"]`,
              name,
            ),
            value,
            itemStyle: {
              color: _.get(GrantImplementationMapping.colors, `[${index}]`, ''),
            },
          });
        });
        return data;
      })
      .catch(handleDataApiError);
  }

  @get('grant/{id}/{ip}/grant-implementation/bar')
  @response(200)
  async grantImplementationBar(
    @param.path.string('id') id: string,
    @param.path.string('ip') ip: number,
  ) {
    let filterString = GrantImplementationMapping.barUrlParams
      .replace('<code>', id)
      .replace('<code-ip>', `${id}P0${ip}`);
    if (this.req.query.cycle) {
      filterString = filterString.replace(
        '<filterString>',
        ` AND ${GrantImplementationMapping.cycle} eq '${this.req.query.cycle}'`,
      );
    } else {
      filterString = filterString.replace('<filterString>', '');
    }
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantImplementationMapping.dataPath, []);
        const data: {
          name: string;
          value: number;
          itemStyle: {color: string};
        }[] = [];

        _.orderBy(raw, [GrantImplementationMapping.date], ['asc']).forEach(
          (item: any, index: number) => {
            data.push({
              name: new Date(item[GrantImplementationMapping.date])
                .getFullYear()
                .toString(),
              value: item[GrantImplementationMapping.value],
              itemStyle: {
                color: '',
              },
            });
          },
        );

        const groupedByYear = _.groupBy(data, 'name');

        return {
          data: _.map(groupedByYear, (value, key) => ({
            name: key,
            value: _.sumBy(value, 'value'),
          })).map((item, index) => ({
            ...item,
            itemStyle: {
              color: _.get(
                GrantImplementationMapping.barColors,
                `[${index % GrantImplementationMapping.barColors.length}]`,
                '',
              ),
            },
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('grant/{id}/{ip}/grant-implementation/sankey/{variant}')
  @response(200)
  async grantImplementationSankey(
    @param.path.string('id') id: string,
    @param.path.string('ip') ip: number,
    @param.path.number('variant') variant: 1 | 2,
  ) {
    let category1 = GrantImplementationMapping.sankeyVariant1Category1;
    let category2 = GrantImplementationMapping.sankeyVariant1Category2;
    let urlParams = GrantImplementationMapping.sankeyVariant1UrlParams;
    let category3 = '';
    if (variant === 2) {
      category1 = GrantImplementationMapping.sankeyVariant2Category1;
      category2 = GrantImplementationMapping.sankeyVariant2Category2;
      urlParams = GrantImplementationMapping.sankeyVariant2UrlParams;
      category3 = GrantImplementationMapping.sankeyVariant2Category3;
    }
    let filterString = urlParams
      .replace('<code>', id)
      .replace('<code-ip>', `${id}P0${ip}`);
    if (this.req.query.cycle) {
      filterString = filterString.replace(
        '<filterString>',
        ` AND ${GrantImplementationMapping.cycle} eq '${this.req.query.cycle}'`,
      );
    } else {
      filterString = filterString.replace('<filterString>', '');
    }
    const url = `${urls.FINANCIAL_INDICATORS}/${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantImplementationMapping.dataPath, []);
        const data: {
          nodes: {
            name: string;
            level: number;
            itemStyle?: {color: string};
          }[];
          links: {
            source: string;
            target: string;
            value: number;
          }[];
        } = {
          nodes: [
            {
              name: 'Total budget',
              level: 0,
            },
          ],
          links: [],
        };
        const groupedByCategory1 = _.groupBy(raw, category1);
        Object.keys(groupedByCategory1).forEach((category1: string) => {
          const category1Items = _.get(
            groupedByCategory1,
            `["${category1}"]`,
            [],
          );
          data.nodes.push({
            name: category1,
            level: 1,
            itemStyle: {
              color: '#252C34',
            },
          });
          data.links.push({
            source: 'Total budget',
            target: category1,
            value: _.sumBy(
              category1Items,
              GrantImplementationMapping.sankeyValue,
            ),
          });
          const groupedByCategory2 = _.groupBy(category1Items, category2);
          Object.keys(groupedByCategory2).forEach((category2: string) => {
            const category2Items = _.get(
              groupedByCategory2,
              `["${category2}"]`,
              [],
            );
            const sameLevel1Category = _.find(
              data.nodes,
              node => node.name === category2 && node.level === 1,
            );
            const name = `${category2}${sameLevel1Category ? ' (1)' : ''}`;
            data.nodes.push({
              name,
              level: 2,
              itemStyle: {
                color: '#252C34',
              },
            });
            data.links.push({
              source: category1,
              target: name,
              value: _.sumBy(
                category2Items,
                GrantImplementationMapping.sankeyValue,
              ),
            });
            if (category3) {
              const groupedByCategory3 = _.groupBy(category2Items, category3);
              Object.keys(groupedByCategory3).forEach((category3: string) => {
                const category3Items = _.get(
                  groupedByCategory3,
                  `["${category3}"]`,
                  [],
                );
                const sameLevel1Or2Category = _.find(
                  data.nodes,
                  node =>
                    node.name === category3 &&
                    (node.level === 1 || node.level === 2),
                );
                const existingCategoryIndex = _.findIndex(
                  data.nodes,
                  node => node.name === category3 && node.level === 3,
                );
                if (existingCategoryIndex === -1) {
                  const name = `${category3}${
                    sameLevel1Or2Category ? ' (1)' : ''
                  }`;
                  data.nodes.push({
                    name,
                    level: 3,
                    itemStyle: {
                      color: '#252C34',
                    },
                  });

                  data.links.push({
                    source: category2,
                    target: name,
                    value: _.sumBy(
                      category3Items,
                      GrantImplementationMapping.sankeyValue,
                    ),
                  });
                } else {
                  data.links.push({
                    source: category2,
                    target: category3,
                    value: _.sumBy(
                      category3Items,
                      GrantImplementationMapping.sankeyValue,
                    ),
                  });
                }
              });
            }
          });
        });
        return {data: [data]};
      })
      .catch(handleDataApiError);
  }

  @get('/grant/{id}/{ip}/targets-results')
  @response(200)
  async grantTargetsResults(
    @param.path.string('id') id: string,
    @param.path.string('ip') ip: number,
  ) {
    const type = _.get(this.req.query, 'type', 'Impact indicator') as string;
    const url = `${
      urls.PROGRAMMATIC_INDICATORS
    }/${GrantTargetsResultsMapping.urlParams
      .replace('<grantIP>', `${id}P0${ip}`)
      .replace('<type>', type)}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const raw = _.get(resp.data, GrantTargetsResultsMapping.dataPath, []);

        const groupedByModule = _.groupBy(
          raw,
          GrantTargetsResultsMapping.module,
        );

        const data: any[] = [];

        let years: string[] = [];

        if (type === 'Coverage / Output indicator') {
          _.forEach(raw, (item: any) => {
            item.targetValueYear = moment(
              _.get(item, GrantTargetsResultsMapping.startDate, ''),
            ).get('year');
          });
        }

        _.map(groupedByModule, (moduleItems, key) => {
          const item: any = {
            name: key,
            _children: [],
          };

          const groupedByName = _.groupBy(
            moduleItems,
            GrantTargetsResultsMapping.name,
          );

          _.map(groupedByName, (nameItems, key2) => {
            const subItem: any = {
              name: key2,
              _children: [],
            };

            _.map(nameItems, item => {
              const groupedByYear = _.groupBy(
                nameItems,
                GrantTargetsResultsMapping.year,
              );
              years = [...years, ...Object.keys(groupedByYear)];
              years = _.filter(
                _.uniq(years),
                year => year !== 'null' && year !== 'NaN',
              );
              let itempush = {
                reversed:
                  _.get(item, GrantTargetsResultsMapping.reversed, false) ===
                  true
                    ? 'Yes'
                    : 'No',
                geoCoverage: _.get(
                  item,
                  GrantTargetsResultsMapping.geoCoverage,
                  '',
                ),
                cumulation: _.get(
                  item,
                  GrantTargetsResultsMapping.cumulation,
                  '',
                ),
                baselineValue: _.get(
                  item,
                  GrantTargetsResultsMapping.baselineValue,
                  '',
                ),
                baselineYear: _.get(
                  item,
                  GrantTargetsResultsMapping.baselineYear,
                  '',
                ),
                baselineSource: _.get(
                  item,
                  GrantTargetsResultsMapping.baselineSource,
                  '',
                ),
              };
              _.forEach(groupedByYear, (yearItems, key3) => {
                itempush = {
                  ...itempush,
                  [key3]: yearItems.map((yearItem: any) => {
                    const target = _.get(
                      yearItem,
                      GrantTargetsResultsMapping.target,
                      '',
                    );
                    const result = _.get(
                      yearItem,
                      GrantTargetsResultsMapping.result,
                      '',
                    );
                    const achievement = _.get(
                      yearItem,
                      GrantTargetsResultsMapping.achievement,
                      '',
                    );
                    return {
                      target: target ? `T:${target}%` : '',
                      result: result ? `T:${result}%` : '',
                      achievement: achievement ? `${achievement}%` : '',
                    };
                  }),
                };
              });
              subItem._children.push(itempush);
            });

            item._children.push(subItem);
          });

          data.push(item);
        });

        return {
          data:
            type === 'Coverage / Output indicator'
              ? data
              : _.get(data, '[0]._children', []),
          years,
        };
      })
      .catch(handleDataApiError);
  }
}

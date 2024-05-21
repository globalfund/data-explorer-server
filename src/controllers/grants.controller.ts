import {inject} from '@loopback/core';
import {
  get,
  param,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import {getPage} from '../config/filtering/utils';
import GrantMapping from '../config/mapping/grants/grant.json';
import grantDetailMap from '../config/mapping/grants/grantDetail.json';
import grantDetailUtils from '../config/mapping/grants/grantDetail.utils.json';
import GrantImplementationMapping from '../config/mapping/grants/grantImplementation.json';
import GrantOverviewMapping from '../config/mapping/grants/grantOverview.json';
import grantPeriodGoalsObjectivesMap from '../config/mapping/grants/grantPeriodGoalsObjectives.json';
import grantPeriodInfoMap from '../config/mapping/grants/grantPeriodInfo.json';
import grantPeriodsMap from '../config/mapping/grants/grantPeriods.json';
import GrantsRadialMapping from '../config/mapping/grants/grantsRadial.json';
import grantsMap from '../config/mapping/grants/index.json';
import GrantsListMapping from '../config/mapping/grants/list.json';
import grantsUtils from '../config/mapping/grants/utils.json';
import urls from '../config/urls/index.json';
import {
  GrantDetailInformation,
  GrantDetailPeriod,
  GrantDetailPeriodInformation,
} from '../interfaces/grantDetail';
import {
  GrantListItemModel,
  GrantListItemModelV2,
} from '../interfaces/grantList';
import {handleDataApiError} from '../utils/dataApiError';
import {filterGrants} from '../utils/filtering/grants';
import {getFilterString} from '../utils/filtering/grants/getFilterString';
import {getFilterString as getFilterStringPF} from '../utils/filtering/performancerating/getFilterString';

const GRANTS_RESPONSE: ResponseObject = {
  description: 'Grants Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'GrantsResponse',
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

export class GrantsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

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
                name: `Implementation Period ${index + 1}`,
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
        const period = periods[ip - 1];
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
          ).format('DD/MM/YYYY - hh:mm A');
          data.dates = [
            moment(
              _.get(
                period,
                GrantOverviewMapping.implementationPeriod.startDate,
                '',
              ),
            ).format('DD/MM/YYYY hh:mm A'),
            moment(
              _.get(
                period,
                GrantOverviewMapping.implementationPeriod.endDate,
                '',
              ),
            ).format('DD/MM/YYYY hh:mm A'),
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

  // v2

  @get('/grants')
  @response(200, GRANTS_RESPONSE)
  grantsV2(): object {
    const mapper = mapTransform(grantsMap);
    const page = (this.req.query.page ?? '1').toString();
    const pageSize = (this.req.query.pageSize ?? '10').toString();
    const orderBy = this.req.query.orderBy ?? grantsUtils.defaultOrderBy;
    const filterString = getFilterString(this.req.query);
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
    const url = `${urls.grants}${filterString}${filtering.orderby}${
      filtering.param_assign_operator
    }${orderBy}${parseInt(pageSize, 10) > 0 ? `&${params}` : ''}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantListItemModelV2[] = mapper(resp.data) as never[];
        return {
          count: resp.data[grantsUtils.countPath],
          data: res,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant/detail')
  @response(200, GRANTS_RESPONSE)
  grantDetail(): object {
    const grantNumber = _.get(this.req.query, 'grantNumber', null);
    if (!grantNumber) {
      return {
        data: {},
        message: '"grantNumber" parameter is required.',
      };
    }
    const mapper = mapTransform(grantDetailMap);
    const url = `${urls.grantsNoCount}/?$top=1&$filter=${grantDetailUtils.grantNumber} eq '${grantNumber}'`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantDetailInformation[] = mapper(resp.data) as never[];
        return {
          data: res,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant/periods')
  @response(200, GRANTS_RESPONSE)
  grantDetailPeriods(): object {
    const grantNumber = _.get(this.req.query, 'grantNumber', null);
    if (!grantNumber) {
      return {
        data: {},
        message: '"grantNumber" parameter is required.',
      };
    }
    const mapper = mapTransform(grantPeriodsMap);
    const url = `${urls.grantPeriods}/?${grantDetailUtils.defaultSelectFields}${grantDetailUtils.defaultSort}$filter=${grantDetailUtils.periodGrantNumber} eq '${grantNumber}'`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const res: GrantDetailPeriod[] = mapper(resp.data) as never[];
        return {
          data: res.map((period: GrantDetailPeriod) => ({
            ...period,
            startDate: period.startDate.split('T')[0],
            endDate: period.endDate.split('T')[0],
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant/period/info')
  @response(200, GRANTS_RESPONSE)
  grantDetailPeriodInfo(): object {
    const grantNumber = _.get(this.req.query, 'grantNumber', null);
    const IPnumber = _.get(this.req.query, 'IPnumber', null);
    if (!grantNumber && !IPnumber) {
      return {
        data: [],
        message: '"grantId" and "IPnumber" parameters is required.',
      };
    }
    const mapper = mapTransform(grantPeriodInfoMap);
    const financialUrl = `${urls.grantPeriods}/?${grantDetailUtils.periodInfoSelectFields}$filter=${grantDetailUtils.periodGrantNumber} eq '${grantNumber}' and ${grantDetailUtils.periodNumber} eq ${IPnumber}`;
    const ratingUrl = `${urls.performancerating}/?${grantDetailUtils.periodInfoRatingSelectFields}${grantDetailUtils.periodInfoRatingPageSize}${grantDetailUtils.periodInfoRatingExpand}${grantDetailUtils.periodInfoRatingSort}$filter=${grantDetailUtils.periodInfoRatingGrantNumber} eq '${grantNumber}' and ${grantDetailUtils.periodInfoRatingPeriodNumber} eq ${IPnumber}${grantDetailUtils.periodInfoRatingExtraFilter}`;

    return axios
      .all([axios.get(financialUrl), axios.get(ratingUrl)])
      .then(
        axios.spread((...responses) => {
          const respData = [
            {
              ..._.get(
                responses[0].data,
                grantDetailUtils.periodInfoDataPath,
                {},
              ),
              ..._.get(
                responses[1].data,
                grantDetailUtils.periodInfoDataPath,
                {},
              ),
            },
          ];
          const res: GrantDetailPeriodInformation[] = mapper(
            respData,
          ) as never[];
          return {
            data: res,
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/grants/radial')
  @response(200, GRANTS_RESPONSE)
  grantsRadial(): object {
    const filterString = getFilterString(this.req.query);
    const filterStringPF = getFilterStringPF(this.req.query);
    const grantsUrl = `${urls.grantsNoCount}/?${filterString}${GrantsRadialMapping.grantAgreementsSelect}`;
    const periodsUrl = `${urls.vgrantPeriods}/?${filterString}${GrantsRadialMapping.implementationPeriodsSelect}`;
    const ipRatingUrl = `${urls.performancerating}/?${filterStringPF}${GrantsRadialMapping.ipRatingDefaultExpand}${GrantsRadialMapping.ipRatingDefaultOrderBy}`;

    return axios
      .all([
        axios.get(periodsUrl),
        axios.get(grantsUrl),
        axios.get(ipRatingUrl),
      ])
      .then(
        axios.spread((...responses) => {
          const periodsData = _.get(
            responses[0].data,
            GrantsRadialMapping.dataPath,
            [],
          );
          const grantsData = _.get(
            responses[1].data,
            GrantsRadialMapping.dataPath,
            [],
          );
          const ipRatingData = _.get(
            responses[2].data,
            GrantsRadialMapping.dataPath,
            [],
          );
          const groupedGrants = _.groupBy(
            periodsData,
            GrantsRadialMapping.name,
          );
          const results: any[] = [];
          Object.keys(groupedGrants).forEach(grant => {
            const items = groupedGrants[grant];
            const fGrant = _.find(grantsData, {
              grantAgreementNumber: grant,
            });
            results.push({
              title: _.get(fGrant, GrantsRadialMapping.title, ''),
              name: _.get(items[0], GrantsRadialMapping.name, ''),
              years: [
                parseInt(
                  _.get(items[0], GrantsRadialMapping.start, '').slice(0, 4),
                  10,
                ),
                parseInt(
                  _.get(items[0], GrantsRadialMapping.end, '').slice(0, 4),
                  10,
                ),
              ],
              value: _.sumBy(items, GrantsRadialMapping.value),
              component: _.get(items[0], GrantsRadialMapping.component, ''),
              status: _.get(items[0], GrantsRadialMapping.status, ''),
              rating: _.get(fGrant, GrantsRadialMapping.rating, 'None'),
              implementationPeriods: _.sortBy(
                items.map(item => {
                  const fRatingData = _.find(
                    ipRatingData,
                    (ipRatingDataItem: any) => {
                      return (
                        _.get(
                          ipRatingDataItem,
                          GrantsRadialMapping.ipRatingGrantNumber,
                          null,
                        ) === _.get(items[0], GrantsRadialMapping.name, '') &&
                        _.get(
                          ipRatingDataItem,
                          GrantsRadialMapping.ipRatingPeriodNumber,
                          null,
                        ) === _.get(item, GrantsRadialMapping.ipNumber, '') &&
                        _.get(
                          ipRatingDataItem,
                          GrantsRadialMapping.ipRatingValue,
                          null,
                        ) !== null
                      );
                    },
                  );
                  return {
                    name: _.get(item, GrantsRadialMapping.ipNumber, ''),
                    years: [
                      parseInt(
                        _.get(item, GrantsRadialMapping.ipStart, '').slice(
                          0,
                          4,
                        ),
                        10,
                      ),
                      parseInt(
                        _.get(item, GrantsRadialMapping.ipEnd, '').slice(0, 4),
                        10,
                      ),
                    ],
                    value: _.get(item, GrantsRadialMapping.value, ''),
                    status: _.get(item, GrantsRadialMapping.ipStatus, ''),
                    rating: _.get(
                      fRatingData,
                      GrantsRadialMapping.ipRatingValue,
                      'None',
                    ),
                  };
                }),
                'name',
              ),
            });
          });
          return {
            data: results,
          };
        }),
      )
      .catch(handleDataApiError);
  }

  @get('/grant-cycles')
  @response(200)
  grantCycles(): object {
    return axios
      .get(urls.grantCycles)
      .then(resp => {
        return {
          data: resp.data.value
            .map((item: any) => item.grantCycleCoveragePeriod)
            .reverse(),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/grant/goals-objectives')
  @response(200)
  grantGoalsObjectives(): object {
    const grantNumber = _.get(this.req.query, 'grantNumber', null);
    const IPnumber = _.get(this.req.query, 'IPnumber', null);
    if (!grantNumber && !IPnumber) {
      return {
        data: [],
        message: '"grantId" and "IPnumber" parameters is required.',
      };
    }
    const mapper = mapTransform(grantPeriodGoalsObjectivesMap);
    const url = `${urls.grantIPGoalsObjectives}/?$filter=${grantDetailUtils.periodInfoRatingGrantNumber} eq '${grantNumber}' AND ${grantDetailUtils.periodInfoRatingPeriodNumber} eq ${IPnumber}&${grantDetailUtils.goalsObjectivesSort}`;

    return axios
      .get(url)
      .then(resp => {
        const res = mapper(resp.data) as never[];
        return {
          data: res,
        };
      })
      .catch(handleDataApiError);
  }
}

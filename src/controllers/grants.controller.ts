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
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import {getPage} from '../config/filtering/utils';
import grantDetailMap from '../config/mapping/grants/grantDetail.json';
import grantDetailUtils from '../config/mapping/grants/grantDetail.utils.json';
import grantPeriodInfoMap from '../config/mapping/grants/grantPeriodInfo.json';
import grantPeriodsMap from '../config/mapping/grants/grantPeriods.json';
import GrantsRadialMapping from '../config/mapping/grants/grantsRadial.json';
import grantsMap from '../config/mapping/grants/index.json';
import grantsUtils from '../config/mapping/grants/utils.json';
import urls from '../config/urls/index.json';
import {
  GrantDetailInformation,
  GrantDetailPeriod,
  GrantDetailPeriodInformation,
} from '../interfaces/grantDetail';
import {GrantListItemModel} from '../interfaces/grantList';
import {handleDataApiError} from '../utils/dataApiError';
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

  @get('/grants')
  @response(200, GRANTS_RESPONSE)
  grants(): object {
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
        const res: GrantListItemModel[] = mapper(resp.data) as never[];
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
}

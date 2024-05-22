import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import CyclesMapping from '../config/mapping/fundingrequests/cycles.json';
import Table2FieldsMapping from '../config/mapping/fundingrequests/table-2.json';
import TableFieldsMapping from '../config/mapping/fundingrequests/table.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFundingRequests} from '../utils/filtering/fundingRequests';
import {getFilterString} from '../utils/filtering/fundingrequests/getFilterString';

export class FundingRequestsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // v3

  @get('/funding-requests')
  @response(200)
  async fundingRequests() {
    const filterString = filterFundingRequests(
      this.req.query,
      Table2FieldsMapping.urlParams,
    );
    const url = `${urls.FUNDING_REQUESTS}/${filterString}&$orderby=geography/name asc`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mapper = mapTransform(Table2FieldsMapping.map);
        const data = mapper(resp.data) as never[];

        const groupedByGeo = _.groupBy(data, Table2FieldsMapping.groupby);

        return {
          data: _.map(groupedByGeo, (items, key) => {
            return {
              components: key,
              _children: items.map((item: any) => {
                return {
                  components: item.components,
                  submissionDate: moment(item.submissionDate).format(
                    'D MMMM YYYY',
                  ),
                  approach: item.approach,
                  trpWindow: item.trpWindow,
                  trpOutcome: item.trpOutcome,
                  portfolioCategorization: item.portfolioCategorization,
                  _children: item.items.map((subitem: any) => {
                    return {
                      boardApproval: subitem.boardApproval,
                      gacMeeting: moment(item.gacMeeting).format('MMMM YYYY'),
                      grant: subitem.grant.code,
                      startingDate: moment(subitem.startDate).format(
                        'DD-MM-YYYY',
                      ),
                      endingDate: moment(subitem.endDate).format('DD-MM-YYYY'),
                      principalRecipient: subitem.principalRecipient,
                    };
                  }),
                };
              }),
            };
          }),
          submittedCount: _.map(groupedByGeo, (items, key) => ({
            name: key,
            count: items.length,
          })),
          signedCount: _.map(groupedByGeo, (items, key) => ({
            name: key,
            count: _.filter(items, (item: any) => item.items.length > 0).length,
          })),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/funding-requests/{countryCode}')
  @response(200)
  async fundingRequestsByCountry(
    @param.path.string('countryCode') countryCode: string,
  ) {
    return axios
      .get(`http://localhost:4200/funding-requests?geographies=${countryCode}`)
      .then((resp: AxiosResponse) => resp.data)
      .catch(handleDataApiError);
  }

  @get('/funding-requests/cycles')
  @response(200)
  async cycles() {
    return axios
      .get(`${urls.FINANCIAL_INDICATORS}${CyclesMapping.urlParams}`)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(resp.data, CyclesMapping.dataPath, []);

        const data = _.map(rawData, (item, index) => {
          const from = _.get(item, CyclesMapping.cycleFrom, '');
          const to = _.get(item, CyclesMapping.cycleTo, '');

          let value = from;

          if (from && to) {
            value = `${from} - ${to}`;
          }

          return {
            name: `Cycle ${index + 1}`,
            value,
          };
        });

        return {data};
      })
      .catch(handleDataApiError);
  }

  // v2

  @get('/funding-requests/table')
  @response(200)
  fundingRequestsLocationTable(): object {
    const filterString = getFilterString(this.req.query);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.fundingrequests}/?${params}${filterString}&${TableFieldsMapping.defaultExpand}`;
    const sortBy = this.req.query.sortBy;
    const sortByValue = sortBy ? sortBy.toString().split(' ')[0] : 'name';
    const sortByDirection: any =
      sortBy && sortBy.toString().split(' ').length > 1
        ? sortBy.toString().split(' ')[1].toLowerCase()
        : 'asc';

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mapper = mapTransform(TableFieldsMapping.tableMap);
        const apiData = mapper(resp.data) as never[];

        const data: any = [];

        const aggregatedData = _.groupBy(
          apiData,
          (item: any) => item.country || item.multicountry,
        );

        Object.keys(aggregatedData).forEach((key: string) => {
          data.push({
            name: key,
            children: _.orderBy(
              aggregatedData[key].map((item: any) => {
                const rawDate = moment(item.submissionDate);
                const date = rawDate.format('D MMMM YYYY');
                return {
                  id: item.name,
                  date: date === 'Invalid date' ? null : date,
                  component: item.components
                    .map((c: any) => c.component)
                    .join(', '),
                  approach: item.approach,
                  window: item.trpwindow,
                  outcome: item.trpoutcome,
                  portfolioCategory: item.portfolioCategory,
                  rawDate: date === 'Invalid date' ? 0 : rawDate,
                  children: item.items.map((subitem: any) => ({
                    gac: moment(subitem.gacmeeting).format('MMM YY'),
                    // board: moment(subitem.boardApproval).format('MMM YY'),
                    grant: subitem.IPGrantNumber,
                    start: moment(subitem.IPStartDate).format('DD-MM-YYYY'),
                    end: moment(subitem.IPEndDate).format('DD-MM-YYYY'),
                    component: subitem.component,
                    ip: subitem.IPNumber,
                  })),
                  documents: item.documents,
                };
              }),
              ['rawDate', 'component'],
              ['desc', 'asc'],
            ),
          });
        });

        return {
          count: data.length,
          data: _.orderBy(data, sortByValue, sortByDirection),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/funding-requests/portfolio-categories/codelist')
  @response(200)
  fundingRequestsPortfolioCategoriesCodelist(): object {
    const url = `${urls.fundingrequests}/?${TableFieldsMapping.portfolioCategoriesCodelistAggregation}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return {
          data: _.filter(
            _.get(resp.data, TableFieldsMapping.dataPath, []).map(
              (item: any) => ({
                label: _.get(
                  item,
                  `[${TableFieldsMapping.portfolioCategoryAggregationField}]`,
                  '',
                ),
                value: _.get(
                  item,
                  `[${TableFieldsMapping.portfolioCategoryAggregationField}]`,
                  '',
                ),
              }),
            ),
            (item: any) => item.value !== null && item.value !== 'null',
          ),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/funding-requests/trp-window/codelist')
  @response(200)
  trpWindowCodelist(): object {
    const url = `${urls.fundingrequests}/?${TableFieldsMapping.trpWindowCodelistAggregation}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        return {
          data: _.filter(
            _.get(resp.data, TableFieldsMapping.dataPath, []).map(
              (item: any) => ({
                label: _.get(
                  item,
                  `[${TableFieldsMapping.trpWindowAggregationField}]`,
                  '',
                ),
                value: _.get(
                  item,
                  `[${TableFieldsMapping.trpWindowAggregationField}]`,
                  '',
                ),
              }),
            ),
            (item: any) => item.value !== null && item.value !== 'null',
          ),
        };
      })
      .catch(handleDataApiError);
  }
}

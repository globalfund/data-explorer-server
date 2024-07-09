import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import CyclesMapping from '../config/mapping/fundingrequests/cycles.json';
import Table2FieldsMapping from '../config/mapping/fundingrequests/table-2.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {filterFundingRequests} from '../utils/filtering/fundingRequests';

export class FundingRequestsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

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

        let result: {
          data: any;
          signedCount?: any;
          submittedCount?: any;
        } = {
          data: _.map(groupedByGeo, (items, key) => {
            return {
              components: key,
              _children: items.map((item: any) => {
                return {
                  components: item.components,
                  submissionDate: item.submissionDate
                    ? moment(item.submissionDate).format('D MMMM YYYY')
                    : '--',
                  approach: item.approach,
                  trpWindow: item.trpWindow,
                  trpOutcome: item.trpOutcome,
                  portfolioCategorization: item.portfolioCategorization,
                  _children: item.items.map((subitem: any) => {
                    return {
                      boardApproval: subitem.boardApproval
                        ? moment(subitem.boardApproval).format('MMMM YYYY')
                        : '--',
                      gacMeeting: item.gacMeeting
                        ? moment(item.gacMeeting).format('MMMM YYYY')
                        : '--',
                      grant: subitem.grant,
                      startingDate: subitem.startDate
                        ? moment(subitem.startDate).format('DD-MM-YYYY')
                        : '--',
                      endingDate: subitem.endDate
                        ? moment(subitem.endDate).format('DD-MM-YYYY')
                        : '--',
                      principalRecipient: subitem.principalRecipient,
                    };
                  }),
                };
              }),
            };
          }),
        };

        if (this.req.query.withCounts) {
          result = {
            ...result,
            submittedCount: _.map(groupedByGeo, (items, key) => ({
              name: key,
              count: items.length,
            })),
            signedCount: _.map(groupedByGeo, (items, key) => ({
              name: key,
              count: _.filter(items, (item: any) => item.items.length > 0)
                .length,
            })),
          };
        }

        return result;
      })
      .catch(handleDataApiError);
  }

  @get('/funding-requests/{countryCode}')
  @response(200)
  async fundingRequestsByCountry(
    @param.path.string('countryCode') countryCode: string,
  ) {
    return axios
      .get(
        `http://localhost:4200/funding-requests?withCounts=1&geographies=${countryCode}&periods=${this.req.query.periods}`,
      )
      .then((resp: AxiosResponse) => resp.data)
      .catch(handleDataApiError);
  }

  @get('/funding-requests/cycles')
  @response(200)
  async cycles() {
    const filterString = filterFundingRequests(
      this.req.query,
      CyclesMapping.urlParams,
    );
    const url = `${urls.FUNDING_REQUESTS}/${filterString}`;

    return axios
      .get(url)
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
}

import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import TableFieldsMapping from '../config/mapping/fundingrequests/table.json';
import urls from '../config/urls/index.json';
import {handleDataApiError} from '../utils/dataApiError';
import {getFilterString} from '../utils/filtering/fundingrequests/getFilterString';

export class FundingRequestsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/funding-requests/table')
  @response(200)
  fundingRequestsLocationTable(): object {
    // if (_.get(this.req.query, 'locations', '').length === 0) {
    //   return {
    //     count: 0,
    //     data: [],
    //   };
    // }
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
            children: aggregatedData[key].map((item: any) => ({
              id: item.name,
              date: moment(item.submissionDate).format('D MMMM YYYY'),
              component: item.components
                .map((c: any) => c.component)
                .join(', '),
              approach: item.approach,
              window: item.trpwindow,
              outcome: item.trpoutcome,
              gac: moment(item.gacmeeting).format('MMM YY'),
              board: moment(item.boardApproval).format('MMM YY'),
              children: item.items.map((subitem: any) => ({
                grant1: `${subitem.IPGrantNumber} (${moment(
                  subitem.IPStartDate,
                ).format('YYYY/MM/DD')} - ${moment(subitem.IPEndDate).format(
                  'YYYY/MM/DD',
                )})`,
              })),
            })),
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
        return _.get(resp.data, TableFieldsMapping.dataPath, []).map(
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
        );
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
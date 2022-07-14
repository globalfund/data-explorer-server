import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import allocations from '../../config/mapping/data-themes/raw-data/allocations.json';
import budgets from '../../config/mapping/data-themes/raw-data/budgets.json';
import eligibility from '../../config/mapping/data-themes/raw-data/eligibility.json';
import generic from '../../config/mapping/data-themes/raw-data/generic.json';
import grants from '../../config/mapping/data-themes/raw-data/grants.json';
import investmentCommitted from '../../config/mapping/data-themes/raw-data/investment-committed.json';
import investmentDisbursed from '../../config/mapping/data-themes/raw-data/investment-disbursed.json';
import investmentSigned from '../../config/mapping/data-themes/raw-data/investment-signed.json';
import pledgesContributions from '../../config/mapping/data-themes/raw-data/pledges-contributions.json';
import urls from '../../config/urls/index.json';
import {formatRawData} from '../../utils/data-themes/formatRawData';
import {getDatasetFilterOptions} from '../../utils/data-themes/getDatasetFilterOptions';
import {handleDataApiError} from '../../utils/dataApiError';

export class DataThemesRawDataController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/data-themes/raw-data/investment-signed')
  @response(200)
  investmentSigned(@param.query.string('rows') rows: string): object {
    return axios
      .get(
        `${urls.vgrantPeriods}/?${investmentSigned.select}&${generic.rows}${rows}`,
      )
      .then((res: AxiosResponse) => {
        const data = _.get(res.data, investmentSigned.dataPath, []).map(
          formatRawData,
        );
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/investment-committed')
  @response(200)
  investmentCommitted(@param.query.string('rows') rows: string): object {
    return axios
      .get(
        `${urls.vcommitments}/?${investmentCommitted.select}&${generic.rows}${rows}`,
      )
      .then((res: AxiosResponse) => {
        const data = _.get(res.data, investmentCommitted.dataPath, []).map(
          formatRawData,
        );
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/investment-disbursed')
  @response(200)
  investmentDisbursed(@param.query.string('rows') rows: string): object {
    return axios
      .get(
        `${urls.disbursements}/?${investmentDisbursed.select}&${generic.rows}${rows}`,
      )
      .then((res: AxiosResponse) => {
        const data = _.get(res.data, investmentDisbursed.dataPath, []).map(
          formatRawData,
        );
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/budgets')
  @response(200)
  budgets(@param.query.string('rows') rows: string): object {
    const mapper = mapTransform(budgets.mapping);
    return axios
      .get(`${urls.budgets}/?${budgets.expand}&${generic.rows}${rows}`)
      .then((res: AxiosResponse) => {
        const data = (mapper(res.data) as never[]).map(formatRawData);
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/pledges-contributions')
  @response(200)
  pledgesContributions(@param.query.string('rows') rows: string): object {
    const mapper = mapTransform(pledgesContributions.mapping);
    return axios
      .get(
        `${urls.pledgescontributions}/?${pledgesContributions.expand}&${generic.rows}${rows}`,
      )
      .then((res: AxiosResponse) => {
        const data = (mapper(res.data) as never[]).map(formatRawData);
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/allocations')
  @response(200)
  allocations(@param.query.string('rows') rows: string): object {
    const mapper = mapTransform(allocations.mapping);
    return axios
      .get(
        `${urls.allocations}/?${allocations.expand}&${generic.withcount}&${generic.rows}${rows}`,
      )
      .then((res: AxiosResponse) => {
        const data = (mapper(res.data) as never[]).map(formatRawData);
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: _.get(res.data, generic.countField, data.length),
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/grants')
  @response(200)
  grants(@param.query.string('rows') rows: string): object {
    return axios
      .get(`${urls.grantsNoCount}/?${grants.select}&${generic.rows}${rows}`)
      .then((res: AxiosResponse) => {
        const data = _.get(res.data, grants.dataPath, []).map(formatRawData);
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/data-themes/raw-data/eligibility')
  @response(200)
  eligibility(@param.query.string('rows') rows: string): object {
    return axios
      .get(`${urls.eligibility}/?${eligibility.select}&${generic.rows}${rows}`)
      .then((res: AxiosResponse) => {
        const data = _.get(res.data, eligibility.dataPath, []).map(
          formatRawData,
        );
        const filterOptionGroups = getDatasetFilterOptions(data);
        return {
          data,
          filterOptionGroups,
          count: data.length,
        };
      })
      .catch(handleDataApiError);
  }
}

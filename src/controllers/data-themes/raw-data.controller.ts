import {inject} from '@loopback/core';
import {get, param, Request, response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import allocations from '../../config/mapping/data-themes/raw-data/allocations.json';
import budgets from '../../config/mapping/data-themes/raw-data/budgets.json';
import eligibility from '../../config/mapping/data-themes/raw-data/eligibility.json';
import grants from '../../config/mapping/data-themes/raw-data/grants.json';
import investmentCommitted from '../../config/mapping/data-themes/raw-data/investment-committed.json';
import investmentDisbursed from '../../config/mapping/data-themes/raw-data/investment-disbursed.json';
import investmentSigned from '../../config/mapping/data-themes/raw-data/investment-signed.json';
import pledgesContributions from '../../config/mapping/data-themes/raw-data/pledges-contributions.json';
import urls from '../../config/urls/index.json';
import {getRawData} from '../../utils/data-themes/getRawData';
import {getRawDataWithMapper} from '../../utils/data-themes/getRawDataWithMapper';

export class DataThemesRawDataController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/data-themes/sample-data/{datasetId}')
  @response(200)
  async sampleData(@param.path.string('datasetId') datasetId: string) {
    return axios
      .get(`http://localhost:4400/sample-data/${datasetId}`)
      .then(res => {
        return res.data;
      })
      .catch(error => {
        console.log(error);
        return {
          data: [],
          error,
        };
      });
  }

  @get('/data-themes/raw-data/investment-signed')
  @response(200)
  investmentSigned(@param.query.string('rows') rows: string): object {
    return getRawData(
      `${urls.vgrantPeriods}/?${investmentSigned.select}`,
      rows,
      investmentSigned,
    );
  }

  @get('/data-themes/raw-data/investment-committed')
  @response(200)
  investmentCommitted(@param.query.string('rows') rows: string): object {
    return getRawData(
      `${urls.vcommitments}/?${investmentCommitted.select}`,
      rows,
      investmentCommitted,
    );
  }

  @get('/data-themes/raw-data/investment-disbursed')
  @response(200)
  investmentDisbursed(@param.query.string('rows') rows: string): object {
    return getRawData(
      `${urls.disbursements}/?${investmentDisbursed.select}`,
      rows,
      investmentDisbursed,
    );
  }

  @get('/data-themes/raw-data/budgets')
  @response(200)
  budgets(@param.query.string('rows') rows: string): object {
    return getRawDataWithMapper(
      `${urls.budgets}/?${budgets.expand}`,
      rows,
      budgets,
    );
  }

  @get('/data-themes/raw-data/pledges-contributions')
  @response(200)
  pledgesContributions(@param.query.string('rows') rows: string): object {
    return getRawDataWithMapper(
      `${urls.pledgescontributions}/?${pledgesContributions.expand}`,
      rows,
      pledgesContributions,
    );
  }

  @get('/data-themes/raw-data/allocations')
  @response(200)
  allocations(@param.query.string('rows') rows: string): object {
    return getRawDataWithMapper(
      `${urls.allocations}/?${allocations.expand}`,
      rows,
      allocations,
    );
  }

  @get('/data-themes/raw-data/grants')
  @response(200)
  grants(@param.query.string('rows') rows: string): object {
    return getRawData(`${urls.grantsNoCount}/?${grants.select}`, rows, grants);
  }

  @get('/data-themes/raw-data/eligibility')
  @response(200)
  eligibility(@param.query.string('rows') rows: string): object {
    return getRawData(
      `${urls.eligibility}/?${eligibility.select}`,
      rows,
      eligibility,
    );
  }
}

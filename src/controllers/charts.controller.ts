import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  Request,
  requestBody,
  response,
  RestBindings,
} from '@loopback/rest';
import axios from 'axios';
import {execSync} from 'child_process';
import fs from 'fs-extra';
import _ from 'lodash';
import {Chart} from '../models';
import {ChartRepository} from '../repositories';

async function getChartsCount(
  chartRepository: ChartRepository,
  owner?: string,
  where?: Where<Chart>,
) {
  return chartRepository.count({
    ...where,
    or: [{owner: owner}, {public: true}],
  });
}

async function getCharts(
  chartRepository: ChartRepository,
  owner?: string,
  filter?: Filter<Chart>,
) {
  return chartRepository.find({
    ...filter,
    where: {
      ...filter?.where,
      or: [{owner: owner}, {public: true}],
    },
    fields: ['id', 'name', 'vizType', 'datasetId', 'public', 'createdDate'],
  });
}

async function renderChart(
  chartRepository: ChartRepository,
  id: string,
  body: any,
  owner: string,
) {
  try {
    const chartData = id === 'new' ? {} : await chartRepository.findById(id);
    if (
      id !== 'new' &&
      !_.get(chartData, 'public') &&
      _.get(chartData, 'owner', '') !== owner
    ) {
      return;
    }
    // save an object with ({...body}, chartData) with identifiers as body and chardata as json
    const ob = {
      body: {...body},
      chartData: chartData,
    };
    fs.writeFileSync(
      `./src/utils/renderChart/dist/rendering/${id}.json`,
      JSON.stringify(ob, null, 4),
    );
    // execute the ./src/utiles/renderChart/dist/index.cjs with id as the parameter
    execSync(`node ./src/utils/renderChart/dist/index.cjs ${id}`, {
      timeout: 0,
      stdio: 'pipe',
    });
    // once the renderign is done, read the output file
    const data = fs.readFileSync(
      `./src/utils/renderChart/dist/rendering/${id}_rendered.json`,
    );

    // clean temp files
    fs.removeSync(`./src/utils/renderChart/dist/rendering/${id}.json`);
    fs.removeSync(`./src/utils/renderChart/dist/rendering/${id}_rendered.json`);

    // return jsonified data
    return JSON.parse(data.toString());
  } catch (err) {
    console.error(err);
    return {error: err};
  }
}

export class ChartsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @repository(ChartRepository)
    public chartRepository: ChartRepository,
  ) {}

  /* create chart */

  @post('/chart')
  @response(200, {
    description: 'Chart model instance',
    content: {'application/json': {schema: getModelSchemaRef(Chart)}},
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chart, {
            title: 'NewChart',
            exclude: ['id'],
          }),
        },
      },
    })
    chart: Omit<Chart, 'id'>,
  ): Promise<Chart> {
    chart.owner = _.get(this.req, 'user.sub', 'anonymous');
    return this.chartRepository.create(chart);
  }

  /* get chart dataset sample data */

  @get('/chart/sample-data/{datasetId}')
  @response(200)
  async sampleData(@param.path.string('datasetId') datasetId: string) {
    let host = process.env.BACKEND_SUBDOMAIN ? 'dx-backend' : 'localhost';
    if (process.env.ENV_TYPE !== 'prod')
      host = process.env.ENV_TYPE ? `dx-backend-${process.env.ENV_TYPE}` : host;
    return axios
      .get(`http://${host}:4004/sample-data/${datasetId}`)
      .then(res => {
        return {
          count: _.get(res, 'data.count', []),
          sample: _.get(res, 'data.sample', []),
          dataTypes: _.get(res, 'data.dataTypes', []),
          filterOptionGroups: _.get(res, 'data.filterOptionGroups', []),
          stats: _.get(res, 'data.stats', []),
        };
      })
      .catch(error => {
        console.log(error);
        return {
          data: [],
          error,
        };
      });
  }

  /* charts count */

  @get('/charts/count')
  @response(200, {
    description: 'Chart model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async count(@param.where(Chart) where?: Where<Chart>): Promise<Count> {
    return getChartsCount(
      this.chartRepository,
      _.get(this.req, 'user.sub', 'anonymous'),
      where,
    );
  }

  @get('/charts/count/public')
  @response(200, {
    description: 'Chart model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async countPublic(@param.where(Chart) where?: Where<Chart>): Promise<Count> {
    return getChartsCount(
      this.chartRepository,
      _.get(this.req, 'user.sub', 'anonymous'),
      where,
    );
  }

  /* get charts */

  @get('/charts')
  @response(200, {
    description: 'Array of Chart model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Chart, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async find(@param.filter(Chart) filter?: Filter<Chart>): Promise<Chart[]> {
    return getCharts(
      this.chartRepository,
      _.get(this.req, 'user.sub', 'anonymous'),
      filter,
    );
  }

  @get('/charts/public')
  @response(200, {
    description: 'Array of Chart model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Chart, {includeRelations: true}),
        },
      },
    },
  })
  async findPublic(
    @param.filter(Chart) filter?: Filter<Chart>,
  ): Promise<Chart[]> {
    return getCharts(
      this.chartRepository,
      _.get(this.req, 'user.sub', 'anonymous'),
      filter,
    );
  }

  /* patch charts */

  @patch('/chart')
  @response(200, {
    description: 'Chart PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chart, {partial: true}),
        },
      },
    })
    chart: Chart,
    @param.where(Chart) where?: Where<Chart>,
  ): Promise<Count> {
    return this.chartRepository.updateAll(chart, where);
  }

  /* get chart */

  @get('/chart/{id}')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Chart, {exclude: 'where'})
    filter?: FilterExcludingWhere<Chart>,
  ): Promise<Chart | {name: string; error: string}> {
    const chart = await this.chartRepository.findById(id, filter);
    if (
      chart.public ||
      chart.owner === _.get(this.req, 'user.sub', 'anonymous')
    )
      return chart;
    else return {name: '', error: 'Unauthorized'};
  }

  @get('/chart/public/{id}')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  async findPublicById(
    @param.path.string('id') id: string,
    @param.filter(Chart, {exclude: 'where'})
    filter?: FilterExcludingWhere<Chart>,
  ): Promise<Chart | {name: string; error: string}> {
    const chart = await this.chartRepository.findById(id, filter);
    if (chart.public) return chart;
    else return {name: '', error: 'Unauthorized'};
  }

  /* render chart */

  @post('/chart/{id}/render')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async renderById(
    @param.path.string('id') id: string,
    @requestBody() body: any,
  ) {
    return renderChart(
      this.chartRepository,
      id,
      body,
      _.get(this.req, 'user.sub', 'anonymous'),
    );
  }

  @post('/chart/{id}/render/public')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  async renderByIdPublic(
    @param.path.string('id') id: string,
    @requestBody() body: any,
  ) {
    return renderChart(
      this.chartRepository,
      id,
      body,
      _.get(this.req, 'user.sub', 'anonymous'),
    );
  }

  /* patch chart */

  @patch('/chart/{id}')
  @response(204, {
    description: 'Chart PATCH success',
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chart, {partial: true}),
        },
      },
    })
    chart: Chart,
  ): Promise<void> {
    await this.chartRepository.updateById(id, {
      ...chart,
      updatedDate: new Date().toISOString(),
    });
  }

  /* put chart */

  @put('/chart/{id}')
  @response(204, {
    description: 'Chart PUT success',
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() chart: Chart,
  ): Promise<void> {
    await this.chartRepository.replaceById(id, chart);
  }

  /* delete chart */

  @del('/chart/{id}')
  @response(204, {
    description: 'Chart DELETE success',
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.chartRepository.deleteById(id);
  }

  /* duplicate chart */

  @get('/chart/duplicate/{id}/{name}')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  @authenticate({strategy: 'auth0-jwt', options: {scopes: ['greet']}})
  async duplicate(
    @param.path.string('id') id: string,
    @param.path.string('name') name: string,
  ): Promise<Chart> {
    const fChart = await this.chartRepository.findById(id);
    return this.chartRepository.create({
      name,
      public: false,
      vizType: fChart.vizType,
      datasetId: fChart.datasetId,
      mapping: fChart.mapping,
      vizOptions: fChart.vizOptions,
      appliedFilters: fChart.appliedFilters,
      enabledFilterOptionGroups: fChart.enabledFilterOptionGroups,
      owner: _.get(this.req, 'user.sub', 'anonymous'),
    });
  }
}

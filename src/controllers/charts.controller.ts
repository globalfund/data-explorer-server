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
  requestBody,
  response,
} from '@loopback/rest';
import axios from 'axios';
import {execSync} from 'child_process';
import fs from 'fs-extra';
import _ from 'lodash';
import util from 'util';
import {Chart} from '../models';
import {ChartRepository} from '../repositories';

export class ChartsController {
  constructor(
    @repository(ChartRepository)
    public chartRepository: ChartRepository,
  ) {}

  @post('/chart')
  @response(200, {
    description: 'Chart model instance',
    content: {'application/json': {schema: getModelSchemaRef(Chart)}},
  })
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
    return this.chartRepository.create(chart);
  }

  @get('/chart/sample-data/{datasetId}')
  @response(200)
  async sampleData(@param.path.string('datasetId') datasetId: string) {
    let host = process.env.BACKEND_SUBDOMAIN ? 'dx-backend' : 'localhost';
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

  @get('/charts/count')
  @response(200, {
    description: 'Chart model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Chart) where?: Where<Chart>): Promise<Count> {
    return this.chartRepository.count(where);
  }

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
  async find(@param.filter(Chart) filter?: Filter<Chart>): Promise<Chart[]> {
    return this.chartRepository.find({
      ...filter,
      fields: ['id', 'name', 'vizType', 'datasetId', 'createdDate'],
    });
  }

  @patch('/chart')
  @response(200, {
    description: 'Chart PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
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

  @get('/chart/{id}')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Chart, {exclude: 'where'})
    filter?: FilterExcludingWhere<Chart>,
  ): Promise<Chart> {
    return this.chartRepository.findById(id, filter);
  }

  @post('/chart/{id}/render')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  async renderById(
    @param.path.string('id') id: string,
    @requestBody() body: any,
  ) {
    try {
      const chartData =
        id === 'new' ? {} : await this.chartRepository.findById(id);
      // save an object with ({...body}, chartData) with identifiers as body and chardata as json
      const ob = {
        body: {...body},
        chartData: chartData,
      };
      fs.writeFileSync(
        `./src/utils/renderChart/dist/rendering/${id}.json`,
        JSON.stringify(ob, null, 4),
      );

      // Print the object's structure, including circular references
      console.log(util.inspect(ob, {showHidden: true, depth: null}));

      // execute the ./src/utiles/renderChart/dist/index.cjs with id as the parameter

      execSync(`node ./src/utils/renderChart/dist/index.cjs ${id}`, {
        timeout: 0,
        stdio: 'inherit',
      });

      // once the renderign is done, read the output file
      const data = fs.readFileSync(
        `./src/utils/renderChart/dist/rendering/${id}_rendered.json`,
      );

      // clean temp files
      fs.removeSync(`./src/utils/renderChart/dist/rendering/${id}.json`);
      fs.removeSync(
        `./src/utils/renderChart/dist/rendering/${id}_rendered.json`,
      );

      // return jsonified data
      return JSON.parse(data.toString());
    } catch (err) {
      console.error(err);
      return {error: err};
    }
  }
  @patch('/chart/{id}')
  @response(204, {
    description: 'Chart PATCH success',
  })
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
    await this.chartRepository.updateById(id, chart);
  }

  @put('/chart/{id}')
  @response(204, {
    description: 'Chart PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() chart: Chart,
  ): Promise<void> {
    await this.chartRepository.replaceById(id, chart);
  }

  @del('/chart/{id}')
  @response(204, {
    description: 'Chart DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.chartRepository.deleteById(id);
  }

  @get('/chart/duplicate/{id}/{name}')
  @response(200, {
    description: 'Chart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Chart, {includeRelations: true}),
      },
    },
  })
  async duplicate(
    @param.path.string('id') id: string,
    @param.path.string('name') name: string,
  ): Promise<Chart> {
    const fChart = await this.chartRepository.findById(id);
    return this.chartRepository.create({
      name,
      public: fChart.public,
      vizType: fChart.vizType,
      datasetId: fChart.datasetId,
      mapping: fChart.mapping,
      vizOptions: fChart.vizOptions,
      appliedFilters: fChart.appliedFilters,
      enabledFilterOptionGroups: fChart.enabledFilterOptionGroups,
    });
  }
}

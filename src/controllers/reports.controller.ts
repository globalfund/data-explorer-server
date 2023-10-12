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
import {Report} from '../models';
import {ReportRepository} from '../repositories';

export class ReportsController {
  constructor(
    @repository(ReportRepository)
    public ReportRepository: ReportRepository,
  ) {}

  @post('/report')
  @response(200, {
    description: 'Report model instance',
    content: {'application/json': {schema: getModelSchemaRef(Report)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Report, {
            title: 'NewReport',
            exclude: ['id'],
          }),
        },
      },
    })
    Report: Omit<Report, 'id'>,
  ): Promise<Report> {
    return this.ReportRepository.create(Report);
  }

  @get('/reports/count')
  @response(200, {
    description: 'Report model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Report) where?: Where<Report>): Promise<Count> {
    return this.ReportRepository.count(where);
  }

  @get('/reports')
  @response(200, {
    description: 'Array of Report model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Report, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Report) filter?: Filter<Report>): Promise<Report[]> {
    return this.ReportRepository.find({
      ...filter,
      fields: [
        'id',
        'name',
        'createdDate',
        'showHeader',
        'backgroundColor',
        'title',
        'subTitle',
      ],
    });
  }

  @patch('/report')
  @response(200, {
    description: 'Report PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Report, {partial: true}),
        },
      },
    })
    Report: Report,
    @param.where(Report) where?: Where<Report>,
  ): Promise<Count> {
    return this.ReportRepository.updateAll(Report, where);
  }

  @get('/report/{id}')
  @response(200, {
    description: 'Report model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Report, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Report, {exclude: 'where'})
    filter?: FilterExcludingWhere<Report>,
  ): Promise<Report> {
    const report = await this.ReportRepository.findById(id, filter);
    return report;
  }

  @post('/report/{id}/render')
  @response(200, {
    description: 'Report model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Report, {includeRelations: true}),
      },
    },
  })
  async renderById(
    @param.path.string('id') id: string,
    @requestBody() body: any,
  ) {
    const host = process.env.BACKEND_SUBDOMAIN ? 'dx-backend' : 'localhost';
    const result = await (
      await axios.post(`http://${host}:4400/render/report/${id}`, {...body})
    ).data;
    return result;
  }

  @patch('/report/{id}')
  @response(204, {
    description: 'Report PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Report, {partial: true}),
        },
      },
    })
    Report: Report,
  ): Promise<void> {
    await this.ReportRepository.updateById(id, Report);
  }

  @put('/report/{id}')
  @response(204, {
    description: 'Report PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() Report: Report,
  ): Promise<void> {
    await this.ReportRepository.replaceById(id, Report);
  }

  @del('/report/{id}')
  @response(204, {
    description: 'Report DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.ReportRepository.deleteById(id);
  }

  @get('/report/duplicate/{id}')
  @response(200, {
    description: 'Report model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Report, {includeRelations: true}),
      },
    },
  })
  async duplicate(@param.path.string('id') id: string): Promise<Report> {
    const fReport = await this.ReportRepository.findById(id);
    return this.ReportRepository.create({
      name: `${fReport.name} copy`,
      showHeader: fReport.showHeader,
      title: fReport.title,
      subTitle: fReport.subTitle,
      rows: fReport.rows,
      public: fReport.public,
      backgroundColor: fReport.backgroundColor,
      titleColor: fReport.titleColor,
      descriptionColor: fReport.descriptionColor,

      dateColor: fReport.dateColor,
    });
  }
}

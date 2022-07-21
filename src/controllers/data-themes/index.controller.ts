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
import {DataTheme} from '../../models';
import {DataThemeRepository} from '../../repositories';

export class DataThemesController {
  constructor(
    @repository(DataThemeRepository)
    public dataThemeRepository: DataThemeRepository,
  ) {}

  @post('/data-themes')
  @response(200, {
    description: 'DataTheme model instance',
    content: {'application/json': {schema: getModelSchemaRef(DataTheme)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DataTheme, {
            title: 'NewDataTheme',
            exclude: ['id'],
          }),
        },
      },
    })
    dataTheme: Omit<DataTheme, 'id'>,
  ): Promise<DataTheme> {
    return this.dataThemeRepository.create(dataTheme);
  }

  @get('/data-themes/count')
  @response(200, {
    description: 'DataTheme model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(DataTheme) where?: Where<DataTheme>,
  ): Promise<Count> {
    return this.dataThemeRepository.count(where);
  }

  @get('/data-themes')
  @response(200, {
    description: 'Array of DataTheme model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DataTheme, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(DataTheme) filter?: Filter<DataTheme>,
  ): Promise<DataTheme[]> {
    return this.dataThemeRepository.find(filter);
  }

  @get('/data-themes-with-viz-count')
  @response(200, {
    description: 'Array of DataTheme model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DataTheme, {includeRelations: true}),
        },
      },
    },
  })
  async findNreturnWcount(
    @param.query.string('q') q?: string,
    @param.query.string('order') order?: string,
  ): Promise<
    {
      id: string;
      title: string;
      subTitle: string;
      public: boolean;
      createdDate: Date;
      vizCount: number;
    }[]
  > {
    let query: any = q
      ? {
          where: {
            or: [{title: {regexp: `/${q}/i`}}, {subTitle: {regexp: `/${q}/i`}}],
          },
        }
      : undefined;
    if (order) {
      if (!order) {
        query = {};
      }
      query = {
        ...query,
        order,
      };
    }
    return this.dataThemeRepository.find(query).then(items => {
      return items.map(item => {
        let count = 0;
        item.tabs.forEach(tab => {
          tab.content.forEach(content => {
            // @ts-ignore
            if (content.vizType !== undefined) {
              count += 1;
            }
          });
        });
        return {
          id: item.id,
          title: item.title,
          subTitle: item.subTitle,
          public: item.public,
          createdDate: item.createdDate,
          vizCount: count,
        };
      });
    });
  }

  @patch('/data-themes')
  @response(200, {
    description: 'DataTheme PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DataTheme, {partial: true}),
        },
      },
    })
    dataTheme: DataTheme,
    @param.where(DataTheme) where?: Where<DataTheme>,
  ): Promise<Count> {
    return this.dataThemeRepository.updateAll(dataTheme, where);
  }

  @get('/data-themes/{id}')
  @response(200, {
    description: 'DataTheme model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(DataTheme, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(DataTheme, {exclude: 'where'})
    filter?: FilterExcludingWhere<DataTheme>,
  ): Promise<DataTheme> {
    return this.dataThemeRepository.findById(id, filter);
  }

  @patch('/data-themes/{id}')
  @response(204, {
    description: 'DataTheme PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DataTheme, {partial: true}),
        },
      },
    })
    dataTheme: DataTheme,
  ): Promise<void> {
    await this.dataThemeRepository.updateById(id, dataTheme);
  }

  @put('/data-themes/{id}')
  @response(204, {
    description: 'DataTheme PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() dataTheme: DataTheme,
  ): Promise<void> {
    await this.dataThemeRepository.replaceById(id, dataTheme);
  }

  @del('/data-themes/{id}')
  @response(204, {
    description: 'DataTheme DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.dataThemeRepository.deleteById(id);
  }

  @get('/data-themes/duplicate/{id}')
  @response(200, {
    description: 'DataTheme model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(DataTheme, {includeRelations: true}),
      },
    },
  })
  async duplicate(@param.path.string('id') id: string): Promise<DataTheme> {
    const fDataTheme = await this.dataThemeRepository.findById(id);
    return this.dataThemeRepository.create({
      title: `${fDataTheme.title} copy`,
      subTitle: fDataTheme.subTitle,
      public: fDataTheme.public,
      tabs: fDataTheme.tabs,
    });
  }
}

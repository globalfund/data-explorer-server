import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false, forceId: true}})
export class Dataset extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'boolean',
    required: true,
  })
  public: boolean;

  @property({
    type: 'string',
    required: true,
  })
  category: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate?: string;

  constructor(data?: Partial<Dataset>) {
    super(data);
  }
}

export interface DatasetRelations {
  // describe navigational properties here
}

export type DatasetWithRelations = Dataset & DatasetRelations;

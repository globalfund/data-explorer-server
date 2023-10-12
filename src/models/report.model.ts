import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false, forceId: true}})
export class Report extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'boolean',
    default: true,
  })
  showHeader: boolean;

  @property({
    type: 'string',
    required: false,
  })
  title: string;

  @property({
    type: 'object',
    required: false,
  })
  subTitle: object;

  @property({
    type: 'array',
    itemType: 'any',
  })
  rows: {
    items: any[]; // string: chart id, object: formatted text
    structure: string;
    contentWidths: {
      id: string;
      widths: number[];
    }[];
    contentHeights: {
      id: string;
      heights: number[];
    }[];
  }[];

  @property({
    type: 'boolean',
    default: false,
  })
  public: boolean;

  @property({
    type: 'string',
    required: false,
    default: '#252c34',
  })
  backgroundColor: string;

  @property({
    type: 'string',
    required: false,
    default: '#ffffff',
  })
  titleColor: string;

  @property({
    type: 'string',
    required: false,
    default: '#ffffff',
  })
  descriptionColor: string;

  @property({
    type: 'string',
    required: false,
    default: '#ffffff',
  })
  dateColor: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate: string;

  constructor(data?: Partial<Report>) {
    super(data);
  }
}

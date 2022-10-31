import {Entity, model, property} from '@loopback/repository';

class DataThemeTabText extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  content: object; // object is a draft-js EditorState

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate: Date;

  constructor(data?: Partial<DataThemeTabText>) {
    super(data);
  }
}

class DataThemeTabViz extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    default: 'barchart',
  })
  vizType:
    | 'barchart'
    | 'linechart'
    | 'barchartmultiset'
    | 'alluvialdiagram'
    | 'treemap'
    | 'barchartstacked';

  @property({
    type: 'string',
    required: true,
    default: 'investment-signed',
  })
  datasetId:
    | 'investment-signed'
    | 'investment-committed'
    | 'investment-disbursed'
    | 'budgets'
    | 'pledges-contributions'
    | 'allocations'
    | 'grants'
    | 'eligibility';

  @property({
    type: 'string',
    required: true,
  })
  rows: string;

  @property({
    type: 'object',
    required: true,
  })
  mapping: object;

  @property({
    type: 'object',
    required: true,
  })
  vizOptions: object;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  filterOptionGroups: object[];

  @property({
    type: 'object',
  })
  appliedFilters: object;

  @property({
    type: 'boolean',
    default: false,
  })
  liveData: boolean;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate: Date;

  constructor(data?: Partial<DataThemeTabViz>) {
    super(data);
  }
}

class DataThemeTab extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  content: (DataThemeTabViz | DataThemeTabText)[];

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate: Date;

  constructor(data?: Partial<DataThemeTab>) {
    super(data);
  }
}

@model({settings: {}})
export class DataTheme extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  subTitle: string;

  @property({
    type: 'boolean',
    default: false,
  })
  public: boolean;

  @property({
    type: 'array',
    itemType: 'object',
  })
  tabs: DataThemeTab[];

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdDate: Date;

  constructor(data?: Partial<DataTheme>) {
    super(data);
  }
}

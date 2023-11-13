export const dimensions = [
  {
    id: 'title',
    name: 'Title',
    validTypes: ['string'],
    required: false,
    static: true,
  },
  {
    id: 'value',
    name: 'Value',
    validTypes: ['number'],
    required: true,
    aggregation: true,
    aggregationDefault: 'sum',
  },
  {
    id: 'subtitle',
    name: 'Sub Title',
    validTypes: ['string'],
    required: false,
    static: true,
  },
  {
    id: 'description',
    name: 'Description',
    validTypes: ['string'],
    required: false,
    static: true,
  },
]

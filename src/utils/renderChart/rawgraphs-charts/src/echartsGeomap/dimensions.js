export const dimensions = [
  {
    id: 'country',
    name: 'Country',
    validTypes: ['string'],
    required: true,
    operation: 'get',
  },
  {
    id: 'size',
    name: 'Size',
    validTypes: ['number'],
    required: true,
    operation: 'get',
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

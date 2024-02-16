export const dimensions = [
  {
    id: 'bars',
    name: 'Bars',
    validTypes: ['number', 'string', 'date'],
    required: true,
    operation: 'get',
  },
  {
    id: 'size',
    name: 'Size',
    operation: 'get',
    validTypes: ['number'],
    required: false,
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

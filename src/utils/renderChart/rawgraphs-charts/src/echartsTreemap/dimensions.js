export const dimensions = [
  {
    id: 'hierarchy',
    name: 'Hierarchy',
    validTypes: ['number', 'date', 'string'],
    required: true,
    multiple: true,
  },
  {
    id: 'size',
    name: 'Size',
    validTypes: ['number'],
    required: false,
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

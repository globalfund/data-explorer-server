export const visualOptions = {
  marginTop: {
    type: 'number',
    label: 'Margin (top)',
    default: 20,
    group: 'artboard',
  },

  marginRight: {
    type: 'number',
    label: 'Margin (right)',
    default: 10,
    group: 'artboard',
  },

  marginBottom: {
    type: 'number',
    label: 'Margin (bottom)',
    default: 20,
    group: 'artboard',
  },

  marginLeft: {
    type: 'number',
    label: 'Margin (left)',
    default: 10,
    group: 'artboard',
  },

  showLegend: {
    type: 'boolean',
    label: 'Show legend',
    default: false,
    group: 'artboard',
  },

  legendWidth: {
    type: 'number',
    label: 'Legend width',
    default: 200,
    group: 'artboard',
    disabled: {
      showLegend: false,
    },
    container: 'width',
    containerCondition: {
      showLegend: true,
    },
  },

  interpolation: {
    type: 'text',
    label: 'Curves type',
    default: 'curveBumpX',
    options: [
      { label: 'Basis', value: 'curveBasis' },
      { label: 'Bump', value: 'curveBumpX' },
      { label: 'Cardinal', value: 'curveCardinal' },
      { label: 'Catmull–Rom', value: 'curveCatmullRom' },
      { label: 'Linear', value: 'curveLinear' },
      { label: 'Monotone X', value: 'curveMonotoneX' },
      { label: 'Natural', value: 'curveNatural' },
      { label: 'Step', value: 'curveStep' },
      { label: 'Step After', value: 'curveStepAfter' },
      { label: 'Step Before', value: 'curveStepBefore' },
    ],
    group: 'chart',
  },

  streamsOffset: {
    type: 'text',
    label: 'Streams vertical alignment',
    group: 'chart',
    options: [
      { label: 'Expand', value: 'stackOffsetExpand' },
      { label: 'Silhouette', value: 'stackOffsetSilhouette' },
      { label: 'None', value: 'stackOffsetNone' },
    ],
    default: 'stackOffsetNone',
  },

  streamsPadding: {
    type: 'number',
    label: 'Padding',
    default: 1,
    group: 'chart',
  },

  showYAxis: {
    type: 'boolean',
    label: 'Show Y axis',
    default: false,
    group: 'chart',
    disabled: {
      streamsOffset: 'stackOffsetSilhouette',
    },
  },

  useSameScale: {
    type: 'boolean',
    label: 'Use same scale',
    default: true,
    group: 'series',
  },

  columnsNumber: {
    type: 'number',
    label: 'Number of columns',
    default: 0,
    group: 'series',
  },

  sortSeriesBy: {
    type: 'text',
    label: 'Sort series by',
    group: 'series',
    options: [
      { label: 'Total value (descending)', value: 'totalAscending' },
      { label: 'Total value (ascending)', value: 'totalDescending' },
      { label: 'Name', value: 'name' },
      { label: 'Original', value: 'original' },
    ],
    default: 'totalDescending',
  },

  showSeriesLabels: {
    type: 'boolean',
    label: 'Show series titles',
    default: true,
    group: 'series',
  },

  showGrid: {
    type: 'boolean',
    label: 'Show series grid',
    default: false,
    group: 'series',
  },

  colorScale: {
    type: 'colorScale',
    label: 'Color scale',
    dimension: 'streams',
    default: {
      scaleType: 'ordinal',
      interpolator: 'interpolateSpectral',
    },
    group: 'colors',
  },

  showLabels: {
    type: 'boolean',
    label: 'Show streams labels',
    default: true,
    group: 'Labels',
  },

  labelsType: {
    type: 'text',
    label: 'Labels position',
    group: 'Labels',
    options: ['On path', 'On point'],
    default: 'On point',
    disabled: {
      showLabels: false,
    },
  },

  showLabelsOutline: {
    type: 'boolean',
    label: 'Show outline',
    default: false,
    group: 'Labels',
    disabled: {
      showLabels: false,
    },
  },
}

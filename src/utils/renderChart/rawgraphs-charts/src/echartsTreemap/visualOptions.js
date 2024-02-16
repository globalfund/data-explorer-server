export const visualOptions = {
  marginTop: {
    type: 'number',
    label: 'Margin (top)',
    default: 0,
    group: 'artboard',
  },
  marginRight: {
    type: 'number',
    label: 'Margin (right)',
    default: 0,
    group: 'artboard',
  },
  marginBottom: {
    type: 'number',
    label: 'Margin (bottom)',
    default: 0,
    group: 'artboard',
  },
  marginLeft: {
    type: 'number',
    label: 'Margin (left)',
    default: 0,
    group: 'artboard',
  },
  nodeClick: {
    type: 'text',
    label: 'Node click',
    group: 'artboard',
    options: ['false', 'zoomToNode', 'link'],
    default: 'link',
  },
  showLabels: {
    type: 'boolean',
    label: 'Show labels',
    default: true,
    group: 'labels',
  },
  showBreadcrumbs: {
    type: 'boolean',
    label: 'Show breadcrumbs',
    default: true,
    group: 'labels',
  },
  upperLabel: {
    type: 'boolean',
    label: 'Show upper label',
    default: true,
    group: 'labels',
  },
  showTooltip: {
    type: 'boolean',
    label: 'Show tooltip',
    default: true,
    group: 'Tooltip',
  },
  isMonetaryValue: {
    type: 'boolean',
    label: 'Is monetary value?',
    default: false,
    group: 'Tooltip',
    disabled: {
      showTooltip: false,
    },
  },
}

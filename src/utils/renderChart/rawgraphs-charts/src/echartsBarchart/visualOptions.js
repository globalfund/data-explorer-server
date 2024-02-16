export const visualOptions = {
  marginTop: {
    type: 'number',
    label: 'Margin (top)',
    default: 10,
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
    default: 50,
    group: 'artboard',
  },
  marginLeft: {
    type: 'number',
    label: 'Margin (left)',
    default: 50,
    group: 'artboard',
  },
  barWidth: {
    type: 'number',
    label: 'Bar Width',
    default: 60,
    group: 'artboard',
  },
  stack: {
    type: 'boolean',
    label: 'Stack lines',
    default: false,
    group: 'Chart',
  },
  // orientation: {
  //   type: 'text',
  //   label: 'Orientation',
  //   group: 'chart',
  //   options: ['horizontal', 'vertical'],
  //   default: 'vertical',
  // },
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
  // label: {
  //   type: 'boolean',
  //   label: 'Show label',
  //   default: true,
  //   group: 'Chart',
  // },
  // legend: {
  //   type: 'boolean',
  //   label: 'Show legend',
  //   default: false,
  //   group: 'Chart',
  // },

  // legendHoverLink: {
  //   type: 'boolean',
  //   label: 'Show legend hover link ',
  //   default: false,
  //   group: 'Chart',
  //   disabled: {
  //     legend: false,
  //   },
  // },
}

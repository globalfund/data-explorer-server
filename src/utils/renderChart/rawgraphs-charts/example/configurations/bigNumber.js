import bigNumber from 'rawcharts/bigNumber'

const data = [
  {
    title: 'GLOBAL TEMPERATURE',
    value: 1.4,
    subtitle: '°C SINCE 1880',
    description: 'Dec. 2022 increase in global temperature vs 1900s average',
  },
]

export default {
  chart: bigNumber,
  data,
  dataTypes: {
    title: 'string',
    value: 'number',
    subtitle: 'string',
    description: 'string',
  },
  mapping: {
    title: { value: ['title'] },
    value: { value: ['value'] },
    subtitle: { value: ['subtitle'] },
    description: { value: ['description'] },
  },
}

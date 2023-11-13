import echartsGeomap from 'rawcharts/echartsGeomap'
import data from '../datasets/athletes.csv'

export default {
  chart: echartsGeomap,
  data,
  dataTypes: {
    nationality: 'string',
    gold: 'number',
  },
  mapping: {
    country: { value: ['nationality'] },
    size: { value: ['gold'] },
  },
  visualOptions: {
    width: 1200,
    height: 700,
  },
}

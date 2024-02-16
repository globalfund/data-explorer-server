import treemap from 'rawcharts/echartsTreemap'
import data from '../datasets/football-players.csv'

export default {
  chart: treemap,
  data,
  dataTypes: {
    Nationality: 'string',
    Club: 'string',
    Name: 'string',
    Acceleration: 'number',
  },
  mapping: {
    hierarchy: { value: ['Nationality', 'Club', 'Name'] },
    size: {
      value: ['Acceleration'],
      config: { aggregation: ['sum'] },
    },
  },
  visualOptions: {
    width: 1200,
    height: 700,
  },
}

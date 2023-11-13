import echartsBarchart from 'rawcharts/echartsBarchart'
import data from '../datasets/football-players.csv'

export default {
  chart: echartsBarchart,
  data,
  dataTypes: {
    Nationality: 'string',
    Club: 'string',
    Name: 'string',
    Acceleration: 'number',
  },
  mapping: {
    bars: { value: ['Nationality'] },
    size: { value: ['Acceleration'] },
  },
  visualOptions: {
    width: 1000,
    height: 700,
    padding: 3,
    marginTop: 20,
    marginBottom: 20,
    marginRight: 20,
    marginLeft: 50,
    sortSeriesBy: 'Value (descending)',
    orient: 'horizontal',
  },
}

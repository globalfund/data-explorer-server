import echartsSankey from 'rawcharts/echartsSankey'
import data from '../datasets/Titanic.tsv'

export default {
  chart: echartsSankey,
  data,
  dataTypes: {
    Class: 'number',
    Survival: 'string',
    Name: 'string',
    Gender: 'string',
    'Age group': 'string',
    Age: 'number',
    'Siblings / Spouse aboard': 'number',
    'Parents / Children aboard': 'number',
    'Ticket number': 'number',
    Fare: 'number',
    'Fare group': 'number',
    Cabin: 'string',
    'Port of Embarkation': 'string',
    Boat: 'string',
    Destination: 'string',
  },
  mapping: {
    steps: { value: ['Class', 'Survival', 'Age group', 'Gender'] },
  },
  visualOptions: {
    width: 1200,
    height: 700,
    barsOrientation: 'horizontal',
  },
}

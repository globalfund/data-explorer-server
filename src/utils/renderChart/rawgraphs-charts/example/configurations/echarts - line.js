import echartsLinechart from 'rawcharts/echartsLinechart'
import data from '../datasets/Music.csv'

export default {
  chart: echartsLinechart,
  data,
  dataTypes: {
    Category: 'string',
    Format: 'string',
    Year: 'number',
    Units: 'number',
    Revenues: 'number',
    'Revenues-Adjusted': 'number',
    Year_date: {
      type: 'date',
      dateFormat: 'YYYY-MM-DD',
    },
  },
  mapping: {
    lines: { value: ['Category'] },
    x: { value: ['Year'] },
    y: { value: ['Revenues-Adjusted'] },
  },
  visualOptions: {
    width: 1000,
    height: 700,
    padding: 3,
    marginTop: 20,
    marginBottom: 20,
    marginRight: 20,
    marginLeft: 50,
  },
}

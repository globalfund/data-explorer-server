import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

function uniq(value, index, self) {
  return self.indexOf(value) === index
}

export const mapData = function (data, mapping, dataTypes, dimensions) {
  const yAggregator = getDimensionAggregator(
    'y',
    mapping,
    dataTypes,
    dimensions
  )

  // add the non-compulsory dimensions.
  'series' in mapping ? null : (mapping.series = { value: undefined })
  'lines' in mapping ? null : (mapping.lines = { value: undefined })

  let results = []

  d3.rollups(
    data,
    (v) =>
      d3.rollups(
        v,
        (vv) => {
          const item = {
            x: vv[0][mapping.x.value], //get the first one since it's grouped
            y: yAggregator(vv.map((d) => d[mapping.y.value])), // aggregate
            lines: vv[0][mapping.lines.value], //get the first one since it's grouped
          }
          results.push(item)
        },
        (d) => d[mapping.x.value].toString() // sub-group functions. toString() to enable grouping on dates
      ),
    // (d) => d[mapping.series.value], // series grouping
    (d) => d[mapping.lines.value] // group functions
  )

  // create nest structure
  const nestedData = d3.rollups(
    results,
    (v) => v.sort((a, b) => d3.ascending(a.x, b.x)),
    (d) => d.lines
  )

  return {
    xAxisValues: results
      .map((d) => d.x)
      .filter(uniq)
      .sort((a, b) => a - b),
    lines: nestedData,
  }
}

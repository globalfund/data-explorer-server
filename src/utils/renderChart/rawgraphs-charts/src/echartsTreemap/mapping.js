import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

function getFormattedItemData(d, depth, maxDepth, path) {
  const itemPath = `${path}${path.length > 0 ? '/' : ''}${d.data[0]}`
  const itemChildren = d.children
    ? (d.children || []).map((c) => {
        return getFormattedItemData(c, depth + 1, maxDepth, itemPath)
      })
    : undefined
  const item = {
    name: d.data[0],
    value: d.value,
    path: itemPath,
    children: itemChildren,
  }
  return item
}
export const mapData = function (data, mapping, dataTypes, dimensions) {
  const sizeAggregator = getDimensionAggregator(
    'size',
    mapping,
    dataTypes,
    dimensions
  )

  // add the non-compulsory dimensions.
  'size' in mapping ? null : (mapping.size = { value: undefined })

  const results = []

  d3.rollups(
    data,
    (v) => {
      const item = {
        hierarchy: new Map(mapping.hierarchy.value.map((d) => [d, v[0][d]])), //get the first one since it's grouped
        size: mapping.size.value
          ? sizeAggregator(v.map((d) => d[mapping.size.value]))
          : v.length,
      }

      results.push(item)
      return item
    },
    ...mapping.hierarchy.value.map((level) => (d) => d[level]) // create a grouping for each level of the hierarchy
  )

  const nest = d3.rollup(
    results,
    (v) => v[0],
    ...mapping.hierarchy.value.map((level) => (d) => d.hierarchy.get(level))
  )

  const hierarchy = d3
    .hierarchy(nest)
    .sum((d) => (d[1] instanceof Map ? 0 : d[1].size))

  const formattedData = hierarchy.children.map((d) =>
    getFormattedItemData(d, 0, mapping.hierarchy.value.length, '')
  )

  return formattedData
}

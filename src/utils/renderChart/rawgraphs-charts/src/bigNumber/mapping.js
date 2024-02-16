import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

export function formatLargeAmountsWithPrefix(n) {
  if (!n) return ''
  if (Math.abs(Number(n)) >= 1.0e9) {
    return `${(Math.abs(Number(n)) / 1.0e9).toFixed(2)}b`
  }
  if (Math.abs(Number(n)) >= 1.0e6) {
    return `${(Math.abs(Number(n)) / 1.0e6).toFixed(2)}m`
  }
  if (Math.abs(Number(n)) >= 1.0e3) {
    return `${(Math.abs(Number(n)) / 1.0e6).toFixed(2)}k`
  }
  return `${formatFinancialValue(n)}`
}

export const mapData = function (data, mapping, dataTypes, dimensions) {
  // define aggregators
  const sizeAggregator = getDimensionAggregator(
    'value',
    mapping,
    dataTypes,
    dimensions
  )
  const value = sizeAggregator(data.map((d) => d[mapping.value.value]))

  return {
    value: value > 999 ? formatLargeAmountsWithPrefix(value) : value,
  }
}

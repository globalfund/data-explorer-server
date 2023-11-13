import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import { GridComponent, LegendComponent } from 'echarts/components'

echarts.use([GridComponent, LegendComponent, LineChart, SVGRenderer])

export function render(
  node,
  data,
  visualOptions,
  mapping,
  originalData,
  styles
) {
  const {
    // artboard
    width,
    height,
    background,
    // margins
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    // chart options
    stack,
    showLegend,
  } = visualOptions

  const chart = echarts.init(node, null, {
    renderer: 'svg',
    width,
    height,
  })

  const option = {
    grid: {
      top: marginTop,
      left: marginLeft,
      right: marginRight,
      bottom: marginBottom,
    },
    xAxis: {
      type: 'category',
      data: data.xAxisValues,
    },
    yAxis: {
      type: 'value',
    },
    legend: {
      show: showLegend,
      data: data.lines.map((d) => d[0]),
    },
    backgroundColor: background,
    series: data.lines.map((d) => ({
      type: 'line',
      name: d[0],
      data: d[1].map((l) => l.y),
      stack: stack ? 'Total' : undefined,
    })),
  }

  chart.setOption(option)
}

import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import { GridComponent } from 'echarts/components'

echarts.use([GridComponent, BarChart, SVGRenderer])

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
    // orientation,
  } = visualOptions

  const chart = echarts.init(node, null, {
    renderer: 'svg',
    width,
    height,
  })

  let xAxis = {
    data: data.map((d) => d.bars),
  }
  let yAxis = {
    type: 'value',
  }
  // if (orientation === 'horizontal') {
  //   xAxis = {
  //     type: 'value',
  //   }
  //   yAxis = {
  //     data: data.map((d) => d.bars),
  //   }
  // }

  const option = {
    grid: {
      top: marginTop,
      left: marginLeft,
      right: marginRight,
      bottom: marginBottom,
    },
    xAxis,
    yAxis,
    backgroundColor: background,
    series: [
      {
        name: '',
        type: 'bar',
        data: data.map((d) => d.size),
        realtimeSort: true,
      },
    ],
  }

  chart.setOption(option)
}

import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'

echarts.use([
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  MapChart,
  SVGRenderer,
])

export function render(
  node,
  data,
  visualOptions,
  mapping,
  originalData,
  styles
) {
  // destructurate visual visualOptions
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
  } = visualOptions

  const chart = echarts.init(node, null, {
    renderer: 'svg',
    width,
    height,
  })

  echarts.registerMap('World', data.geoJSON)

  const sizes = data.results.map((d) => d.value)

  const option = {
    tooltip: {
      trigger: 'item',
      showDelay: 0,
      transitionDuration: 0.2,
      confine: true,
      formatter: (params) => {
        if (params.value) {
          return `${params.name}: ${params.value}`
        }
      },
    },
    visualMap: {
      left: 'right',
      min: Math.min(...sizes),
      max: Math.max(...sizes),
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026',
        ],
      },
      text: ['High', 'Low'],
      calculable: true,
    },
    series: [
      {
        type: 'map',
        roam: true,
        map: 'World',
        data: data.results,
        top: marginTop,
        left: marginLeft,
        right: marginRight,
        bottom: marginBottom,
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: '#cdd4df',
          },
        },
        select: {
          disabled: true,
        },
      },
    ],
  }

  chart.setOption(option)
}

import * as echarts from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import { TooltipComponent } from 'echarts/components'

echarts.use([TooltipComponent, TreemapChart, SVGRenderer])

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
    // labels
    showLabels,
    labelFontSize,
    showBreadcrumbs,
    // tooltip
    showTooltip,
    isMonetaryValue,
  } = visualOptions

  const chart = echarts.init(node, null, {
    // ssr: true,
    renderer: 'svg',
    width: visualOptions.width,
    height: visualOptions.height,
  })

  const option = {
    animation: false,
    backgroundColor: background,
    series: [
      {
        type: 'treemap',
        data,
        width,
        height,
        top: marginTop,
        left: marginLeft,
        right: marginRight,
        bottom: marginBottom,
        leafDepth: 1,
        label: {
          show: showLabels,
          fontSize: labelFontSize,
        },
        breadcrumb: {
          show: showBreadcrumbs,
        },
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  }

  chart.setOption(option)
  // node.innerHTML = chart.renderToSVGString()
}

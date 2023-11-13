import * as echarts from 'echarts/core'
import { SankeyChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import { TooltipComponent } from 'echarts/components'

echarts.use([TooltipComponent, SankeyChart, SVGRenderer])

function uniq(value, index, self) {
  return self.indexOf(value) === index
}

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
    nodesWidth,
    nodesPadding,
    linksOpacity,
    nodeAlign,
    orient,
    // Labels
    showLabels,
    labelPosition,
    labelRotation,
    labelFontSize,
  } = visualOptions

  const chart = echarts.init(node, null, {
    // ssr: true,
    renderer: 'svg',
    width: visualOptions.width,
    height: visualOptions.height,
  })

  let nodes = []
  data.forEach((d) => {
    nodes.push(d.source)
    nodes.push(d.target)
  })
  nodes = nodes.filter(uniq)
  nodes = nodes.map((d) => ({ name: d }))

  const option = {
    // animation: false,
    backgroundColor: background,
    series: [
      {
        type: 'sankey',
        data: nodes,
        links: data,
        width: width - marginRight,
        height: height - marginBottom,
        orient,
        nodeAlign,
        showLabels,
        labelPosition,
        labelRotation,
        left: marginLeft,
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        nodeGap: nodesPadding,
        nodeWidth: nodesWidth,
        emphasis: {
          focus: 'adjacency',
        },
        lineStyle: {
          curveness: 0.5,
          color: 'source',
          opacity: linksOpacity,
        },
        label: {
          fontSize: labelFontSize,
        },
      },
    ],
    // tooltip: {
    //   trigger: 'item',
    // },
  }

  chart.setOption(option)
  // node.innerHTML = chart.renderToSVGString()
}

export interface BudgetSankeyChartNode {
  name: string;
  level: number;
  itemStyle?: {
    color: string;
  };
}

export interface BudgetSankeyChartLink {
  value: number;
  source: string;
  target: string;
}

export interface BudgetSankeyChartData {
  nodes: BudgetSankeyChartNode[];
  links: BudgetSankeyChartLink[];
}

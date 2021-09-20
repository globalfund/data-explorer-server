export interface BudgetsFlowData {
  nodes: {
    id: string;
    filterStr: string;
    components?: {
      id: string;
      color: string;
      value: number;
      height: number;
    }[];
  }[];
  links: {
    value: number;
    source: string;
    target: string;
  }[];
}

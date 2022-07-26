export interface BudgetsTreemapDataItem {
  name: string;
  value: number;
  formattedValue: string;
  color: string;
  _children?: BudgetsTreemapDataItem[];
  tooltip: {
    header: string;
    componentsStats: {
      name: string;
      value: number;
    }[];
    value: number;
  };
}

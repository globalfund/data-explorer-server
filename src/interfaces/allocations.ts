export interface Allocations {
  total: number; // total investment value
  keys: string[]; // component names
  colors: string[]; // component colors
  values: number[]; // component values
}

export interface AllocationsTreemapDataItem {
  name: string;
  value: number;
  formattedValue: string;
  color: string;
  _children?: AllocationsTreemapDataItem[];
  tooltip: {
    header: string;
    componentsStats: {
      name: string;
      value: number;
    }[];
    value: number;
  };
}

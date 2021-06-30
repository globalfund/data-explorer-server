export interface PledgesContributionsData {
  data: Record<string, unknown>[];
}

export interface PledgesContributionsTreemapDataItem {
  name: string;
  value: number;
  formattedValue: string;
  color: string;
  _children?: PledgesContributionsTreemapDataItem[];
  tooltip: {
    header: string;
    componentsStats: {
      name: string;
      value: number;
    }[];
    value: number;
  };
}

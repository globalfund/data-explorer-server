export interface DisbursementsTreemapDataItem {
  name: string;
  code?: string;
  value: number;
  formattedValue: string;
  color: string;
  _children?: DisbursementsTreemapDataItem[];
  tooltip: {
    header: string;
    componentsStats: {
      name: string;
      count: number;
      investment: number;
    }[];
    totalInvestments: {
      committed: number;
      disbursed: number;
      signed: number;
    };
    percValue: string;
  };
}

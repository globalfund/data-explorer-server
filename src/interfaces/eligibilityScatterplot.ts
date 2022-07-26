export interface EligibilityScatterplotDataItem {
  x: number;
  y: string;
  incomeLevel: number;
  diseaseBurden: number;
  allocationCycleName?: string | null;
  eligibility: 'Eligible' | 'Not Eligible' | 'Transition Funding';
  invisible?: boolean;
}

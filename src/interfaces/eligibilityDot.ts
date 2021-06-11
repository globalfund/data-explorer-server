export interface EligibilityDotDataItem {
  name: string;
  items: {
    name: string;
    status: 'Eligible' | 'Not Eligible' | 'Transition Funding';
  }[];
}

export interface SearchResultItem {
  link: string;
  label: string;
  value: string;
  type?: string;
}

export interface SearchResultsTab {
  name: string;
  results: SearchResultItem[];
}

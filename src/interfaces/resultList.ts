export interface ResultListItemModel {
  id: string;
  title: string;
  value: number;
  component: string;
  geoLocations: {
    name: string;
    value: number;
  }[];
}

export interface ResultsInfoContentStats {
  name: string;
  value: number;
  description: string;
}

export interface ResultsInfoContent {
  description: string;
  stats: ResultsInfoContentStats[];
}

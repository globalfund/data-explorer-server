export interface GrantListItemModel {
  id: string;
  title: string;
  status: string;
  component: string;
  geoLocation: string;
  rating: string | null;
  disbursed: number;
  committed: number;
  signed: number;
}

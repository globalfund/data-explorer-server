export interface GrantListItemModel {
  code: string;
  title: string;
  status: string;
  component: string;
  location: string;
  rating: string | null;
  principalRecipient: string;
  disbursed: number;
  committed: number;
  signed: number;
  percentage: number;
}

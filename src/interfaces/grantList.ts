export interface GrantListItemModelV2 {
  id: string;
  title: string;
  status: string;
  component: string;
  geoLocation: string;
  rating: string | null;
  disbursed: number;
  committed: number;
  signed: number;
  recipientName: string;
  recipientShortName: string;
}

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

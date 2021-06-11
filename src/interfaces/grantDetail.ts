export interface GrantDetailInformation {
  title: string;
  code: string;
  rating: string;
  status: string;
  location: string;
  component: string;
  description: string;
  investments: {
    disbursed: number;
    committed: number;
    signed: number;
  };
  manager: {
    name: string;
    email: string;
  };
}

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
  principalRecipient: {
    code: string;
    name: string;
    shortName: string;
  };
}

export interface GrantDetailPeriod {
  number: number;
  startDate: string;
  endDate: string;
}

export interface GrantDetailPeriodInformation {
  disbursed: number;
  committed: number;
  signed: number;
  rating: string;
}

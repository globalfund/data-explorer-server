export interface FilterGroupOption {
  label: string;
  value: string;
  subOptions?: FilterGroupOption[];
  extraInfo?: {
    [key: string]: any;
  };
}

export interface FilterGroup {
  name: string;
  options: FilterGroupOption[];
}

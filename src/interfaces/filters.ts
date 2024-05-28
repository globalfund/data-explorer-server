export interface FilterGroupOption {
  name: string;
  value: string;
  options?: FilterGroupOption[];
  extraInfo?: {
    [key: string]: any;
  };
}

export interface FilterGroup {
  name: string;
  options: FilterGroupOption[];
}

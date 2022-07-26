export interface FilterGroupOption {
  label: string;
  value: string;
  subOptions?: FilterGroupOption[];
}

export interface FilterGroup {
  name: string;
  enabled: boolean;
  options: FilterGroupOption[];
}

export interface DocumentsTableRow {
  name: string;
  link?: string;
  count?: number;
  docCategories?: DocumentsTableRow[];
  docs?: {
    title: string;
    link: string;
  }[];
}

export class PaginationQueries {
  limit?: number = 10;
  page?: number = 1;
  search?: string;
  orderBy?: string;
  sortedBy?: SortOrder;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

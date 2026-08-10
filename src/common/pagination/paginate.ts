import { PaginatorInfo } from '../dto/paginator-info.dto';

export function paginate(
  totalItems: number,
  current_page = 1,
  pageSize = 10,
  count = 0,
  url = '',
): PaginatorInfo {
  // calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // ensure current page isn't out of range
  if (current_page < 1) {
    current_page = 1;
  } else if (current_page > totalPages) {
    current_page = totalPages;
  }

  const startIndex = (current_page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  return {
    total: totalItems,
    current_page: +current_page,
    count,
    last_page: totalPages,
    firstItem: 0 > startIndex ? 0 : startIndex,
    lastItem: 0 > endIndex ? 0 : endIndex,
    per_page: pageSize,
    first_page_url: `${process.env.API_URL}${url}&page=1`,
    last_page_url: `${process.env.API_URL}${url}&page=${totalPages}`,
    next_page_url:
      totalPages > current_page
        ? `${process.env.API_URL}${url}&page=${Number(current_page) + 1}`
        : '',
    prev_page_url:
      current_page > 1
        ? `${process.env.API_URL}${url}&page=${current_page - 1}`
        : '',
  };
}

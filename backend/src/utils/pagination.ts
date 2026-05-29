export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (query: {
  page?: string;
  limit?: string;
}): PaginationParams => {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10', 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

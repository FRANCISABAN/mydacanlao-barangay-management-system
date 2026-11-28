import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '../config/constants.js'

// 2.1.3 / 2.2.3 ?page=2&pageSize=10. Bad values fall back to safe ones instead of failing the request.
export function parsePaging({ page, pageSize } = {}) {
  const p = Math.floor(Number(page))
  const s = Math.floor(Number(pageSize))
  const size = Number.isFinite(s) && s >= 1 ? Math.min(s, PAGE_SIZE_MAX) : PAGE_SIZE_DEFAULT
  const current = Number.isFinite(p) && p >= 1 ? p : 1
  return { page: current, pageSize: size, offset: (current - 1) * size }
}

export const pageResult = (items, total, { page, pageSize }) => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
})

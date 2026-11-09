import { z } from "zod";

/** `meta` on every paginated list (`page`, `pageSize` query params) */
export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

/** A list reply as http.ts and httpServer resolve it: `{ items, meta }` */
export function pageSchema<Item extends z.ZodType>(item: Item) {
  return z.object({ items: z.array(item), meta: paginationMetaSchema });
}

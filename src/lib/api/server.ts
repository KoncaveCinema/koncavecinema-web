import "server-only";

import axios, { type AxiosRequestConfig } from "axios";

import { env } from "@/env";

import { toApiError } from "./errors";
import type { ApiEnvelope, Paginated } from "./types";

/**
 * Client for Server Components and route handlers: public, anonymous data only (catalog, film
 * pages, showtimes). It never carries a user's token or cookies, so its responses can be cached
 * with `"use cache"` and shared between visitors.
 */
const serverClient = axios.create({
  baseURL: env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

serverClient.interceptors.request.use((config) => {
  config.headers.set("X-Request-Id", `web-ssr-${crypto.randomUUID()}`);
  return config;
});

serverClient.interceptors.response.use(undefined, (error: unknown) => {
  throw toApiError(error);
});

export const serverApi = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await serverClient.get<ApiEnvelope<T>>(url, config);
    return response.data.data;
  },
  getPage: async <T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> => {
    const response = await serverClient.get<ApiEnvelope<T[]>>(url, config);
    const { data, meta } = response.data;
    if (!meta) throw new Error(`Expected a paginated response from ${url}`);
    return { items: data, meta };
  },
};

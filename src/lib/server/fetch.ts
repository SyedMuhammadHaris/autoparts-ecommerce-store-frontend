import "server-only";
import { backendConfiguration } from "./backend-configuration";
import { ApiError, apiPath, responseData, requestMethod, type ApiOptions } from "@/lib/api/contracts";

type ServerOptions = ApiOptions & { accessToken?: string; guestToken?: string; requestId?: string };
export async function serverFetch<T>(options: ServerOptions): Promise<T> {
  const path = apiPath(options);
  if (!/^\/(auth|catalog|cart|checkout|orders|shipping|health|admin|content)\//.test(path)) throw new ApiError("Invalid backend path.", 400);
  const { baseUrl, timeoutMs } = backendConfiguration();
  const method = requestMethod(options);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
  if (options.guestToken) headers["X-Cart-Token"] = options.guestToken;
  if (options.requestId) headers["X-Request-ID"] = options.requestId;
  if (options.payload !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try { response = await fetch(baseUrl + path, { method, headers,
    body: options.payload === undefined ? undefined : JSON.stringify(options.payload), cache: "no-store", redirect: "error",
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs) }); }
  catch { throw new ApiError("This service is temporarily unavailable.", 503); }
  return responseData<T>(response);
}

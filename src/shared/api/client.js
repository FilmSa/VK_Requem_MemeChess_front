import { buildApiUrl } from "../config/api.js";

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.fields = options.fields ?? null;
    this.payload = options.payload ?? null;
  }
}

export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    token,
    headers = {},
    body,
    ...restOptions
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const requestOptions = {
    method,
    headers: requestHeaders,
    ...restOptions,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(path), requestOptions);
  const isJsonResponse = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Запрос завершился с ошибкой (${response.status})`,
      {
        status: response.status,
        fields: payload?.fields ?? null,
        payload,
      }
    );
  }

  return payload;
}

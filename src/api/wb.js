const DEFAULT_REPORTS_API_BASE_URL = import.meta.env.DEV
  ? "/wb-api"
  : "https://statistics-api.wildberries.ru";

const REPORTS_API_BASE_URL = (import.meta.env.VITE_WB_API_BASE_URL || DEFAULT_REPORTS_API_BASE_URL).replace(/\/$/, "");
const responseCache = new Map();

export const WB_REPORTS_AVAILABLE_FROM = "2024-01-29";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJsonResponse(response, fallbackErrorText) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fallbackErrorText}: ${text.slice(0, 200) || "пусто"}`);
  }
}

async function requestReport({ token, dateFrom, dateTo, signal }) {
  const params = new URLSearchParams({
    dateFrom,
    dateTo,
    limit: "100000",
    rrdid: "0",
  });

  const url = `${REPORTS_API_BASE_URL}/api/v5/supplier/reportDetailByPeriod?${params.toString()}`;
  const cacheKey = `${dateFrom}:${dateTo}`;

  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
      signal,
    });

    if (response.status === 204) {
      responseCache.set(cacheKey, []);
      return [];
    }

    if (response.status === 401) {
      throw new Error("WB API вернул 401. Проверьте VITE_WB_API_TOKEN.");
    }

    if (response.status === 429) {
      if (attempt === 0) {
        await sleep(1200);
        continue;
      }
      throw new Error("WB API временно ограничил запросы. Подождите немного и попробуйте ещё раз.");
    }

    if (!response.ok) {
      const text = await response.text();
      const shortText = text
        .replace(/\s+/g, " ")
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 200);
      throw new Error(`WB API вернул HTTP ${response.status}: ${shortText || "пусто"}`);
    }

    const data = await parseJsonResponse(response, "WB API вернул не JSON");

    if (data === null) {
      responseCache.set(cacheKey, []);
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error("WB API вернул неожиданный формат ответа.");
    }

    responseCache.set(cacheKey, data);
    return data;
  }

  throw new Error("Не удалось получить данные WB API.");
}

export async function fetchReportDetails({ token, dateFrom, dateTo, signal }) {
  if (!token) {
    throw new Error("Не найден VITE_WB_API_TOKEN в .env");
  }

  return requestReport({ token, dateFrom, dateTo, signal });
}

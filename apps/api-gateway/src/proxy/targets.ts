function parseUrls(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function toServiceUrls(urls: string[], fallback?: string): string[] {
  const list = urls.length ? urls : fallback ? [fallback] : [];
  if (!list.length) {
    throw new Error('Missing service URLs');
  }
  return list;
}

export function getHttpServiceUrls(): string[] {
  return toServiceUrls(parseUrls(process.env.HTTP_SERVICE_URLS), process.env.HTTP_SERVICE_URL);
}

export function getChatServiceUrls(): string[] {
  return toServiceUrls(parseUrls(process.env.CHAT_SERVICE_URLS), process.env.CHAT_SERVICE_URL);
}

export function getWsServiceUrls(): string[] {
  return toServiceUrls(parseUrls(process.env.WS_SERVICE_URLS), process.env.WS_SERVICE_URL);
}


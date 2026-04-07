const PROXY_MAP: Record<string, string> = {
  '/uefa-api': 'https://match.uefa.com',
  '/ligue1-api': 'https://ma-api.ligue1.fr',
}

const originalFetch = globalThis.fetch

globalThis.fetch = function patchedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (typeof input === 'string') {
    for (const [prefix, target] of Object.entries(PROXY_MAP)) {
      if (input.startsWith(prefix)) {
        const realUrl = target + input.slice(prefix.length)
        return originalFetch(realUrl, init)
      }
    }
  }
  return originalFetch(input, init)
}

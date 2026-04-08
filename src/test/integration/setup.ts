const PROXY_MAP: Record<string, string> = {
  '/uefa-api': 'https://match.uefa.com',
  '/ligue1-api': 'https://ma-api.ligue1.fr',
  '/pl-api': 'https://sdp-prem-prod.premier-league-prod.pulselive.com',
}

const originalFetch = globalThis.fetch

globalThis.fetch = function patchedFetch(
  input: string | URL | Request,
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

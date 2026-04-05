const fifaToIso2: Record<string, string> = {
  AFG: 'af', ALB: 'al', ALG: 'dz', AND: 'ad', ANG: 'ao', ARG: 'ar', ARM: 'am',
  AUS: 'au', AUT: 'at', AZE: 'az', BAH: 'bs', BHR: 'bh', BAN: 'bd', BRB: 'bb',
  BLR: 'by', BEL: 'be', BLZ: 'bz', BEN: 'bj', BER: 'bm', BHU: 'bt', BOL: 'bo',
  BIH: 'ba', BOT: 'bw', BRA: 'br', BRU: 'bn', BUL: 'bg', BFA: 'bf', BDI: 'bi',
  CAM: 'kh', CMR: 'cm', CAN: 'ca', CPV: 'cv', CTA: 'cf', CHA: 'td', CHI: 'cl',
  CHN: 'cn', COL: 'co', COM: 'km', CGO: 'cg', COD: 'cd', CRC: 'cr', CIV: 'ci',
  CRO: 'hr', CUB: 'cu', CYP: 'cy', CZE: 'cz', DEN: 'dk', DJI: 'dj', DMA: 'dm',
  DOM: 'do', ECU: 'ec', EGY: 'eg', SLV: 'sv', GNQ: 'gq', ERI: 'er', EST: 'ee',
  ETH: 'et', FIJ: 'fj', FIN: 'fi', FRA: 'fr', GAB: 'ga', GAM: 'gm', GEO: 'ge',
  GER: 'de', GHA: 'gh', GRE: 'gr', GRN: 'gd', GUA: 'gt', GUI: 'gn', GNB: 'gw',
  GUY: 'gy', HAI: 'ht', HON: 'hn', HKG: 'hk', HUN: 'hu', ISL: 'is', IND: 'in',
  IDN: 'id', IRN: 'ir', IRQ: 'iq', IRL: 'ie', ISR: 'il', ITA: 'it', JAM: 'jm',
  JPN: 'jp', JOR: 'jo', KAZ: 'kz', KEN: 'ke', KOR: 'kr', KUW: 'kw', KGZ: 'kg',
  LAO: 'la', LVA: 'lv', LBN: 'lb', LES: 'ls', LBR: 'lr', LBY: 'ly', LIE: 'li',
  LTU: 'lt', LUX: 'lu', MKD: 'mk', MAD: 'mg', MWI: 'mw', MAS: 'my', MDV: 'mv',
  MLI: 'ml', MLT: 'mt', MTN: 'mr', MRI: 'mu', MEX: 'mx', MDA: 'md', MNG: 'mn',
  MNE: 'me', MAR: 'ma', MOZ: 'mz', MYA: 'mm', NAM: 'na', NEP: 'np', NED: 'nl',
  NZL: 'nz', NCA: 'ni', NIG: 'ne', NGA: 'ng', NOR: 'no', OMA: 'om', PAK: 'pk',
  PAN: 'pa', PNG: 'pg', PAR: 'py', PER: 'pe', PHI: 'ph', POL: 'pl', POR: 'pt',
  QAT: 'qa', ROU: 'ro', RUS: 'ru', RWA: 'rw', SKN: 'kn', LCA: 'lc', VIN: 'vc',
  SAM: 'ws', SMR: 'sm', STP: 'st', KSA: 'sa', SEN: 'sn', SRB: 'rs', SEY: 'sc',
  SLE: 'sl', SIN: 'sg', SVK: 'sk', SVN: 'si', SOL: 'sb', SOM: 'so', RSA: 'za',
  ESP: 'es', SRI: 'lk', SUD: 'sd', SUR: 'sr', SWZ: 'sz', SWE: 'se', SUI: 'ch',
  SYR: 'sy', TPE: 'tw', TJK: 'tj', TAN: 'tz', THA: 'th', TLS: 'tl', TOG: 'tg',
  TGA: 'to', TRI: 'tt', TUN: 'tn', TUR: 'tr', TKM: 'tm', UGA: 'ug', UKR: 'ua',
  UAE: 'ae', ENG: 'gb-eng', SCO: 'gb-sct', WAL: 'gb-wls', NIR: 'gb-nir',
  USA: 'us', URU: 'uy', UZB: 'uz', VAN: 'vu', VEN: 've', VIE: 'vn',
  YEM: 'ye', ZAM: 'zm', ZIM: 'zw', KVX: 'xk',
}

export function getFlagUrl(countryCode: string, size = 40): string {
  const iso2 = fifaToIso2[countryCode] ?? countryCode.toLowerCase().slice(0, 2)
  return `https://flagcdn.com/w${size}/${iso2}.png`
}

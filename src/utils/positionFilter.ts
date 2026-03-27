/** Position tab id: all | sp | rp | p | c | 1b | 2b | 3b | ss | of | dh | if */
export function matchesPositionTab(pos: string, tab: string): boolean {
  const t = tab.toLowerCase()
  if (t === 'all') return true
  const p = pos.toUpperCase()
  const tokens = pos.split(/[/,]/).map((s) => s.trim().toUpperCase())

  if (t === 'p') {
    return tokens.some((x) => x === 'SP' || x === 'RP') || p.includes('SP') || p.includes('RP')
  }
  if (t === 'sp') {
    return tokens.includes('SP') || /\bSP\b/.test(p) || (p.includes('SP') && !tokens.includes('RP'))
  }
  if (t === 'rp') {
    return tokens.includes('RP') || /\bRP\b/.test(p) || p.includes('RP')
  }
  if (t === 'if') {
    return /(1B|2B|3B|SS)/.test(p)
  }
  if (t === 'of') {
    return p.includes('OF')
  }
  if (t === 'dh') {
    return p.includes('DH')
  }
  if (t === 'c') {
    return /\bC\b/.test(p) || p.startsWith('C/')
  }
  if (t === '1b') return p.includes('1B')
  if (t === '2b') return p.includes('2B')
  if (t === '3b') return p.includes('3B')
  if (t === 'ss') return p.includes('SS')
  return false
}

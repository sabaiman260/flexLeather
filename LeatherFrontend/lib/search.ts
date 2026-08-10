export type SearchProduct = {
  id: string
  slug?: string
  name: string
  price?: number
  image?: string
  category?: string
  brand?: string
  description?: string
  tags?: string[]
}

type Result = {
  product: SearchProduct
  score: number
  matchedFields: string[]
}

function normalize(s?: string) {
  return (s || '').toLowerCase()
}

export function scoreProduct(p: SearchProduct, q: string): Result {
  const qn = normalize(q)
  const tokens = qn.split(/\s+/).filter(Boolean)
  let score = 0
  const matchedFields: string[] = []

  const name = normalize(p.name)
  const category = normalize(p.category)
  const brand = normalize(p.brand)
  const desc = normalize(p.description)
  const tags = (p.tags || []).map(t => normalize(t))

  for (const t of tokens) {
    if (!t) continue
    if (name === t) { score += 120; if (!matchedFields.includes('name')) matchedFields.push('name') }
    else if (name.startsWith(t)) { score += 100; if (!matchedFields.includes('name')) matchedFields.push('name') }
    else if (name.includes(t)) { score += 80; if (!matchedFields.includes('name')) matchedFields.push('name') }

    if (category === t) { score += 70; if (!matchedFields.includes('category')) matchedFields.push('category') }
    else if (category.includes(t)) { score += 40; if (!matchedFields.includes('category')) matchedFields.push('category') }

    if (brand === t) { score += 70; if (!matchedFields.includes('brand')) matchedFields.push('brand') }
    else if (brand.includes(t)) { score += 40; if (!matchedFields.includes('brand')) matchedFields.push('brand') }

    if (desc.includes(t)) { score += 20; if (!matchedFields.includes('description')) matchedFields.push('description') }

    for (const tg of tags) {
      if (tg === t) { score += 50; if (!matchedFields.includes('tags')) matchedFields.push('tags') }
      else if (tg.includes(t)) { score += 30; if (!matchedFields.includes('tags')) matchedFields.push('tags') }
    }
  }

  // small boost for shorter names that matched
  if (tokens.length > 0 && matchedFields.includes('name')) {
    score += Math.max(0, 10 - Math.floor(name.length / 20))
  }

  return { product: p, score, matchedFields }
}

export function searchProducts(products: SearchProduct[], q: string, limit = 10): Result[] {
  if (!q || !q.trim()) return []
  const results = products.map(p => scoreProduct(p, q)).filter(r => r.score > 0)
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

export function getPopularTerms(products: SearchProduct[], max = 6): string[] {
  // return top categories and top tags
  const catCount = new Map<string, number>()
  const tagCount = new Map<string, number>()
  for (const p of products) {
    const c = normalize(p.category)
    if (c) catCount.set(c, (catCount.get(c) || 0) + 1)
    for (const t of p.tags || []) {
      const tt = normalize(t)
      if (tt) tagCount.set(tt, (tagCount.get(tt) || 0) + 1)
    }
  }
  const cats = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).map(x => x[0])
  const tags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).map(x => x[0])
  const merged = [...cats, ...tags].filter(Boolean)
  return merged.slice(0, max)
}

export default { scoreProduct, searchProducts, getPopularTerms }

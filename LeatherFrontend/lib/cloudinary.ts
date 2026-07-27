export function cloudinaryOptimize(url?: string | null, preferredWidth?: number): string | undefined {
  if (!url) return url as any
  try {
    const str = String(url)
    if (!str.includes('res.cloudinary.com') || !str.includes('/upload/')) return str

    const [prefix, afterUpload] = str.split('/upload/')
    if (!afterUpload) return str

    // separate querystring if present
    const qIdx = afterUpload.indexOf('?')
    const rest = qIdx >= 0 ? afterUpload.slice(0, qIdx) : afterUpload
    const query = qIdx >= 0 ? afterUpload.slice(qIdx) : ''

    const parts = rest.split('/')
    const first = parts[0] || ''

    let transformations = ''
    let remainingPath = rest

    // If first segment is a version like v123, then there are no transformations
    if (/^v\d+$/i.test(first)) {
      const transforms: string[] = []
      if (preferredWidth) transforms.push(`w_${preferredWidth}`)
      transforms.push('f_auto', 'q_auto')
      transformations = transforms.join(',')
      remainingPath = rest
    } else {
      // first segment looks like existing transformations
      const existing = first
      const set = new Set(existing.split(',').filter(Boolean))
      set.add('f_auto')
      set.add('q_auto')
      transformations = Array.from(set).join(',')
      remainingPath = parts.slice(1).join('/')
    }

    // Build and return final URL, preserving querystring
    return `${prefix}/upload/${transformations}/${remainingPath}${query}`
  } catch (err) {
    return url as any
  }
}

export default cloudinaryOptimize

// Shared GTM/GA4 helper for ecommerce events
// Exports: pushGtmEcommerceEvent(eventName, payload)

type ActionField = {
  id?: string
  revenue?: number
  value?: number
  shipping?: number | null
  coupon?: string | null
  source?: string | null
}

type EcommercePayload = {
  actionField?: ActionField
  items?: any[]
}

export function pushGtmEcommerceEvent(eventName: string, payload: EcommercePayload = {}) {
  try {
    // Ensure dataLayer exists
    const w: any = typeof window !== 'undefined' ? window : {}
    w.dataLayer = w.dataLayer || []

    // Simple dedupe: ignore identical event payloads pushed within 800ms
    const last = w.__gtm_last_ecommerce_event || {}
    const now = Date.now()
    const hash = JSON.stringify({ eventName, payload })
    if (last.hash === hash && now - (last.ts || 0) < 800) {
      return // duplicate - ignore
    }

    w.__gtm_last_ecommerce_event = { hash, ts: now }

    // Build nested ecommerce object per requirements: ecommerce: { [eventName]: { actionField: {...}, items: [...] } }
    const ecommerceObj: any = {}
    ecommerceObj[eventName] = {
      actionField: payload.actionField || {},
      items: payload.items || []
    }

    // Push non-blocking - do not await anything, preserve existing flow
    w.dataLayer.push({
      event: eventName,
      ecommerce: ecommerceObj,
      // include a timestamp for easier debugging in GTM Preview
      eventTimestamp: now
    })
  } catch (err) {
    // Swallow analytics errors to avoid affecting app flow
    // But try to log in development
    if (typeof console !== 'undefined') console.debug('GTM push error', err)
  }
}

export default pushGtmEcommerceEvent

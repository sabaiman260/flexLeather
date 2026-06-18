import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Log to server console so production logs capture the details
    // eslint-disable-next-line no-console
    console.error('Client-reported app error:', JSON.stringify(body, null, 2))
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse error payload', err)
  }

  return NextResponse.json({}, { status: 204 })
}

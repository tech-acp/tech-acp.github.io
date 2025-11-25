import type { ACPApiBrevet } from './types'

export async function fetchBrevets(year: number): Promise<ACPApiBrevet[]> {
  const token = process.env.ACP_API_TOKEN

  if (!token) {
    throw new Error('ACP_API_TOKEN not configured in environment')
  }

  const url = `https://myaccount.audax-club-parisien.com/api/brm?year=${year}`
  const response = await fetch(url, {
    headers: { 'token': token }
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

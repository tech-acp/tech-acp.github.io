export class Geocoder {
  private lastRequestTime = 0
  private readonly RATE_LIMIT_MS = 1200

  async geocode(
    ville: string | null,
    departement: string | null,
    pays: string | null
  ): Promise<{ lat: number; lon: number } | null> {
    await this.waitForRateLimit()

    const addressParts = []
    if (ville && ville !== 'Pas encore déterminée') addressParts.push(ville)
    if (departement) addressParts.push(departement)
    if (pays) addressParts.push(pays)

    if (addressParts.length === 0) return null

    const query = addressParts.join(', ')
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BRM-Map-App/1.0 (Local Sync Script)'
        }
      })

      if (!response.ok) return null

      const data = await response.json()
      if (data.length === 0) return null

      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      }
    } catch (error) {
      console.error(`Geocoding error for "${query}":`, error)
      return null
    }
  }

  private async waitForRateLimit() {
    const elapsed = Date.now() - this.lastRequestTime
    if (elapsed < this.RATE_LIMIT_MS) {
      await new Promise(resolve =>
        setTimeout(resolve, this.RATE_LIMIT_MS - elapsed)
      )
    }
    this.lastRequestTime = Date.now()
  }
}

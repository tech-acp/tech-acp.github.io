import cliProgress from 'cli-progress'
import fs from 'fs/promises'
import path from 'path'

export interface SyncState {
  geocodedBrevetIds: number[]
  failedGeocodingIds: number[]
  timestamp: string
}

export class ProgressTracker {
  private state: SyncState | null = null
  private bar: cliProgress.SingleBar | null = null
  private statePath = path.join(process.cwd(), 'scripts', '.sync-state.json')

  async loadState(): Promise<SyncState | null> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8')
      this.state = JSON.parse(data)
      return this.state
    } catch {
      return null
    }
  }

  async saveState(state: SyncState) {
    this.state = state
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2))
  }

  async clearState() {
    try {
      await fs.unlink(this.statePath)
    } catch {}
  }

  startPhase(name: string, total: number) {
    this.bar = new cliProgress.SingleBar({
      format: `${name} |{bar}| {percentage}% | ETA: {eta}s | {value}/{total}`
    })
    this.bar.start(total, 0)
  }

  increment() {
    this.bar?.increment()
  }

  stop() {
    this.bar?.stop()
    this.bar = null
  }
}

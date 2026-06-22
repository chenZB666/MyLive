// src/main/danmaku/types.ts
import type { DanmakuEvent } from '../platform/adapter'

export { DanmakuEvent }

export interface ReconnectConfig {
  initialDelay: number   // 1000ms
  maxDelay: number       // 30000ms
  maxRetries: number     // 10
  factor: number         // 2
}

export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxRetries: 10,
  factor: 2
}

export interface DanmakuRoomConnection {
  roomId: string
  platform: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  onDanmaku: (event: DanmakuEvent) => void
  disconnect: () => void
}

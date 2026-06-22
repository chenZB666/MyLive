// src/main/danmaku/engine.ts
import type { DanmakuEvent, PlatformAdapter, DanmakuConnection } from '../platform/adapter'
import { DEFAULT_RECONNECT_CONFIG, type ReconnectConfig } from './types'

interface ConnectionEntry {
  roomId: string
  platform: string
  adapter: PlatformAdapter
  connection: DanmakuConnection | null
  retryCount: number
  config: ReconnectConfig
  onEvent: (event: DanmakuEvent) => void
  onStatusChange: (status: string) => void
  timer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
}

export class DanmakuEngine {
  private connections = new Map<string, ConnectionEntry>()

  connect(roomId: string, platform: string, adapter: PlatformAdapter, callbacks: {
    onEvent: (event: DanmakuEvent) => void
    onStatusChange: (status: string) => void
  }): void {
    const key = `${platform}:${roomId}`
    this.disconnect(roomId, platform)

    const entry: ConnectionEntry = {
      roomId,
      platform,
      adapter,
      connection: null,
      retryCount: 0,
      config: { ...DEFAULT_RECONNECT_CONFIG },
      onEvent: callbacks.onEvent,
      onStatusChange: callbacks.onStatusChange,
      timer: null,
      destroyed: false
    }
    this.connections.set(key, entry)
    this.establishConnection(entry)
  }

  disconnect(roomId: string, platform: string): void {
    const key = `${platform}:${roomId}`
    const entry = this.connections.get(key)
    if (!entry) return
    entry.destroyed = true
    if (entry.timer) clearTimeout(entry.timer)
    entry.connection?.close()
    this.connections.delete(key)
  }

  disconnectAll(): void {
    for (const [, entry] of this.connections) {
      entry.destroyed = true
      if (entry.timer) clearTimeout(entry.timer)
      entry.connection?.close()
    }
    this.connections.clear()
  }

  private establishConnection(entry: ConnectionEntry): void {
    if (entry.destroyed) return

    entry.onStatusChange('connecting')
    try {
      entry.connection = entry.adapter.connectDanmaku(entry.roomId)
      entry.connection.on('message', (rawMsg: any) => {
        if (entry.destroyed) return
        const event = this.normalizeEvent(rawMsg, entry.platform, entry.roomId)
        if (event) entry.onEvent(event)
      })
      entry.connection.on('close', () => {
        if (entry.destroyed) return
        this.handleDisconnect(entry)
      })
      entry.connection.on('error', (err: Error) => {
        console.error(`[Danmaku] ${entry.platform}:${entry.roomId} error:`, err)
        if (entry.destroyed) return
        entry.onStatusChange('error')
      })
      entry.onStatusChange('connected')
      entry.retryCount = 0
    } catch (err) {
      console.error(`[Danmaku] ${entry.platform}:${entry.roomId} connect failed:`, err)
      this.handleDisconnect(entry)
    }
  }

  private handleDisconnect(entry: ConnectionEntry): void {
    if (entry.destroyed) return
    entry.retryCount++
    if (entry.retryCount > entry.config.maxRetries) {
      entry.onStatusChange('error')
      return
    }
    const delay = Math.min(
      entry.config.initialDelay * Math.pow(entry.config.factor, entry.retryCount - 1),
      entry.config.maxDelay
    )
    entry.onStatusChange('disconnected')
    entry.timer = setTimeout(() => this.establishConnection(entry), delay)
  }

  private normalizeEvent(raw: any, platform: string, roomId: string): DanmakuEvent | null {
    try {
      switch (platform) {
        case 'bilibili': return this.normalizeBilibili(raw, roomId)
        case 'douyu': return this.normalizeDouyu(raw, roomId)
        default: return null
      }
    } catch {
      return null
    }
  }

  private normalizeBilibili(raw: any, _roomId: string): DanmakuEvent | null {
    if (raw?.cmd === 'DANMU_MSG') {
      const info = raw.info
      return {
        type: 'comment',
        userId: String(info[2]?.[0] || ''),
        userName: info[2]?.[1] || '',
        content: info[1] || '',
        color: info[0]?.[3] ? `#${info[0][3].toString(16)}` : undefined,
        timestamp: Date.now()
      }
    }
    if (raw?.cmd === 'SEND_GIFT') {
      const data = raw.data
      return {
        type: 'gift',
        userName: data?.uname || '',
        giftName: data?.giftName || '',
        count: data?.num || 1,
        price: data?.price || undefined
      }
    }
    if (raw?.cmd === 'INTERACT_WORD') {
      return {
        type: 'enter',
        userName: raw.data?.uname || ''
      }
    }
    return null
  }

  private normalizeDouyu(raw: any, _roomId: string): DanmakuEvent | null {
    if (raw?.type === 'chatmsg') {
      return {
        type: 'comment',
        userId: raw.uid || '',
        userName: raw.nn || '',
        content: raw.txt || '',
        color: raw.col ? `#${parseInt(raw.col).toString(16)}` : undefined,
        timestamp: Date.now()
      }
    }
    if (raw?.type === 'dgb') {
      return {
        type: 'gift',
        userName: raw.nn || '',
        giftName: raw.gfid || '礼物',
        count: raw.gfcnt || 1
      }
    }
    return null
  }
}

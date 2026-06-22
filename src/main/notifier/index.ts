// src/main/notifier/index.ts
import { Notification } from 'electron'
import { getStore } from '../store'
import { BilibiliAdapter } from '../platform/bilibili'
import { DouyuAdapter } from '../platform/douyu'
import { HuyaAdapter } from '../platform/huya'
import { DouyinAdapter } from '../platform/douyin'
import type { Platform, PlatformAdapter } from '../platform/adapter'

export class NotifierService {
  private timer: ReturnType<typeof setInterval> | null = null
  private notifiedToday = new Set<string>()
  private adapters = new Map<Platform, PlatformAdapter>([
    ['bilibili', new BilibiliAdapter()],
    ['douyu', new DouyuAdapter()],
    ['huya', new HuyaAdapter()],
    ['douyin', new DouyinAdapter()]
  ])

  start(): void {
    this.stop()
    const interval = getStore().getPollingInterval() * 1000
    this.timer = setInterval(() => this.check(), interval)
    this.check()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async check(): Promise<void> {
    const followed = getStore().getFollowedRooms()
    for (const room of followed) {
      const adapter = this.adapters.get(room.platform as Platform)
      if (!adapter) continue
      try {
        const info = await adapter.getRoomInfo(room.roomId)
        if (info.isLive && !this.notifiedToday.has(`${room.platform}:${room.roomId}`)) {
          this.sendNotification(info)
          this.notifiedToday.add(`${room.platform}:${room.roomId}`)
        }
        if (!info.isLive) {
          this.notifiedToday.delete(`${room.platform}:${room.roomId}`)
        }
      } catch {
        // API 失败时静默跳过
      }
    }
  }

  private sendNotification(info: any): void {
    const notification = new Notification({
      title: `${info.主播名称} 开播了！`,
      body: info.title || '正在直播',
      icon: info.avatar
    })
    notification.show()
  }
}
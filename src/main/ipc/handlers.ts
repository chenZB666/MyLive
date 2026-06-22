// src/main/ipc/handlers.ts
import { ipcMain, shell } from 'electron'
import type { PlatformAdapter, Platform, DanmakuEvent } from '../platform/adapter'
import { BilibiliAdapter } from '../platform/bilibili'
import { DouyuAdapter } from '../platform/douyu'
import { HuyaAdapter } from '../platform/huya'
import { DouyinAdapter } from '../platform/douyin'
import { DanmakuEngine } from '../danmaku/engine'
import { getStore } from '../store'

const adapters = new Map<Platform, PlatformAdapter>([
  ['bilibili', new BilibiliAdapter()],
  ['douyu', new DouyuAdapter()],
  ['huya', new HuyaAdapter()],
  ['douyin', new DouyinAdapter()]
])

const danmakuEngine = new DanmakuEngine()

// 用于向渲染进程发送事件
let sendToRenderer: ((channel: string, data: any) => void) | null = null

export function setSendToRenderer(fn: (channel: string, data: any) => void): void {
  sendToRenderer = fn
}

export function registerIpcHandlers(): void {
  ipcMain.handle('get-room-info', async (_event, platform: string, roomId: string) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) throw new Error(`不支持的平台: ${platform}`)
    return adapter.getRoomInfo(roomId)
  })

  ipcMain.handle('get-stream-url', async (_event, platform: string, roomId: string) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) throw new Error(`不支持的平台: ${platform}`)
    const cookie = getStore().getCookie(platform)
    return adapter.getStreamUrl({ roomId, cookie })
  })

  ipcMain.handle('search-rooms', async (_event, platform: string, keyword: string) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) throw new Error(`不支持的平台: ${platform}`)
    return adapter.searchRooms(keyword)
  })

  ipcMain.handle('connect-danmaku', async (_event, roomId: string, platform: string) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) return
    danmakuEngine.connect(roomId, platform, adapter, {
      onEvent: (event: DanmakuEvent) => {
        sendToRenderer?.('danmaku-event', { roomId, platform, event })
      },
      onStatusChange: (status: string) => {
        sendToRenderer?.('danmaku-status', { roomId, platform, status })
      }
    })
  })

  ipcMain.handle('disconnect-danmaku', async (_event, roomId: string, platform: string) => {
    danmakuEngine.disconnect(roomId, platform)
  })

  ipcMain.handle('get-followed-rooms', async () => {
    return getStore().getFollowedRooms()
  })

  ipcMain.handle('add-followed-room', async (_event, room: any) => {
    getStore().addFollowedRoom(room)
  })

  ipcMain.handle('remove-followed-room', async (_event, platform: string, roomId: string) => {
    getStore().removeFollowedRoom(platform, roomId)
  })

  ipcMain.handle('get-cookie', async (_event, platform: string) => {
    return getStore().getCookie(platform)
  })

  ipcMain.handle('set-cookie', async (_event, platform: string, cookie: string) => {
    getStore().setCookie(platform, cookie)
  })

  ipcMain.handle('open-external', async (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('get-categories', async (_event, platform: string) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) return []
    return adapter.getCategories()
  })

  ipcMain.handle('get-live-rooms', async (_event, platform: string, categoryId?: string, page?: number) => {
    const adapter = adapters.get(platform as Platform)
    if (!adapter) return []
    return adapter.getLiveRooms({ categoryId, page })
  })
}
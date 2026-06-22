// src/main/platform/huya.ts
import type { PlatformAdapter, RoomInfo, StreamInfo, LoginCredentials, DanmakuConnection, Category } from './adapter'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

export class HuyaAdapter implements PlatformAdapter {
  readonly platform = 'huya' as const

  private async fetchPage(roomId: string): Promise<string> {
    const resp = await fetch(`https://www.huya.com/${roomId}`, {
      headers: { 'User-Agent': UA }
    })
    return resp.text()
  }

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const html = await this.fetchPage(roomId)
    const m = html.match(/"liveStatus":\s*(\d)/)
    const titleMatch = html.match(/"introduction":\s*"([^"]+)"/)
    const nameMatch = html.match(/"nick":\s*"([^"]+)"/)
    return {
      platform: 'huya',
      roomId,
      title: titleMatch?.[1] || '',
      主播名称: nameMatch?.[1] || '',
      avatar: '',
      isLive: m?.[1] === '2' || false,
      viewerCount: 0,
      category: ''
    }
  }

  async getStreamUrl(params: { roomId: string; quality?: number; cookie?: string }): Promise<StreamInfo> {
    const html = await this.fetchPage(params.roomId)
    // 尝试多种方式提取虎牙直播流地址
    let url = ''
    // 方式1: 从 embedded data 中提取
    const dataMatch = html.match(/stream:\s*["']([^"']+)["']/)
    if (dataMatch) url = dataMatch[1]
    // 方式2: 从 flvUrl / hlsUrl 字段提取
    if (!url) {
      const flvMatch = html.match(/"flvUrl"\s*:\s*"([^"]+)"/)
      if (flvMatch) url = flvMatch[1]
    }
    if (!url) {
      const hlsMatch = html.match(/"hlsUrl"\s*:\s*"([^"]+)"/)
      if (hlsMatch) url = hlsMatch[1]
    }
    if (!url) throw new Error('虎牙 流地址获取失败')
    // 补全协议前缀
    if (url.startsWith('//')) url = 'https:' + url
    return { url, format: url.includes('.m3u8') ? 'hls' : 'flv' }
  }

  connectDanmaku(_roomId: string, _cookie?: string): DanmakuConnection {
    // TODO: 虎牙弹幕 WebSocket 协议对接（protobuf）
    const handlers = new Map<string, (...args: any[]) => void>()
    return {
      on(event: 'message' | 'close' | 'error', handler: (...args: any[]) => void) {
        handlers.set(event, handler)
      },
      close() {
        handlers.clear()
      }
    }
  }

  async searchRooms(keyword: string): Promise<RoomInfo[]> {
    // 虎牙搜索API已关闭，返回空（用户可通过房间号直接添加）
    return []
  }

  async getFollowedRooms(_cookie: string): Promise<RoomInfo[]> {
    return []
  }

  async login(credentials: LoginCredentials): Promise<string> {
    if (credentials.cookie) return credentials.cookie
    throw new Error('虎牙登录仅支持 Cookie 方式')
  }

  async getCategories(): Promise<Category[]> {
    return [
      { id: 'game', name: '游戏' },
      { id: 'entertainment', name: '娱乐' },
      { id: 'sports', name: '体育' },
      { id: 'esports', name: '电竞赛事' }
    ]
  }

  async getLiveRooms(_params: {
    categoryId?: string
    page?: number
    pageSize?: number
  }): Promise<RoomInfo[]> {
    // 虎牙所有搜索/列表API已关闭，无法获取直播列表
    // 用户可通过首页"添加直播间"功能，输入房间号直接观看
    return []
  }
}

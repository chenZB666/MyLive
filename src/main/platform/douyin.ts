// src/main/platform/douyin.ts
import type { PlatformAdapter, RoomInfo, StreamInfo, LoginCredentials, DanmakuConnection, Category } from './adapter'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function douyinFetch(url: string, extra?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...extra,
    headers: {
      'User-Agent': UA,
      'Referer': 'https://live.douyin.com',
      ...(extra?.headers || {})
    }
  })
}

export class DouyinAdapter implements PlatformAdapter {
  readonly platform = 'douyin' as const

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const resp = await douyinFetch(`https://live.douyin.com/${roomId}`)
    const html = await resp.text()
    const m = html.match(/<title>([^<]+)<\/title>/)
    return {
      platform: 'douyin',
      roomId,
      title: m?.[1] || '',
      主播名称: m?.[1]?.split('的直播间')[0] || '',
      avatar: '',
      isLive: html.includes('room_id'),
      viewerCount: 0,
      category: ''
    }
  }

  async getStreamUrl(params: { roomId: string; quality?: number; cookie?: string }): Promise<StreamInfo> {
    const resp = await douyinFetch(
      `https://live.douyin.com/webcast/room/web/enter/?room_id=${params.roomId || ''}&web_rid=${params.roomId}`,
      {
        headers: params.cookie ? { Cookie: params.cookie } : {}
      }
    )
    const data = await resp.json()
    const pullData = data?.data?.room?.stream_url
    if (!pullData) throw new Error('抖音 流地址获取失败')
    const url = pullData.hls_pull_url || pullData.flv_pull_url
    return { url, format: url?.includes('.m3u8') ? 'hls' : 'flv' }
  }

  connectDanmaku(_roomId: string, _cookie?: string): DanmakuConnection {
    // TODO: 抖音弹幕协议对接（protobuf，需登录态）
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
    const resp = await douyinFetch(
      `https://live.douyin.com/webcast/search/room/?keyword=${encodeURIComponent(keyword)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await resp.json()
    return (data.data?.room_list || []).map((r: any) => ({
      platform: 'douyin' as const,
      roomId: r.room_id_str || r.web_rid || String(r.room_id),
      title: r.title || '',
      主播名称: r.owner?.nickname || '',
      avatar: r.owner?.avatar_url || '',
      isLive: true,
      viewerCount: r.user_count_str,
      category: ''
    }))
  }

  async getFollowedRooms(_cookie: string): Promise<RoomInfo[]> {
    return []
  }

  async login(credentials: LoginCredentials): Promise<string> {
    if (credentials.cookie) return credentials.cookie
    throw new Error('抖音登录仅支持 Cookie 方式')
  }

  async getCategories(): Promise<Category[]> {
    return []  // 抖音无公开分类 API
  }

  async getLiveRooms(_params: {
    categoryId?: string
    page?: number
    pageSize?: number
  }): Promise<RoomInfo[]> {
    // 抖音无公开全量直播列表 API，返回空
    // 用户可通过搜索获取直播间
    return []
  }
}

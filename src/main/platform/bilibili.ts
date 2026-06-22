// src/main/platform/bilibili.ts
import type { PlatformAdapter, RoomInfo, StreamInfo, LoginCredentials, DanmakuConnection, Category } from './adapter'

// B站直播流需要在 common fetch 中补全的请求头
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function bilibiliFetch(url: string, extra?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...extra,
    headers: {
      'User-Agent': UA,
      'Referer': 'https://live.bilibili.com',
      ...(extra?.headers || {})
    }
  })
}

export class BilibiliAdapter implements PlatformAdapter {
  readonly platform = 'bilibili' as const

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const resp = await bilibiliFetch(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`)
    const data = await resp.json()
    if (data.code !== 0) throw new Error(`B站 API 错误: ${data.message}`)
    const info = data.data
    return {
      platform: 'bilibili',
      roomId,
      title: info.title || '',
      主播名称: info.uname || '',
      avatar: info.face || '',
      isLive: info.live_status === 1,
      viewerCount: info.online,
      category: info.area_name
    }
  }

  async getStreamUrl(params: { roomId: string; quality?: number; cookie?: string }): Promise<StreamInfo> {
    const resp = await bilibiliFetch(
      `https://api.live.bilibili.com/room/v1/Room/playUrl?cid=${params.roomId}&quality=${params.quality ?? 0}&platform=web`
    )
    const data = await resp.json()
    if (data.code !== 0) throw new Error(`B站 流地址获取失败: ${data.message}`)
    const durl = data.data.durl[0]
    return { url: durl.url, format: 'flv' }
  }

  connectDanmaku(roomId: string, _cookie?: string): DanmakuConnection {
    const handlers = new Map<string, (...args: any[]) => void>()
    let ws: WebSocket | null = null
    let closed = false

    function connect() {
      if (closed) return
      ws = new WebSocket('wss://broadcastlv.chat.bilibili.com/sub')
      ws.onopen = () => {
        const packet = buildBilibiliPacket(7, JSON.stringify({
          roomid: parseInt(roomId),
          platform: 'web',
          protover: 2
        }))
        ws!.send(packet)
      }
      ws.onmessage = (event) => {
        const events = parseBilibiliPacket(event.data as ArrayBuffer)
        for (const ev of events) {
          const handler = handlers.get('message')
          if (handler) handler(ev)
        }
      }
      ws.onclose = () => {
        const handler = handlers.get('close')
        if (handler) handler()
        if (!closed) setTimeout(connect, 5000)
      }
      ws.onerror = () => { ws?.close() }
    }

    connect()

    return {
      on(event: 'message' | 'close' | 'error', handler: (...args: any[]) => void) {
        handlers.set(event, handler)
      },
      close() {
        closed = true
        ws?.close()
        ws = null
      }
    }
  }

  async searchRooms(keyword: string): Promise<RoomInfo[]> {
    const resp = await bilibiliFetch(
      `https://api.live.bilibili.com/xlive/web-interface/v1/search?key=${encodeURIComponent(keyword)}`
    )
    const data = await resp.json()
    if (data.code !== 0) return []
    return (data.data.result || []).map((r: any) => ({
      platform: 'bilibili' as const,
      roomId: String(r.roomid),
      title: r.title || '',
      主播名称: r.uname || '',
      avatar: r.face || '',
      isLive: true,
      viewerCount: r.online,
      category: ''
    }))
  }

  async getFollowedRooms(cookie: string): Promise<RoomInfo[]> {
    const resp = await bilibiliFetch('https://api.live.bilibili.com/xlive/web-interface/v1/second/getList', {
      headers: { Cookie: cookie }
    })
    const data = await resp.json()
    if (data.code !== 0) return []
    return (data.data.list || []).map((r: any) => ({
      platform: 'bilibili' as const,
      roomId: String(r.roomid),
      title: r.title || '',
      主播名称: r.uname || '',
      avatar: r.face || '',
      isLive: r.live_status === 1,
      viewerCount: r.online,
      category: ''
    }))
  }

  async login(credentials: LoginCredentials): Promise<string> {
    if (credentials.cookie) return credentials.cookie
    throw new Error('B站登录仅支持 Cookie 方式')
  }

  async getCategories(): Promise<Category[]> {
    try {
      const resp = await bilibiliFetch('https://api.live.bilibili.com/room/v1/Area/getList')
      const data = await resp.json()
      if (data.code !== 0) return []
      return (data.data || []).map((area: any) => ({
        id: String(area.id),
        name: area.name
      }))
    } catch {
      return []
    }
  }

  async getLiveRooms(params: {
    categoryId?: string
    page?: number
    pageSize?: number
  }): Promise<RoomInfo[]> {
    try {
      const areaId = params.categoryId || ''
      const page = params.page || 1
      const resp = await bilibiliFetch(
        `https://api.live.bilibili.com/room/v1/Area/getRoomList?area_id=${areaId}&page=${page}&page_size=${params.pageSize || 30}`
      )
      const data = await resp.json()
      if (data.code !== 0) return []
      return (data.data || []).map((r: any) => ({
        platform: 'bilibili' as const,
        roomId: String(r.roomid),
        title: r.title || '',
        主播名称: r.uname || '',
        avatar: r.face || r.user_cover || '',
        isLive: true,
        viewerCount: r.online || 0,
        category: r.area_name || ''
      }))
    } catch {
      return []
    }
  }
}
function buildBilibiliPacket(type: number, body: string): ArrayBuffer {
  const encoder = new TextEncoder()
  const bodyBytes = encoder.encode(body)
  const packetLen = 16 + bodyBytes.byteLength
  const buf = new ArrayBuffer(packetLen)
  const view = new DataView(buf)
  view.setInt32(0, packetLen, true)
  view.setInt16(4, 16, true)
  view.setInt16(6, 1, true)
  view.setInt32(8, type, true)
  view.setInt32(12, 1, true)
  new Uint8Array(buf, 16).set(bodyBytes)
  return buf
}

function parseBilibiliPacket(data: ArrayBuffer): any[] {
  const view = new DataView(data)
  const results: any[] = []
  let offset = 0
  while (offset < data.byteLength) {
    const packetLen = view.getInt32(offset, true)
    const ver = view.getInt16(offset + 6, true)
    const type = view.getInt32(offset + 8, true)
    const body = new Uint8Array(data, offset + 16, packetLen - 16)
    if (type === 5) {
      const text = new TextDecoder().decode(body)
      try {
        const parsed = JSON.parse(text)
        results.push(parsed)
      } catch { /* 忽略解析失败 */ }
    } else if (ver === 2) {
      // 压缩消息 — 当前简化处理，后续可接入 zlib 解压
    }
    offset += packetLen
  }
  return results
}

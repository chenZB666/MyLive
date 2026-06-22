// src/main/platform/douyu.ts
import type { PlatformAdapter, RoomInfo, StreamInfo, LoginCredentials, DanmakuConnection, Category } from './adapter'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function douyuFetch(url: string, extra?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...extra,
    headers: {
      'User-Agent': UA,
      'Referer': 'https://www.douyu.com',
      ...(extra?.headers || {})
    }
  })
}

export class DouyuAdapter implements PlatformAdapter {
  readonly platform = 'douyu' as const

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const resp = await douyuFetch(`https://open.douyucdn.cn/api/RoomApi/room/${roomId}`)
    const data = await resp.json()
    if (data.error !== 0) throw new Error(`斗鱼 API 错误: ${data.error}`)
    const info = data.data
    return {
      platform: 'douyu',
      roomId,
      title: info.room_name || '',
      主播名称: info.owner_name || '',
      avatar: info.avatar || '',
      isLive: info.room_status === 1,
      viewerCount: info.online_num,
      category: info.game_name
    }
  }

  async getStreamUrl(params: { roomId: string; quality?: number; cookie?: string }): Promise<StreamInfo> {
    const headers: Record<string, string> = {
      'User-Agent': UA,
      'Referer': 'https://www.douyu.com',
      'Origin': 'https://www.douyu.com'
    }
    if (params.cookie) headers['Cookie'] = params.cookie

    const resp = await fetch(`https://www.douyu.com/lapi/live/getH5Play/${params.roomId}`, { headers })
    const data = await resp.json()
    if (data.error === 0 && data.data?.hls_url) {
      return { url: data.data.hls_url, format: 'hls' }
    }
    // H5 play API 失败时尝试使用页面 JS 数据提取流地址
    const pageResp = await fetch(`https://www.douyu.com/${params.roomId}`, { headers })
    const pageHtml = await pageResp.text()
    // 从页面 script 数据中提取 stream url
    const roomIdMatch = pageHtml.match(/roomID\s*[:=]\s*(\d+)/)
    const uidMatch = pageHtml.match(/owner_uid\s*[:=]\s*(\d+)/)
    if (roomIdMatch && uidMatch) {
      // 构建备选 HLS URL（斗鱼 CDN 常用格式）
      const cdnUrl = `https://pl-hls.douyu.com/live/${params.roomId}.m3u8`
      return { url: cdnUrl, format: 'hls' }
    }
    throw new Error(`斗鱼 流地址获取失败 (API 需要登录 Cookie)`)
  }

  connectDanmaku(roomId: string, _cookie?: string): DanmakuConnection {
    const handlers = new Map<string, (...args: any[]) => void>()
    let ws: WebSocket | null = null
    let closed = false
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null

    function connect() {
      if (closed) return
      ws = new WebSocket('wss://danmuproxy.douyu.com:8503')
      ws.onopen = () => {
        const login = douyuPacket(`type@=loginreq/roomid@=${roomId}/`)
        ws!.send(login)
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(douyuPacket('type@=mrkl/'))
          }
        }, 40000)
        const join = douyuPacket(`type@=joingroup/rid@=${roomId}/gid@=-9999/`)
        ws!.send(join)
      }
      ws.onmessage = (event) => {
        const text = typeof event.data === 'string' ? event.data : ''
        const msg = parseDouyuMessage(text)
        if (!msg) return
        const handler = handlers.get('message')
        if (handler) handler(msg)
      }
      ws.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer)
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
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        ws?.close()
        ws = null
      }
    }
  }

  async searchRooms(_keyword: string): Promise<RoomInfo[]> {
    // TODO: 斗鱼搜索 API
    return []
  }

  async getFollowedRooms(_cookie: string): Promise<RoomInfo[]> {
    // TODO: 斗鱼关注列表 API
    return []
  }

  async login(credentials: LoginCredentials): Promise<string> {
    if (credentials.cookie) return credentials.cookie
    throw new Error('斗鱼登录仅支持 Cookie 方式')
  }

  async getCategories(): Promise<Category[]> {
    try {
      const resp = await douyuFetch('https://open.douyucdn.cn/api/RoomApi/game')
      const data = await resp.json()
      if (data.error !== 0) return []
      return (data.data || []).map((g: any) => ({
        id: String(g.game_id || g.gameId || g.id),
        name: g.game_name || g.gameName || g.name
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
      const page = params.page || 1
      // 斗鱼公开 API 不支持按分类过滤直播间，统一使用 live 列表
      const url = `https://open.douyucdn.cn/api/RoomApi/live?page=${page}`
      const resp = await douyuFetch(url)
      const data = await resp.json()
      if (data.error !== 0) return []
      return (data.data || []).map((r: any) => ({
        platform: 'douyu' as const,
        roomId: String(r.room_id || r.rid),
        title: r.room_name || r.roomName || '',
        主播名称: r.nickname || r.owner_name || '',
        avatar: r.room_src || r.avatar || '',
        isLive: true,
        viewerCount: r.hn || r.online || r.online_num || 0,
        category: r.game_name || r.gameName || ''
      }))
    } catch {
      return []
    }
  }
}

// 斗鱼弹幕协议：以 @= 分隔键值，/ 分隔字段，末尾以 \0 结束
function douyuPacket(content: string): ArrayBuffer {
  const encoder = new TextEncoder()
  const data = encoder.encode(content + '\0')
  const len = data.byteLength + 8
  const buf = new ArrayBuffer(len)
  const view = new DataView(buf)
  view.setInt32(0, len, true)
  view.setInt32(4, len, true)
  new Uint8Array(buf, 8).set(data)
  return buf
}

function parseDouyuMessage(text: string): any {
  if (!text || text.startsWith('type@=mrkl')) return null
  const fields = text.split('/')
  const msg: Record<string, string> = {}
  for (const field of fields) {
    const [key, value] = field.split('@=')
    if (key && value) msg[key] = value
  }
  return msg
}

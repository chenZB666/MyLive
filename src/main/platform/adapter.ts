// src/main/platform/adapter.ts

export type Platform = 'douyu' | 'huya' | 'bilibili' | 'douyin'

export interface RoomInfo {
  platform: Platform
  roomId: string
  title: string
  主播名称: string
  avatar: string
  isLive: boolean
  viewerCount?: number
  category?: string
}

export interface StreamInfo {
  url: string
  format: 'flv' | 'hls'
}

export interface LoginCredentials {
  username?: string
  password?: string
  cookie?: string
}

export interface DanmakuConnection {
  on(event: 'message', handler: (msg: any) => void): void
  on(event: 'close', handler: () => void): void
  on(event: 'error', handler: (err: Error) => void): void
  close(): void
}

export interface PlatformAdapter {
  readonly platform: Platform
  getRoomInfo(roomId: string): Promise<RoomInfo>
  getStreamUrl(params: {
    roomId: string
    quality?: number
    cookie?: string
  }): Promise<StreamInfo>
  connectDanmaku(roomId: string, cookie?: string): DanmakuConnection
  searchRooms(keyword: string): Promise<RoomInfo[]>
  getFollowedRooms(cookie: string): Promise<RoomInfo[]>
  login(credentials: LoginCredentials): Promise<string>
  getCategories(): Promise<Category[]>
  getLiveRooms(params: {
    categoryId?: string
    page?: number
    pageSize?: number
  }): Promise<RoomInfo[]>
}

export interface Category {
  id: string
  name: string
  parentId?: string
}

export type DanmakuEvent =
  | { type: 'comment'; userId: string; userName: string; content: string; color?: string; timestamp: number }
  | { type: 'gift'; userName: string; giftName: string; count: number; price?: number }
  | { type: 'enter'; userName: string }
  | { type: 'subscription'; userName: string; month?: number }
  | { type: 'system'; content: string; color?: string }

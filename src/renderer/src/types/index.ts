// src/renderer/src/types/index.ts
import type { DanmakuEvent, RoomInfo, Platform, Category } from '../../../main/platform/adapter'

export interface RoomState {
  id: string // `${platform}:${roomId}`
  platform: Platform
  roomId: string
  info: RoomInfo | null
  streamUrl: string | null
  streamFormat: 'flv' | 'hls' | null
  danmakuList: DanmakuEvent[]
  isConnecting: boolean
  isConnected: boolean
  danmakuStatus: string
  error: string | null
  isLoading: boolean
}

export interface FollowedRoom {
  platform: string
  roomId: string
  title: string
  主播名称: string
}

// Electron API 类型声明
export interface ElectronAPI {
  getRoomInfo: (platform: string, roomId: string) => Promise<RoomInfo>
  getStreamUrl: (platform: string, roomId: string) => Promise<{ url: string; format: string }>
  searchRooms: (platform: string, keyword: string) => Promise<RoomInfo[]>
  connectDanmaku: (roomId: string, platform: string) => Promise<void>
  disconnectDanmaku: (roomId: string, platform: string) => Promise<void>
  onDanmakuEvent: (callback: (event: any) => void) => () => void
  onDanmakuStatus: (callback: (status: any) => void) => () => void
  getFollowedRooms: () => Promise<FollowedRoom[]>
  addFollowedRoom: (room: FollowedRoom) => Promise<void>
  removeFollowedRoom: (platform: string, roomId: string) => Promise<void>
  getCookie: (platform: string) => Promise<string | undefined>
  setCookie: (platform: string, cookie: string) => Promise<void>
  openExternal: (url: string) => Promise<void>
  getCategories: (platform: string) => Promise<Category[]>
  getLiveRooms: (platform: string, categoryId?: string, page?: number) => Promise<RoomInfo[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
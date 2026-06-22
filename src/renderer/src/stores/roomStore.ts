// src/renderer/src/stores/roomStore.ts
import { create } from 'zustand'
import type { DanmakuEvent } from '../../../main/platform/adapter'
import type { RoomState } from '../types'

const MAX_ROOMS = 20      // 最多同时保留 20 个房间数据
const MAX_DANMAKU = 200   // 每个房间最多保留 200 条弹幕（原 500）

interface RoomStore {
  rooms: Record<string, RoomState>
  activeRoomId: string | null

  addRoom: (platform: string, roomId: string) => void
  removeRoom: (id: string) => void
  setActiveRoom: (id: string | null) => void
  setRoomInfo: (id: string, info: Partial<RoomState>) => void
  addDanmaku: (id: string, event: DanmakuEvent) => void
  setDanmakuStatus: (id: string, status: string) => void
  clearDanmaku: (id: string) => void
  /** 清理非活跃房间数据（释放内存） */
  cleanupInactiveRooms: (activeIds: string[]) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: {},
  activeRoomId: null,

  addRoom: (platform: string, roomId: string) => {
    const id = `${platform}:${roomId}`
    set((state) => {
      const roomCount = Object.keys(state.rooms).length
      let newRooms = { ...state.rooms }
      // 超过上限时移除最旧的房间
      if (roomCount >= MAX_ROOMS && !newRooms[id]) {
        const oldestId = Object.keys(newRooms)[0]
        if (oldestId !== state.activeRoomId) {
          delete newRooms[oldestId]
        }
      }
      newRooms[id] = {
        id,
        platform: platform as any,
        roomId,
        info: null,
        streamUrl: null,
        streamFormat: null,
        danmakuList: [],
        isConnecting: false,
        isConnected: false,
        danmakuStatus: 'idle',
        error: null,
        isLoading: true
      }
      return {
        rooms: newRooms,
        activeRoomId: state.activeRoomId || id
      }
    })
  },

  removeRoom: (id: string) => {
    set((state) => {
      const { [id]: _, ...rest } = state.rooms
      return {
        rooms: rest,
        activeRoomId: state.activeRoomId === id
          ? Object.keys(rest)[0] || null
          : state.activeRoomId
      }
    })
  },

  setActiveRoom: (id: string | null) => set({ activeRoomId: id }),

  setRoomInfo: (id: string, info: Partial<RoomState>) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [id]: { ...state.rooms[id], ...info }
      }
    }))
  },

  addDanmaku: (id: string, event: DanmakuEvent) => {
    set((state) => {
      const room = state.rooms[id]
      if (!room) return state
      const danmakuList = [...room.danmakuList, event]
      // 超过上限时裁剪旧弹幕
      if (danmakuList.length > MAX_DANMAKU) {
        danmakuList.splice(0, danmakuList.length - MAX_DANMAKU)
      }
      return {
        rooms: { ...state.rooms, [id]: { ...room, danmakuList } }
      }
    })
  },

  setDanmakuStatus: (id: string, status: string) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [id]: { ...state.rooms[id], danmakuStatus: status, isConnected: status === 'connected' }
      }
    }))
  },

  clearDanmaku: (id: string) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [id]: { ...state.rooms[id], danmakuList: [] }
      }
    }))
  },

  cleanupInactiveRooms: (activeIds: string[]) => {
    set((state) => {
      const activeSet = new Set(activeIds)
      const newRooms: Record<string, RoomState> = {}
      // 保留活跃房间 + activeRoom（播放中）
      for (const [id, room] of Object.entries(state.rooms)) {
        if (activeSet.has(id) || id === state.activeRoomId) {
          newRooms[id] = room
        }
      }
      return { rooms: newRooms }
    })
  }
}))
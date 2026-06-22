// src/renderer/src/stores/settingsStore.ts
import { create } from 'zustand'
import type { FollowedRoom } from '../types'

interface SettingsStore {
  followedRooms: FollowedRoom[]
  cookies: Record<string, string>
  pollingInterval: number

  loadFollowedRooms: () => Promise<void>
  addFollowedRoom: (room: FollowedRoom) => Promise<void>
  removeFollowedRoom: (platform: string, roomId: string) => Promise<void>
  setCookie: (platform: string, cookie: string) => Promise<void>
  getCookie: (platform: string) => Promise<string | undefined>
  setPollingInterval: (interval: number) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  followedRooms: [],
  cookies: {},
  pollingInterval: 60,

  loadFollowedRooms: async () => {
    const rooms = await window.electronAPI.getFollowedRooms()
    set({ followedRooms: rooms })
  },

  addFollowedRoom: async (room: FollowedRoom) => {
    await window.electronAPI.addFollowedRoom(room)
    set((state) => ({
      followedRooms: [...state.followedRooms, room]
    }))
  },

  removeFollowedRoom: async (platform: string, roomId: string) => {
    await window.electronAPI.removeFollowedRoom(platform, roomId)
    set((state) => ({
      followedRooms: state.followedRooms.filter(
        (r) => !(r.platform === platform && r.roomId === roomId)
      )
    }))
  },

  setCookie: async (platform: string, cookie: string) => {
    await window.electronAPI.setCookie(platform, cookie)
    set((state) => ({
      cookies: { ...state.cookies, [platform]: cookie }
    }))
  },

  getCookie: async (platform: string) => {
    const cookie = await window.electronAPI.getCookie(platform)
    if (cookie) {
      set((state) => ({
        cookies: { ...state.cookies, [platform]: cookie }
      }))
    }
    return cookie
  },

  setPollingInterval: (interval: number) => {
    set({ pollingInterval: interval })
  }
}))
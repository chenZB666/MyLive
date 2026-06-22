// src/renderer/src/stores/appStore.ts
import { create } from 'zustand'
import type { Platform, RoomInfo } from '../../../main/platform/adapter'

export interface AppTab {
  id: string
  type: 'home' | 'browse'
  platform?: Platform
  title: string
  view: 'list' | 'player'
  playingRoomId?: string
  selectedCategory?: string
  rooms: RoomInfo[]
  isLoading: boolean
  error: string | null
}

interface AppStore {
  tabs: AppTab[]
  activeTabId: string

  openHome: () => void
  openBrowse: (platform: Platform) => void
  closeTab: (id: string) => void
  switchTab: (id: string) => void
  switchView: (tabId: string, view: 'list' | 'player', roomId?: string) => void
  setCategory: (tabId: string, categoryId: string | undefined) => void
  setRooms: (tabId: string, rooms: RoomInfo[]) => void
  setLoading: (tabId: string, loading: boolean) => void
  setError: (tabId: string, error: string | null) => void
}

const platformNames: Record<string, string> = {
  douyu: '斗鱼', huya: '虎牙', bilibili: 'B站', douyin: '抖音'
}

export const useAppStore = create<AppStore>((set, get) => ({
  tabs: [{ id: 'home', type: 'home', title: '首页', view: 'list', rooms: [], isLoading: false, error: null }],
  activeTabId: 'home',

  openHome: () => {
    const state = get()
    if (!state.tabs.find(t => t.id === 'home')) {
      set({ tabs: [{ id: 'home', type: 'home', title: '首页', view: 'list', rooms: [], isLoading: false, error: null }, ...state.tabs] })
    }
    set({ activeTabId: 'home' })
  },

  openBrowse: (platform: Platform) => {
    const state = get()
    const id = `browse:${platform}`
    if (state.tabs.find(t => t.id === id)) {
      set({ activeTabId: id })
      return
    }
    const newTab: AppTab = {
      id,
      type: 'browse',
      platform,
      title: platformNames[platform] || platform,
      view: 'list',
      rooms: [],
      isLoading: false,
      error: null
    }
    set({ tabs: [...state.tabs, newTab], activeTabId: id })
  },

  closeTab: (id: string) => {
    if (id === 'home') return
    const state = get()
    const idx = state.tabs.findIndex(t => t.id === id)
    const newTabs = state.tabs.filter(t => t.id !== id)
    let newActive = state.activeTabId
    if (state.activeTabId === id) {
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id || 'home'
    }
    set({ tabs: newTabs, activeTabId: newActive })
  },

  switchTab: (id: string) => set({ activeTabId: id }),

  switchView: (tabId: string, view: 'list' | 'player', roomId?: string) => {
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, view, playingRoomId: roomId || t.playingRoomId } : t
      )
    }))
  },

  setCategory: (tabId: string, categoryId: string | undefined) => {
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, selectedCategory: categoryId } : t
      )
    }))
  },

  setRooms: (tabId: string, rooms: RoomInfo[]) => {
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, rooms } : t
      )
    }))
  },

  setLoading: (tabId: string, isLoading: boolean) => {
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, isLoading } : t
      )
    }))
  },

  setError: (tabId: string, error: string | null) => {
    set((state) => ({
      tabs: state.tabs.map(t =>
        t.id === tabId ? { ...t, error } : t
      )
    }))
  }
}))
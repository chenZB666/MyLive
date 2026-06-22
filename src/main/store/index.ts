// src/main/store/index.ts
// NOTE: electron-store is ESM-only. Must NOT static-import — use dynamic import().

interface FollowedRoom {
  platform: string
  roomId: string
  title: string
  主播名称: string
}

interface StoreSchema {
  platformCookies: Record<string, string>
  followedRooms: FollowedRoom[]
  pollingInterval: number
  windowBounds: { width: number; height: number }
}

let store: any = null

export async function initStore(): Promise<void> {
  if (store) return
  const { default: Store } = await import('electron-store')
  store = new Store<StoreSchema>({
    defaults: {
      platformCookies: {},
      followedRooms: [],
      pollingInterval: 60,
      windowBounds: { width: 1280, height: 800 }
    }
  })
}

export function getStore() {
  return {
    // Cookies
    getCookie(platform: string): string | undefined {
      return store.get('platformCookies')[platform]
    },
    setCookie(platform: string, cookie: string): void {
      const cookies = store.get('platformCookies')
      cookies[platform] = cookie
      store.set('platformCookies', cookies)
    },
    // 订阅列表
    getFollowedRooms(): FollowedRoom[] {
      return store.get('followedRooms')
    },
    addFollowedRoom(room: FollowedRoom): void {
      const rooms = store.get('followedRooms')
      if (!rooms.find(r => r.platform === room.platform && r.roomId === room.roomId)) {
        rooms.push(room)
        store.set('followedRooms', rooms)
      }
    },
    removeFollowedRoom(platform: string, roomId: string): void {
      const rooms = store.get('followedRooms').filter(r => !(r.platform === platform && r.roomId === roomId))
      store.set('followedRooms', rooms)
    },
    // 轮询间隔
    getPollingInterval(): number {
      return store.get('pollingInterval')
    },
    setPollingInterval(interval: number): void {
      store.set('pollingInterval', interval)
    },
    // 窗口
    getWindowBounds(): { width: number; height: number } {
      return store.get('windowBounds')
    },
    setWindowBounds(bounds: { width: number; height: number }): void {
      store.set('windowBounds', bounds)
    }
  }
}
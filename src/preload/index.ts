import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // 直播间操作
  getRoomInfo: (platform: string, roomId: string) =>
    ipcRenderer.invoke('get-room-info', platform, roomId),
  getStreamUrl: (platform: string, roomId: string) =>
    ipcRenderer.invoke('get-stream-url', platform, roomId),
  searchRooms: (platform: string, keyword: string) =>
    ipcRenderer.invoke('search-rooms', platform, keyword),

  // 弹幕
  connectDanmaku: (roomId: string, platform: string) =>
    ipcRenderer.invoke('connect-danmaku', roomId, platform),
  disconnectDanmaku: (roomId: string, platform: string) =>
    ipcRenderer.invoke('disconnect-danmaku', roomId, platform),
  onDanmakuEvent: (callback: (event: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('danmaku-event', handler)
    return () => ipcRenderer.removeListener('danmaku-event', handler)
  },
  onDanmakuStatus: (callback: (status: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('danmaku-status', handler)
    return () => ipcRenderer.removeListener('danmaku-status', handler)
  },

  // 订阅
  getFollowedRooms: () => ipcRenderer.invoke('get-followed-rooms'),
  addFollowedRoom: (room: any) => ipcRenderer.invoke('add-followed-room', room),
  removeFollowedRoom: (platform: string, roomId: string) =>
    ipcRenderer.invoke('remove-followed-room', platform, roomId),

  // Cookie
  getCookie: (platform: string) => ipcRenderer.invoke('get-cookie', platform),
  setCookie: (platform: string, cookie: string) =>
    ipcRenderer.invoke('set-cookie', platform, cookie),

  // 设置
  getPollingInterval: () => ipcRenderer.invoke('get-polling-interval'),
  setPollingInterval: (interval: number) =>
    ipcRenderer.invoke('set-polling-interval', interval),

  // 打开外部链接
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // 平台浏览
  getCategories: (platform: string) =>
    ipcRenderer.invoke('get-categories', platform),
  getLiveRooms: (platform: string, categoryId?: string, page?: number) =>
    ipcRenderer.invoke('get-live-rooms', platform, categoryId, page)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
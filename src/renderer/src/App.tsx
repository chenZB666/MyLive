import React, { Suspense } from 'react'
import { Layout, Spin } from 'antd'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { StatusBar } from './components/StatusBar'
import { SettingsPage } from './components/SettingsPage'
import { SubscriptionsPage } from './components/SubscriptionsPage'
import { useAppStore } from './stores/appStore'
import { useRoomStore } from './stores/roomStore'
import { useSettingsStore } from './stores/settingsStore'

// 代码分割：首页和浏览页在需要时才加载
const HomePage = React.lazy(() => import('./components/HomePage'))
const BrowsePage = React.lazy(() => import('./components/BrowsePage'))

const { Content } = Layout

const App: React.FC = () => {
  const tabs = useAppStore((s) => s.tabs)
  const activeTabId = useAppStore((s) => s.activeTabId)
  const addDanmaku = useRoomStore((s) => s.addDanmaku)
  const setDanmakuStatus = useRoomStore((s) => s.setDanmakuStatus)
  const loadFollowedRooms = useSettingsStore((s) => s.loadFollowedRooms)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [subscriptionsOpen, setSubscriptionsOpen] = React.useState(false)

  React.useEffect(() => {
    loadFollowedRooms()
  }, [loadFollowedRooms])

  // 定期清理非活跃房间数据（释放内存）
  React.useEffect(() => {
    const interval = setInterval(() => {
      const currentTabs = useAppStore.getState().tabs
      const activeIds = currentTabs
        .filter(t => t.type === 'browse' && t.playingRoomId && t.platform)
        .map(t => `${t.platform}:${t.playingRoomId}`)
      useRoomStore.getState().cleanupInactiveRooms(activeIds)
    }, 60000)  // 每分钟清理一次
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    const cleanup = window.electronAPI.onDanmakuEvent((data: any) => {
      const id = `${data.platform}:${data.roomId}`
      addDanmaku(id, data.event)
    })
    return cleanup
  }, [addDanmaku])

  React.useEffect(() => {
    const cleanup = window.electronAPI.onDanmakuStatus((data: any) => {
      const id = `${data.platform}:${data.roomId}`
      setDanmakuStatus(id, data.status)
    })
    return cleanup
  }, [setDanmakuStatus])

  const activeTab = tabs.find(t => t.id === activeTabId)

  const renderContent = () => {
    if (!activeTab) return null
    switch (activeTab.type) {
      case 'home':
        return <HomePage />
      case 'browse':
        return (
          <BrowsePage
            key={activeTab.id}
            tabId={activeTab.id}
            platform={activeTab.platform!}
          />
        )
      default:
        return null
    }
  }

  const renderFallback = () => (
    <div className="flex items-center justify-center h-full">
      <Spin size="large" />
    </div>
  )

  const handlePlayFromSubscriptions = (platform: string, roomId: string) => {
    const appStore = useAppStore.getState()
    const tabId = `browse:${platform}`
    // 打开或切换到该平台的浏览 tab
    if (!appStore.tabs.find(t => t.id === tabId)) {
      appStore.openBrowse(platform as any)
    } else {
      appStore.switchTab(tabId)
    }
    // 触发房间播放
    setTimeout(() => {
      const tab = useAppStore.getState().tabs.find(t => t.id === tabId)
      if (tab && tab.view === 'list') {
        // 通过 IPC 直接打开房间
        window.electronAPI.getRoomInfo(platform, roomId).then((info) => {
          const roomIdStr = `${platform}:${roomId}`
          const addRoom = useRoomStore.getState().addRoom
          const setRoomInfo = useRoomStore.getState().setRoomInfo
          addRoom(platform, roomId)
          setRoomInfo(roomIdStr, { info, isLoading: false })
          window.electronAPI.getStreamUrl(platform, roomId).then((stream) => {
            setRoomInfo(roomIdStr, { streamUrl: stream.url, streamFormat: stream.format as any })
          })
          window.electronAPI.connectDanmaku(roomId, platform)
        })
      }
    }, 100)
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSubscriptions={() => setSubscriptionsOpen(true)}
      />
      <TabBar />
      <Content style={{ position: 'relative', overflow: 'hidden' }}>
        <Suspense fallback={renderFallback()}>
          {renderContent()}
        </Suspense>
      </Content>
      <StatusBar />
      <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SubscriptionsPage
        open={subscriptionsOpen}
        onClose={() => setSubscriptionsOpen(false)}
        onPlay={handlePlayFromSubscriptions}
      />
    </Layout>
  )
}

export default App
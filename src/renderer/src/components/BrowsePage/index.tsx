import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Typography, Spin, Button, Empty } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../stores/appStore'
import { useRoomStore } from '../../stores/roomStore'
import { RoomCard } from '../RoomCard'
import { CategorySidebar } from '../CategorySidebar'
import { Player } from '../Player'
import { DanmakuPanel } from '../Danmaku'
import type { Platform, Category, RoomInfo } from '../../../../main/platform/adapter'

const { Text } = Typography

interface BrowsePageProps {
  tabId: string
  platform: Platform
}

const platformNames: Record<string, string> = {
  douyu: '斗鱼', huya: '虎牙', bilibili: 'B站', douyin: '抖音'
}

const BrowsePage: React.FC<BrowsePageProps> = ({ tabId, platform }) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const roomCache = useRef<Map<string, RoomInfo[]>>(new Map())
  const [initialLoad, setInitialLoad] = useState(true)

  const tab = useAppStore((s) => s.tabs.find(t => t.id === tabId))
  const switchView = useAppStore((s) => s.switchView)
  const setCategory = useAppStore((s) => s.setCategory)
  const setRooms = useAppStore((s) => s.setRooms)
  const setLoading = useAppStore((s) => s.setLoading)
  const setError = useAppStore((s) => s.setError)

  const addRoom = useRoomStore((s) => s.addRoom)
  const setRoomInfo = useRoomStore((s) => s.setRoomInfo)
  const rooms = useRoomStore((s) => s.rooms)

  // 加载分类
  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    window.electronAPI.getCategories(platform).then((cats) => {
      if (!cancelled) {
        setCategories(cats)
        setCategoriesLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setCategoriesLoading(false)
    })
    return () => { cancelled = true }
  }, [platform])

  // 加载直播列表（带缓存）
  const fetchRooms = useCallback(async () => {
    if (!tab) return
    const cacheKey = tab.selectedCategory || '__all__'
    // 如果缓存中有数据且不是首次加载，直接使用缓存
    if (!initialLoad && roomCache.current.has(cacheKey)) {
      setRooms(tabId, roomCache.current.get(cacheKey)!)
      return
    }
    setLoading(tabId, true)
    setError(tabId, null)
    try {
      const list = await window.electronAPI.getLiveRooms(platform, tab.selectedCategory)
      roomCache.current.set(cacheKey, list)
      setRooms(tabId, list)
    } catch (err: any) {
      setError(tabId, err.message || '加载失败')
    } finally {
      setLoading(tabId, false)
      setInitialLoad(false)
    }
  }, [tabId, platform, tab?.selectedCategory, initialLoad])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // 切换分类时清空首次加载标记以强制刷新
  const handleCategoryChange = useCallback((catId: string | undefined) => {
    const currentCategory = catId
    const cacheKey = currentCategory || '__all__'
    if (roomCache.current.has(cacheKey)) {
      setRooms(tabId, roomCache.current.get(cacheKey)!)
    } else {
      setInitialLoad(true)
    }
    setCategory(tabId, currentCategory)
  }, [tabId, setCategory, setRooms])

  // 点击房间开始播放
  const handlePlay = async (room: RoomInfo) => {
    const roomIdStr = `${room.platform}:${room.roomId}`
    if (!rooms[roomIdStr]) {
      addRoom(room.platform, room.roomId)
    }
    switchView(tabId, 'player', room.roomId)

    try {
      const info = await window.electronAPI.getRoomInfo(room.platform, room.roomId)
      setRoomInfo(roomIdStr, { info, isLoading: false })
      const stream = await window.electronAPI.getStreamUrl(room.platform, room.roomId)
      setRoomInfo(roomIdStr, { streamUrl: stream.url, streamFormat: stream.format as any })
      await window.electronAPI.connectDanmaku(room.roomId, room.platform)
    } catch (err: any) {
      console.error(`[${room.platform}] 加载失败:`, err.message, err)
      setRoomInfo(roomIdStr, { error: `加载失败: ${err.message}`, isLoading: false })
    }
  }

  // 返回列表
  const handleBack = () => {
    if (tab?.playingRoomId) {
      window.electronAPI.disconnectDanmaku(tab.playingRoomId, platform)
    }
    switchView(tabId, 'list')
  }

  // 播放视图
  if (tab?.view === 'player' && tab?.playingRoomId) {
    const roomIdStr = `${platform}:${tab.playingRoomId}`
    const room = rooms[roomIdStr]
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {platformNames[platform] || platform} · {room?.info?.主播名称 || tab.playingRoomId}
          </Text>
        </div>
        <div className="flex flex-1" style={{ minHeight: 0 }}>
          <div className="flex-1 flex flex-col">
            <Player
              key={roomIdStr}
              streamUrl={room?.streamUrl || null}
              streamFormat={room?.streamFormat || null}
              isLoading={room?.isLoading || false}
              error={room?.error || null}
              platform={platform}
            />
            {room?.info && (
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center gap-3">
                <span className="font-medium text-gray-700">{room.info.主播名称}</span>
                <span>{room.info.title}</span>
                {room.info.viewerCount != null && (
                  <span>在线: {room.info.viewerCount.toLocaleString()}</span>
                )}
              </div>
            )}
          </div>
          <DanmakuPanel roomId={roomIdStr} />
        </div>
      </div>
    )
  }

  // 列表视图
  const currentCategoryName = tab?.selectedCategory
    ? categories.find(c => c.id === tab.selectedCategory)?.name
    : null

  return (
    <div className="flex h-full">
      <CategorySidebar
        platform={platform}
        categories={categories}
        selectedCategory={tab?.selectedCategory}
        loading={categoriesLoading}
        onSelect={handleCategoryChange}
      />
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <Text strong style={{ fontSize: 13 }}>
            {platformNames[platform] || platform}
            {currentCategoryName ? ` · ${currentCategoryName}` : ' · 全部'}
          </Text>
          <Button type="text" size="small" icon={<ReloadOutlined />} onClick={fetchRooms} />
        </div>
        <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
          {tab?.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
            </div>
          ) : tab?.error ? (
            <div className="flex items-center justify-center h-full">
              <Empty description={tab.error}>
                <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={fetchRooms}>
                  重试
                </Button>
              </Empty>
            </div>
          ) : tab?.rooms.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Empty description="暂无直播" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tab?.rooms.map((room) => (
                <RoomCard key={`${room.platform}:${room.roomId}`} room={room} onClick={handlePlay} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default BrowsePage

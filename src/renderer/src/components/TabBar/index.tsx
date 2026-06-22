import React from 'react'
import { Tabs } from 'antd'
import { HomeOutlined, CloseOutlined } from '@ant-design/icons'
import { useAppStore } from '../../stores/appStore'
import type { AppTab } from '../../stores/appStore'

export const TabBar: React.FC = () => {
  const tabs = useAppStore((s) => s.tabs)
  const activeTabId = useAppStore((s) => s.activeTabId)
  const switchTab = useAppStore((s) => s.switchTab)
  const closeTab = useAppStore((s) => s.closeTab)

  const handleClose = (tab: AppTab) => {
    // 关闭前清理资源：断开弹幕、销毁播放器
    if (tab.type === 'browse' && tab.playingRoomId && tab.platform) {
      window.electronAPI.disconnectDanmaku(tab.playingRoomId, tab.platform)
    }
    closeTab(tab.id)
  }

  const items = tabs.map((tab: AppTab) => ({
    key: tab.id,
    label: (
      <span className="flex items-center gap-1 text-sm">
        {tab.type === 'home' && <HomeOutlined style={{ fontSize: 13 }} />}
        {tab.title}
        {tab.id !== 'home' && (
          <CloseOutlined
            style={{ fontSize: 10, marginLeft: 2 }}
            onClick={(e) => {
              e.stopPropagation()
              handleClose(tab)
            }}
          />
        )}
      </span>
    ),
    closable: false
  }))

  return (
    <Tabs
      activeKey={activeTabId}
      onChange={switchTab}
      items={items}
      size="small"
      style={{ margin: 0, background: '#fff' }}
      tabBarStyle={{ margin: 0, paddingLeft: 8, minHeight: 36 }}
    />
  )
}
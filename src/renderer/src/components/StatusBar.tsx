import React from 'react'
import { Layout, Tag, Space, Typography } from 'antd'
import { useRoomStore } from '../stores/roomStore'

const { Text } = Typography

export const StatusBar: React.FC = () => {
  const rooms = useRoomStore((s) => s.rooms)
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const activeRoom = activeRoomId ? rooms[activeRoomId] : null

  const statusColor: Record<string, string> = {
    idle: 'default',
    connecting: 'processing',
    connected: 'success',
    disconnected: 'warning',
    error: 'error'
  }

  const statusText: Record<string, string> = {
    idle: '空闲',
    connecting: '连接中',
    connected: '已连接',
    disconnected: '已断开',
    error: '连接失败'
  }

  if (!activeRoom) return null

  return (
    <Layout.Footer
      className="flex items-center justify-between px-3 h-6 border-t border-gray-200 bg-gray-50"
      style={{ padding: '0 12px', lineHeight: '24px' }}
    >
      <Space size={16}>
        <Tag
          color={statusColor[activeRoom.danmakuStatus] || 'default'}
          style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}
        >
          {statusText[activeRoom.danmakuStatus] || activeRoom.danmakuStatus}
        </Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>
          弹幕: {activeRoom.danmakuList.length} 条
        </Text>
      </Space>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {activeRoom.platform} / {activeRoom.roomId}
      </Text>
    </Layout.Footer>
  )
}
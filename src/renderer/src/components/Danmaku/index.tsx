import React from 'react'
import { Typography } from 'antd'
import { DanmakuList } from './DanmakuList'
import { DanmakuInput } from './DanmakuInput'
import { useRoomStore } from '../../stores/roomStore'

const { Text } = Typography

interface DanmakuPanelProps {
  roomId: string
}

export const DanmakuPanel: React.FC<DanmakuPanelProps> = ({ roomId }) => {
  const room = useRoomStore((s) => s.rooms[roomId])

  return (
    <div className="flex flex-col border-l border-gray-200 bg-white" style={{ width: 320, minWidth: 320 }}>
      <div className="px-2 py-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <Text type="secondary" style={{ fontSize: 11 }}>弹幕</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {room?.danmakuList.length || 0} 条
        </Text>
      </div>
      <DanmakuList events={room?.danmakuList || []} />
      <DanmakuInput />
    </div>
  )
}
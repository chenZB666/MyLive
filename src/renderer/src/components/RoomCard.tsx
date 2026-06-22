import React from 'react'
import { Typography } from 'antd'
import type { RoomInfo } from '../../../main/platform/adapter'

const { Text } = Typography

interface RoomCardProps {
  room: RoomInfo
  onClick: (room: RoomInfo) => void
}

const RoomCardComponent: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <div
      className="w-52 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
      onClick={() => onClick(room)}
    >
      <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
        {room.avatar ? (
          <img
            src={room.avatar}
            alt={room.主播名称}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-3xl text-gray-400">📺</span>
        )}
        <div className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5 flex items-center gap-1">
          <span>👁</span>
          <span>
            {room.viewerCount != null
              ? (room.viewerCount >= 10000
                  ? `${(room.viewerCount / 10000).toFixed(1)}万`
                  : room.viewerCount.toLocaleString())
              : '-'}
          </span>
        </div>
      </div>
      <div className="p-2">
        <Text strong style={{ fontSize: 13 }} ellipsis className="block">
          {room.主播名称}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }} ellipsis className="block mt-0.5">
          {room.title}
        </Text>
      </div>
    </div>
  )
}

export const RoomCard = React.memo(RoomCardComponent)
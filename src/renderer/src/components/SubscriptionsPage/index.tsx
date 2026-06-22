import React from 'react'
import { Drawer, List, Tag, Typography, Button, Space, Popconfirm, Empty } from 'antd'
import { DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useSettingsStore } from '../../stores/settingsStore'

const { Text } = Typography

interface SubscriptionsPageProps {
  open: boolean
  onClose: () => void
  onPlay: (platform: string, roomId: string) => void
}

const platformColors: Record<string, string> = {
  douyu: 'red', huya: 'orange', bilibili: 'blue', douyin: 'cyan'
}

const platformNames: Record<string, string> = {
  douyu: '斗鱼', huya: '虎牙', bilibili: 'B站', douyin: '抖音'
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ open, onClose, onPlay }) => {
  const followedRooms = useSettingsStore((s) => s.followedRooms)
  const removeFollowedRoom = useSettingsStore((s) => s.removeFollowedRoom)

  const grouped = followedRooms.reduce<Record<string, typeof followedRooms>>((acc, room) => {
    if (!acc[room.platform]) acc[room.platform] = []
    acc[room.platform].push(room)
    return acc
  }, {})

  return (
    <Drawer
      title="我的订阅"
      open={open}
      onClose={onClose}
      width={400}
      styles={{ body: { padding: 16 } }}
    >
      {followedRooms.length === 0 ? (
        <Empty description="暂无订阅，在直播间搜索并订阅" />
      ) : (
        Object.entries(grouped).map(([platform, rooms]) => (
          <div key={platform} className="mb-4">
            <div className="mb-2">
              <Tag color={platformColors[platform]}>{platformNames[platform] || platform}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{rooms.length} 个订阅</Text>
            </div>
            <List
              size="small"
              dataSource={rooms}
              renderItem={(room) => (
                <List.Item
                  actions={[
                    <Button
                      key="play"
                      type="text"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => {
                        onPlay(room.platform, room.roomId)
                        onClose()
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="取消订阅？"
                      onConfirm={() => removeFollowedRoom(room.platform, room.roomId)}
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ]}
                >
                  <Space>
                    <Text>{room.主播名称}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{room.roomId}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        ))
      )}
    </Drawer>
  )
}
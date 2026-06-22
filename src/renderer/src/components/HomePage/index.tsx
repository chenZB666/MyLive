import React from 'react'
import { Typography } from 'antd'
import { useAppStore } from '../../stores/appStore'
import type { Platform } from '../../../../main/platform/adapter'

const { Title, Text } = Typography

interface PlatformConfig {
  key: Platform
  name: string
  gradient: string
  icon: string
}

const platforms: PlatformConfig[] = [
  { key: 'bilibili', name: 'B站直播', gradient: 'from-pink-500 to-rose-500', icon: '📺' },
  { key: 'douyu', name: '斗鱼直播', gradient: 'from-orange-400 to-orange-600', icon: '🐟' },
  { key: 'huya', name: '虎牙直播', gradient: 'from-blue-400 to-blue-600', icon: '🎮' },
  { key: 'douyin', name: '抖音直播', gradient: 'from-gray-600 to-gray-800', icon: '🎵' }
]

const PlatformCard: React.FC<{ platform: PlatformConfig }> = ({ platform }) => {
  const openBrowse = useAppStore((s) => s.openBrowse)

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        w-48 h-36 rounded-2xl cursor-pointer
        bg-gradient-to-br ${platform.gradient}
        text-white shadow-lg hover:shadow-xl
        transition-all duration-200 hover:-translate-y-1
        select-none
      `}
      onClick={() => openBrowse(platform.key)}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{platform.icon}</span>
      <Text strong style={{ color: '#fff', fontSize: 16, marginTop: 8 }}>{platform.name}</Text>
    </div>
  )
}

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mb-8 text-center">
        <Title level={2} style={{ margin: 0 }}>欢迎使用 MyLive</Title>
        <Text type="secondary" style={{ fontSize: 14, marginTop: 8 }}>
          选择一个直播平台开始浏览
        </Text>
      </div>
      <div className="flex gap-6 flex-wrap justify-center">
        {platforms.map((p) => (
          <PlatformCard key={p.key} platform={p} />
        ))}
      </div>
    </div>
  )
}

export default HomePage
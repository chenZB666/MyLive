import React from 'react'
import { Layout, Button, Badge, Space, Typography } from 'antd'
import { SettingOutlined, BellOutlined, StarOutlined } from '@ant-design/icons'

const { Text } = Typography

interface HeaderProps {
  onOpenSettings: () => void
  onOpenSubscriptions: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenSubscriptions }) => {
  return (
    <Layout.Header
      className="flex items-center justify-between px-4 bg-white border-b border-gray-200"
      style={{ height: 44, lineHeight: '44px', padding: '0 16px' }}
    >
      <Space>
        <Text strong style={{ fontSize: 16 }}>MyLive</Text>
      </Space>
      <Space>
        <Button type="text" icon={<StarOutlined />} onClick={onOpenSubscriptions} />
        <Badge count={0} size="small">
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Button type="text" icon={<SettingOutlined />} onClick={onOpenSettings} />
      </Space>
    </Layout.Header>
  )
}
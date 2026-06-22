import React from 'react'
import { Empty, Button, Typography, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface EmptyStateProps {
  onAddRoom: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddRoom }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction="vertical" size={8}>
            <Title level={5} style={{ margin: 0 }}>开始观看直播</Title>
            <Text type="secondary">
              点击右上角的 + 号添加直播间，或从侧边栏选择已订阅的直播间
            </Text>
          </Space>
        }
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddRoom}>
          添加直播间
        </Button>
      </Empty>
    </div>
  )
}
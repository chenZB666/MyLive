import React from 'react'
import {
  Drawer, Tabs, Form, Input, Button, Typography, message, Space, List, Tag, Popconfirm, Select
} from 'antd'
import { DeleteOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons'
import { useSettingsStore } from '../stores/settingsStore'

const { Text } = Typography

interface SettingsPageProps {
  open: boolean
  onClose: () => void
}

const platformConfigs = [
  { key: 'douyu', name: '斗鱼', url: 'https://www.douyu.com' },
  { key: 'huya', name: '虎牙', url: 'https://www.huya.com' },
  { key: 'bilibili', name: 'B站', url: 'https://www.bilibili.com' },
  { key: 'douyin', name: '抖音', url: 'https://www.douyin.com' }
]

export const SettingsPage: React.FC<SettingsPageProps> = ({ open, onClose }) => {
  const followedRooms = useSettingsStore((s) => s.followedRooms)
  const addFollowedRoom = useSettingsStore((s) => s.addFollowedRoom)
  const removeFollowedRoom = useSettingsStore((s) => s.removeFollowedRoom)
  const setCookie = useSettingsStore((s) => s.setCookie)

  const [addForm] = Form.useForm()
  const [cookieForm] = Form.useForm()
  const [activeCookiePlatform, setActiveCookiePlatform] = React.useState<string>('bilibili')

  const handleAddSubscription = async () => {
    const values = await addForm.validateFields()
    await addFollowedRoom({
      platform: values.platform,
      roomId: values.roomId,
      title: values.title || '',
      主播名称: values.主播名称 || values.roomId
    })
    addForm.resetFields()
    message.success('订阅成功')
  }

  const handleSetCookie = async () => {
    const values = await cookieForm.validateFields()
    await setCookie(activeCookiePlatform, values.cookie)
    message.success(`${platformConfigs.find(p => p.key === activeCookiePlatform)?.name} Cookie 已保存`)
    cookieForm.resetFields()
  }

  const handleOpenLogin = (url: string) => {
    window.electronAPI.openExternal(url)
  }

  const tabItems = [
    {
      key: 'subscriptions',
      label: '订阅管理',
      children: (
        <div className="space-y-4">
          <List
            size="small"
            header={<Text strong>已订阅的直播间 ({followedRooms.length})</Text>}
            dataSource={followedRooms}
            renderItem={(room) => (
              <List.Item
                actions={[
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
                  <Tag>{room.platform}</Tag>
                  <Text>{room.主播名称}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{room.roomId}</Text>
                </Space>
              </List.Item>
            )}
            locale={{ emptyText: '暂无订阅' }}
          />
          <div className="p-3 bg-gray-50 rounded">
            <Text strong style={{ fontSize: 13 }}>手动添加订阅</Text>
            <Form form={addForm} layout="inline" className="mt-2">
              <Form.Item name="platform" rules={[{ required: true }]}>
                <Select style={{ width: 100 }} options={platformConfigs.map(p => ({ value: p.key, label: p.name }))} />
              </Form.Item>
              <Form.Item name="roomId" rules={[{ required: true, message: '请输入房间号' }]}>
                <Input placeholder="房间号" size="small" style={{ width: 140 }} />
              </Form.Item>
              <Form.Item name="主播名称">
                <Input placeholder="主播名（选填）" size="small" style={{ width: 120 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddSubscription}>
                  添加
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      )
    },
    {
      key: 'platform-login',
      label: '平台登录',
      children: (
        <div className="space-y-4">
          <Form.Item label="选择平台">
            <Select
              value={activeCookiePlatform}
              onChange={(val) => {
                setActiveCookiePlatform(val)
                cookieForm.resetFields()
              }}
              options={platformConfigs.map(p => ({ value: p.key, label: p.name }))}
            />
          </Form.Item>
          <Text type="secondary">
            1. 点击下方按钮在浏览器中打开 {platformConfigs.find(p => p.key === activeCookiePlatform)?.name} 并登录
            <br />
            2. 登录后按 F12 → Application → Cookies 复制完整 Cookie 字符串
          </Text>
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => handleOpenLogin(platformConfigs.find(p => p.key === activeCookiePlatform)?.url || '')}
          >
            打开 {platformConfigs.find(p => p.key === activeCookiePlatform)?.name}
          </Button>
          <Form form={cookieForm} layout="vertical">
            <Form.Item name="cookie" label="Cookie">
              <Input.TextArea rows={4} placeholder="粘贴 Cookie 字符串" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleSetCookie}>保存 Cookie</Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  ]

  return (
    <Drawer
      title="设置"
      open={open}
      onClose={onClose}
      width={500}
      styles={{ body: { padding: 16 } }}
    >
      <Tabs items={tabItems} />
    </Drawer>
  )
}
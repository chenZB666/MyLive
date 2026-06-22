import React from 'react'
import { Tabs, Button, Modal, Select, Form, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useRoomStore } from '../stores/roomStore'

interface RoomTabsProps {
  onAddRoom: (platform: string, roomId: string) => void
  onSwitchRoom: (id: string) => void
  addModalOpen?: boolean
  onAddModalClose?: () => void
}

const platforms = [
  { value: 'douyu', label: '斗鱼' },
  { value: 'huya', label: '虎牙' },
  { value: 'bilibili', label: 'B站' },
  { value: 'douyin', label: '抖音' }
]

export const RoomTabs: React.FC<RoomTabsProps> = ({
  onAddRoom,
  onSwitchRoom,
  addModalOpen = false,
  onAddModalClose
}) => {
  const rooms = useRoomStore((s) => s.rooms)
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const removeRoom = useRoomStore((s) => s.removeRoom)
  const [internalModalOpen, setInternalModalOpen] = React.useState(false)
  const [form] = Form.useForm()

  const isModalOpen = onAddModalClose !== undefined ? addModalOpen : internalModalOpen
  const closeModal = onAddModalClose || (() => setInternalModalOpen(false))

  const handleAdd = () => {
    form.validateFields().then((values) => {
      onAddRoom(values.platform, values.roomId)
      closeModal()
      form.resetFields()
    })
  }

  const items = Object.values(rooms).map((room) => ({
    key: room.id,
    label: (
      <span className="text-sm">
        {room.info?.主播名称 || room.roomId}
      </span>
    ),
    closable: true
  }))

  return (
    <>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeRoomId || undefined}
        items={[
          ...items,
          {
            key: '__add__',
            label: (
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                style={{ border: 'none' }}
                onClick={() => setInternalModalOpen(true)}
              />
            )
          }
        ]}
        onChange={(key) => {
          if (key !== '__add__') {
            onSwitchRoom(key)
          }
        }}
        onEdit={(targetKey, action) => {
          if (action === 'remove') removeRoom(targetKey as string)
        }}
        size="small"
        style={{ background: '#fff' }}
        tabBarStyle={{ margin: 0, paddingLeft: 8 }}
      />
      <Modal
        title="添加直播间"
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => closeModal()}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
            <Select options={platforms} placeholder="选择平台" />
          </Form.Item>
          <Form.Item name="roomId" label="房间号 / URL" rules={[{ required: true, message: '请输入房间号或URL' }]}>
            <Input placeholder="输入房间号或直播间链接" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
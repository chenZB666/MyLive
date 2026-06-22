import React from 'react'
import { Input, Button } from 'antd'

export const DanmakuInput: React.FC = () => {
  const [value, setValue] = React.useState('')

  const handleSend = () => {
    if (!value.trim()) return
    // TODO: 通过平台 API 发送弹幕（需要登录态）
    setValue('')
  }

  return (
    <div className="flex gap-1 p-1.5 border-t border-gray-100 bg-white">
      <Input
        size="small"
        placeholder="发送弹幕（需登录）"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleSend}
        disabled
      />
      <Button size="small" type="primary" disabled onClick={handleSend}>
        发送
      </Button>
    </div>
  )
}
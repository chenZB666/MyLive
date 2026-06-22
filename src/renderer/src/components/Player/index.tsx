import React from 'react'
import { Spin, Result, Button } from 'antd'
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons'
import { usePlayer } from '../../hooks/usePlayer'

interface PlayerProps {
  streamUrl: string | null
  streamFormat: 'flv' | 'hls' | null
  isLoading: boolean
  error: string | null
  platform?: string
}

export const Player: React.FC<PlayerProps> = ({ streamUrl, streamFormat, isLoading, error, platform }) => {
  const { videoRef } = usePlayer({ streamUrl, streamFormat, platform })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#fff' }} spin />} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <Result
          status="error"
          title={<span style={{ color: '#fff' }}>加载失败</span>}
          subTitle={<span style={{ color: '#aaa' }}>{error}</span>}
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  if (!streamUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-500">等待加载直播流...</div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
        style={{ maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
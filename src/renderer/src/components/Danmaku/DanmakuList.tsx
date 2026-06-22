import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Tag, Typography } from 'antd'
import type { DanmakuEvent } from '../../../../main/platform/adapter'

const { Text } = Typography

interface DanmakuListProps {
  events: DanmakuEvent[]
}

const ITEM_HEIGHT = 28
const OVERSCAN = 10

const EventItem: React.FC<{ event: DanmakuEvent }> = React.memo(({ event }) => {
  switch (event.type) {
    case 'comment':
      return (
        <div className="flex gap-1.5 py-0.5 px-2 text-sm leading-6 hover:bg-gray-50 rounded" style={{ height: ITEM_HEIGHT }}>
          <Text
            strong
            style={{ fontSize: 12, color: event.color || '#1890ff', whiteSpace: 'nowrap', maxWidth: 100 }}
            ellipsis
          >
            {event.userName}
          </Text>
          <Text style={{ fontSize: 12, flex: 1 }}>{event.content}</Text>
        </div>
      )
    case 'gift':
      return (
        <div className="flex gap-1.5 py-0.5 px-2 text-sm leading-6 hover:bg-gray-50 rounded" style={{ height: ITEM_HEIGHT }}>
          <Tag color="volcano" style={{ fontSize: 11, margin: 0 }}>礼物</Tag>
          <Text style={{ fontSize: 12 }}>
            <Text strong>{event.userName}</Text> 送出 <Text strong>{event.count}</Text> 个{' '}
            <Text strong>{event.giftName}</Text>
          </Text>
        </div>
      )
    case 'enter':
      return (
        <div className="flex gap-1.5 py-0.5 px-2 text-sm leading-6 hover:bg-gray-50 rounded" style={{ height: ITEM_HEIGHT }}>
          <Tag color="green" style={{ fontSize: 11, margin: 0 }}>进场</Tag>
          <Text style={{ fontSize: 12 }}>{event.userName} 进入了直播间</Text>
        </div>
      )
    case 'subscription':
      return (
        <div className="flex gap-1.5 py-0.5 px-2 text-sm leading-6 hover:bg-gray-50 rounded" style={{ height: ITEM_HEIGHT }}>
          <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>订阅</Tag>
          <Text style={{ fontSize: 12 }}>{event.userName} 订阅了主播</Text>
        </div>
      )
    case 'system':
      return (
        <div className="py-0.5 px-2 text-sm leading-6" style={{ height: ITEM_HEIGHT }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{event.content}</Text>
        </div>
      )
    default:
      return null
  }
})
EventItem.displayName = 'EventItem'

export const DanmakuList: React.FC<DanmakuListProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(400)

  // 自动滚动
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [events.length, autoScroll])

  // 容器尺寸变化
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop: st, scrollHeight, clientHeight } = containerRef.current
    setScrollTop(st)
    setAutoScroll(scrollHeight - st - clientHeight < 50)
  }

  // 虚拟列表计算
  const { visibleEvents, totalHeight, offsetY } = useMemo(() => {
    const total = events.length * ITEM_HEIGHT
    const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
    const endIdx = Math.min(events.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN)
    const visible = events.slice(startIdx, endIdx)
    return {
      visibleEvents: visible,
      totalHeight: total,
      offsetY: startIdx * ITEM_HEIGHT
    }
  }, [events, scrollTop, containerHeight])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
      style={{ minHeight: 0 }}
    >
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Text type="secondary" style={{ fontSize: 12 }}>等待弹幕...</Text>
        </div>
      ) : (
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }}>
            {visibleEvents.map((event, index) => (
              <EventItem key={events.indexOf(event)} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
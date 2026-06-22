import React from 'react'
import { Menu, Spin } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import type { Category, Platform } from '../../../../main/platform/adapter'

interface CategorySidebarProps {
  platform: Platform
  categories: Category[]
  selectedCategory?: string
  loading: boolean
  onSelect: (categoryId: string | undefined) => void
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  loading,
  onSelect
}) => {
  if (loading) {
    return (
      <div className="w-44 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
        <Spin size="small" />
      </div>
    )
  }

  if (categories.length === 0) return null

  const items = [
    { key: '__all__', icon: <UnorderedListOutlined />, label: '全部' },
    ...categories.map((c) => ({
      key: c.id,
      label: c.name
    }))
  ]

  return (
    <div className="w-44 bg-gray-50 border-r border-gray-200 overflow-y-auto" style={{ minHeight: 0 }}>
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[selectedCategory || '__all__']}
        items={items}
        onClick={({ key }) => onSelect(key === '__all__' ? undefined : key)}
        style={{ border: 'none', background: 'transparent' }}
      />
    </div>
  )
}
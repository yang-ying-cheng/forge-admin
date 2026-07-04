import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { usePageConfigStore } from '@/stores/pageConfig'

describe('pageConfig store - 三维度独立切换', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-palette')
    document.documentElement.removeAttribute('data-layout')
    document.documentElement.removeAttribute('data-style')
    document.documentElement.removeAttribute('data-theme')
  })

  describe('默认值', () => {
    it('默认三维度为 blue/sidebar/flat', () => {
      const store = usePageConfigStore()
      expect(store.config.palette).toBe('blue')
      expect(store.config.layout).toBe('sidebar')
      expect(store.config.style).toBe('flat')
    })
  })

  describe('applyPalette', () => {
    it('设置 data-palette 属性', () => {
      const store = usePageConfigStore()
      store.applyPalette('purple')
      expect(store.config.palette).toBe('purple')
      expect(document.documentElement.getAttribute('data-palette')).toBe('purple')
    })

    it('不影响 layout 与 style', () => {
      const store = usePageConfigStore()
      store.applyLayout('top')
      store.applyStyle('glass')
      store.applyPalette('green')
      expect(store.config.layout).toBe('top')
      expect(store.config.style).toBe('glass')
    })

    it('不影响 theme（明暗独立）', () => {
      const store = usePageConfigStore()
      store.applyTheme('dark')
      store.applyPalette('crimson')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('applyLayout', () => {
    it('设置 data-layout 属性', () => {
      const store = usePageConfigStore()
      store.applyLayout('top')
      expect(store.config.layout).toBe('top')
      expect(document.documentElement.getAttribute('data-layout')).toBe('top')
    })
  })

  describe('applyStyle', () => {
    it('设置 data-style 属性', () => {
      const store = usePageConfigStore()
      store.applyStyle('compact')
      expect(store.config.style).toBe('compact')
      expect(document.documentElement.getAttribute('data-style')).toBe('compact')
    })
  })

  describe('changePreset（套餐快捷切换）', () => {
    it('一次性设置三维度', () => {
      const store = usePageConfigStore()
      store.changePreset('geek')
      expect(store.config.palette).toBe('purple')
      expect(store.config.layout).toBe('top')
      expect(store.config.style).toBe('glass')
    })

    it('未知 presetId 回落到 default', () => {
      const store = usePageConfigStore()
      store.changePreset('unknown-id')
      expect(store.config.palette).toBe('blue')
      expect(store.config.layout).toBe('sidebar')
      expect(store.config.style).toBe('flat')
    })
  })

  describe('loadConfig 老数据迁移', () => {
    it('有 preset 没三维度 → 派生三维度', () => {
      localStorage.setItem('forge_admin-page-config', JSON.stringify({
        theme: 'dark',
        preset: 'geek'
      }))
      const store = usePageConfigStore()
      store.loadConfig()
      expect(store.config.palette).toBe('purple')
      expect(store.config.layout).toBe('top')
      expect(store.config.style).toBe('glass')
    })

    it('三维度已被显式设置 → 优先使用三维度', () => {
      localStorage.setItem('forge_admin-page-config', JSON.stringify({
        theme: 'light',
        preset: 'geek',
        palette: 'green',
        layout: 'sidebar',
        style: 'card'
      }))
      const store = usePageConfigStore()
      store.loadConfig()
      expect(store.config.palette).toBe('green')
      expect(store.config.layout).toBe('sidebar')
      expect(store.config.style).toBe('card')
    })

    it('localStorage 损坏时不抛错', () => {
      localStorage.setItem('forge_admin-page-config', '{not json')
      expect(() => {
        const store = usePageConfigStore()
        store.loadConfig()
      }).not.toThrow()
    })

    it('三维度被篡改为非法值 → 回落默认', () => {
      localStorage.setItem('forge_admin-page-config', JSON.stringify({
        palette: 'unknown',
        layout: 'invalid',
        style: 'wrong'
      }))
      const store = usePageConfigStore()
      store.loadConfig()
      expect(store.config.palette).toBe('blue')
      expect(store.config.layout).toBe('sidebar')
      expect(store.config.style).toBe('flat')
    })
  })

  describe('resetConfig store 自洽', () => {
    it('重置后三维度回到默认并应用到 DOM', () => {
      const store = usePageConfigStore()
      store.changePreset('geek')
      store.resetConfig()
      expect(store.config.palette).toBe('blue')
      expect(store.config.layout).toBe('sidebar')
      expect(store.config.style).toBe('flat')
      expect(document.documentElement.getAttribute('data-palette')).toBe('blue')
      expect(document.documentElement.getAttribute('data-layout')).toBe('sidebar')
      expect(document.documentElement.getAttribute('data-style')).toBe('flat')
    })

    it('重置后 theme 回到 light 并应用到 DOM', () => {
      const store = usePageConfigStore()
      store.applyTheme('dark')
      store.resetConfig()
      expect(store.config.theme).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})

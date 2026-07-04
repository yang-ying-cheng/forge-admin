/**
 * 页面配置状态管理
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import {CACHE_KEY, useCache} from "@/hooks/web/useCache.ts";
import {VxeUI} from "vxe-pc-ui";
import { getPreset, type Palette, type LayoutKind, type StyleKind, DEFAULT_CUSTOM_PRIMARY, isValidPrimary } from '@/themes'
import { lightStep, darkStep } from '@/themes/color-utils'
const { wsCache } = useCache()
export type ThemeType = 'light' | 'dark'

export interface PageConfig {
  // 标签页设置
  showTabs: boolean
  maxTabsCount: number
  autoHideTabsOnMobile: boolean // 移动端自动隐藏标签页

  // 主题设置
  theme: ThemeType
  palette: Palette
  customPrimary: string // custom 调色板的主色（HEX）
  layout: LayoutKind
  style: StyleKind

  // 侧边栏设置
  sidebarCollapsed: boolean

  // 其他设置
  showBreadcrumb: boolean
  showPageTransition: boolean
  keepAlive: boolean // 页面缓存（切换标签页不刷新）
}

const LOCAL_STORAGE_KEY = 'forge_admin-page-config'

// 三维度合法性枚举（防止 localStorage 被篡改为未知值）
const VALID_PALETTES: Palette[] = ['blue', 'purple', 'green', 'crimson', 'custom']
const VALID_LAYOUTS: LayoutKind[] = ['sidebar', 'top']
const VALID_STYLES: StyleKind[] = ['flat', 'glass', 'card', 'compact']

// 默认配置
const defaultConfig: PageConfig = {
  showTabs: true,
  maxTabsCount: 20,
  autoHideTabsOnMobile: true, // 默认移动端隐藏标签页
  theme: 'light',
  palette: 'blue',
  customPrimary: DEFAULT_CUSTOM_PRIMARY,
  layout: 'sidebar',
  style: 'flat',
  sidebarCollapsed: false,
  showBreadcrumb: true,
  showPageTransition: true,
  keepAlive: true
}

export const usePageConfigStore = defineStore('pageConfig', () => {
  // 配置对象
  const config = ref<PageConfig>({ ...defaultConfig })

  // 设置对话框显示状态
  const settingsVisible = ref(false)

  // 从 localStorage 加载配置
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        config.value = { ...defaultConfig, ...parsed }

        // 老数据迁移：如有 preset 但缺少三维度，从 preset 派生
        if (parsed?.preset && (!parsed.palette || !parsed.layout || !parsed.style)) {
          const preset = getPreset(parsed.preset)
          config.value.palette = preset.palette
          config.value.layout = preset.layout
          config.value.style = preset.style
        }

        // 校验三维度合法性（防止篡改导致 unknown 值）
        if (!VALID_PALETTES.includes(config.value.palette)) config.value.palette = 'blue'
        if (!VALID_LAYOUTS.includes(config.value.layout)) config.value.layout = 'sidebar'
        if (!VALID_STYLES.includes(config.value.style)) config.value.style = 'flat'

        // 校验 customPrimary 合法性
        if (!isValidPrimary(config.value.customPrimary)) {
          config.value.customPrimary = DEFAULT_CUSTOM_PRIMARY
        }
      } else {
        // 首次访问，跟随系统主题偏好
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          config.value.theme = 'dark'
        }
      }
    } catch (error) {
      console.error('加载页面配置失败:', error)
      config.value = { ...defaultConfig }
    }
  }

  // 保存配置到 localStorage
  const saveConfig = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config.value))
    } catch (error) {
      console.error('保存页面配置失败:', error)
    }
  }

  // 更新配置
  const updateConfig = (key: keyof PageConfig, value: any) => {
    (config.value as any)[key] = value
  }

  // 批量更新配置
  const updateMultipleConfig = (updates: Partial<PageConfig>) => {
    Object.assign(config.value, updates)
  }

  // 重置配置
  const resetConfig = () => {
    config.value = { ...defaultConfig }
    applyTheme(config.value.theme)
    applyPalette(config.value.palette)
    applyLayout(config.value.layout)
    applyStyle(config.value.style)
  }

  // 打开设置面板
  const openSettings = () => {
    settingsVisible.value = true
  }

  // 关闭设置面板
  const closeSettings = () => {
    settingsVisible.value = false
  }

  // 应用主题
  const applyTheme = (theme: ThemeType) => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    wsCache.set(CACHE_KEY.IS_DARK, 'dark' === theme)
    VxeUI.setTheme(theme)
  }

  // 应用调色板
  const applyPalette = (palette: Palette) => {
    config.value.palette = palette
    if (palette === 'custom') {
      applyCustomPalette(config.value.customPrimary)
    } else {
      document.documentElement.setAttribute('data-palette', palette)
      // 切回预设时清理 custom 写入的 inline style，避免残留覆盖预设
      clearCustomPaletteInlineStyle()
    }
  }

  // 应用 custom 调色板：根据主色派生 EP 颜色阶梯并写到 inline style
  const applyCustomPalette = (primary: string) => {
    const safe = isValidPrimary(primary) ? primary : DEFAULT_CUSTOM_PRIMARY
    config.value.customPrimary = safe
    document.documentElement.setAttribute('data-palette', 'custom')
    // inline style 直接覆盖 EP 变量（特异性 1,0,0,0 高于任何 SCSS 选择器）
    const root = document.documentElement
    root.style.setProperty('--app-color-primary', safe)
    root.style.setProperty('--el-color-primary', safe)
    root.style.setProperty('--el-color-primary-light-3', lightStep(safe, 30))
    root.style.setProperty('--el-color-primary-light-5', lightStep(safe, 50))
    root.style.setProperty('--el-color-primary-light-7', lightStep(safe, 70))
    root.style.setProperty('--el-color-primary-light-9', lightStep(safe, 90))
    root.style.setProperty('--el-color-primary-dark-2', darkStep(safe, 20))
    root.style.setProperty('--vxe-ui-primary-color', safe)
  }

  // 清理 custom 调色板写入的 inline style
  const clearCustomPaletteInlineStyle = () => {
    const root = document.documentElement
    ;[
      '--app-color-primary',
      '--el-color-primary',
      '--el-color-primary-light-3',
      '--el-color-primary-light-5',
      '--el-color-primary-light-7',
      '--el-color-primary-light-9',
      '--el-color-primary-dark-2',
      '--vxe-ui-primary-color'
    ].forEach(prop => root.style.removeProperty(prop))
  }

  /** 用户在颜色选择器中改 custom 主色 */
  const changeCustomPrimary = (primary: string) => {
    if (config.value.palette === 'custom') {
      applyCustomPalette(primary)
    } else {
      // 暂存到 config，但不应用（等切到 custom 时再 apply）
      config.value.customPrimary = isValidPrimary(primary) ? primary : DEFAULT_CUSTOM_PRIMARY
    }
  }

  // 应用布局
  const applyLayout = (layout: LayoutKind) => {
    config.value.layout = layout
    document.documentElement.setAttribute('data-layout', layout)
  }

  // 应用样式
  const applyStyle = (style: StyleKind) => {
    config.value.style = style
    document.documentElement.setAttribute('data-style', style)
  }

  // 切换套餐（一次性设置三维度）
  const changePreset = (presetId: string) => {
    const preset = getPreset(presetId)
    applyPalette(preset.palette)
    applyLayout(preset.layout)
    applyStyle(preset.style)
  }

  // 三维度独立切换
  const changePalette = (palette: Palette) => applyPalette(palette)
  const changeLayout = (layout: LayoutKind) => applyLayout(layout)
  const changeStyle = (style: StyleKind) => applyStyle(style)

  // 切换主题
  const toggleTheme = () => {
    const newTheme = config.value.theme === 'light' ? 'dark' : 'light'
    config.value.theme = newTheme
    applyTheme(newTheme)
  }

  // 监听配置变化，自动保存
  watch(
    () => config.value,
    () => {
      saveConfig()
    },
    { deep: true }
  )

  // 初始化时加载配置并应用
  loadConfig()
  applyTheme(config.value.theme)
  applyPalette(config.value.palette)
  applyLayout(config.value.layout)
  applyStyle(config.value.style)

  return {
    config,
    settingsVisible,
    updateConfig,
    updateMultipleConfig,
    resetConfig,
    openSettings,
    closeSettings,
    loadConfig,
    saveConfig,
    applyTheme,
    applyPalette,
    applyLayout,
    applyStyle,
    changePreset,
    changePalette,
    changeLayout,
    changeStyle,
    changeCustomPrimary,
    toggleTheme
  }
})

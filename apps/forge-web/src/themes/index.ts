export type Palette = 'blue' | 'purple' | 'green' | 'crimson' | 'custom'
export type LayoutKind = 'sidebar' | 'top'
export type StyleKind = 'flat' | 'glass' | 'card' | 'compact'

export interface Preset {
  id: string
  name: string
  palette: Palette
  layout: LayoutKind
  style: StyleKind
}

export const PRESETS: Preset[] = [
  { id: 'default',  name: '默认',     palette: 'blue',    layout: 'sidebar', style: 'flat' },
  { id: 'geek',     name: '极客紫',   palette: 'purple',  layout: 'top',     style: 'glass' },
  { id: 'business', name: '商务器',   palette: 'green',   layout: 'sidebar', style: 'card' },
  { id: 'dark-pro', name: '酷暗黑',   palette: 'crimson', layout: 'sidebar', style: 'compact' }
]

export const getPreset = (id: string): Preset =>
  PRESETS.find(p => p.id === id) ?? PRESETS[0]

/** EP 默认主色（custom 模式首次默认值） */
export const DEFAULT_CUSTOM_PRIMARY = '#409EFF'

/** HEX 主色校验（严格 6 位 #RRGGBB） */
export function isValidPrimary(hex: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(hex.trim())
}

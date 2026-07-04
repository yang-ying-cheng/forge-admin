/**
 * 运行时颜色工具（与 themes/_color-utils.scss 的 SCSS 编译期版本语义对齐）
 *
 * SCSS 版本是编译期生成静态 CSS 变量阶梯；本文件是运行时版本，用于 custom 调色板
 * 根据用户输入的 HEX 主色实时派生 Element Plus 颜色阶梯并写到 DOM inline style。
 */

interface RGB { r: number; g: number; b: number }

const HEX_RE = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

/** HEX 字符串转 RGB（支持带或不带 # 前缀） */
export function hexToRgb(hex: string): RGB | null {
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  }
}

/** RGB 数字（0-255）转两位 HEX */
function toHex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}

/** RGB 转 HEX 字符串（带 # 前缀，小写） */
export function rgbToHex({ r, g, b }: RGB): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`
}

/**
 * 两色混合（与 SCSS color.mix 算法一致：RGB 直接插值）
 * @param c1 HEX 颜色 1
 * @param c2 HEX 颜色 2
 * @param weight c1 的权重百分比（0-100）
 */
export function mix(c1: string, c2: string, weight: number): string {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)
  if (!rgb1 || !rgb2) return c1 // 解析失败回落原色
  const w = weight / 100
  return rgbToHex({
    r: rgb1.r * w + rgb2.r * (1 - w),
    g: rgb1.g * w + rgb2.g * (1 - w),
    b: rgb1.b * w + rgb2.b * (1 - w)
  })
}

/**
 * 与白色混合派生浅色（weight 越大越浅）
 * 与 SCSS light-step($c, $weight) = color.mix(white, $c, $weight) 语义对齐：
 * weight 表示白色的比重。
 */
export function lightStep(c: string, weight: number): string {
  return mix('#ffffff', c, weight)
}

/**
 * 与黑色混合派生深色（weight 越大越深）
 * 与 SCSS dark-step($c, $weight) = color.mix(black, $c, $weight) 语义对齐：
 * weight 表示黑色的比重。
 */
export function darkStep(c: string, weight: number): string {
  return mix('#000000', c, weight)
}

/** 校验 HEX 颜色合法性（带或不带 # 前缀） */
export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim())
}

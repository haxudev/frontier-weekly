/**
 * 网站配置 - 用于社交分享和 SEO
 * 请在部署时更新 SITE_URL 为实际域名
 */

export const siteConfig = {
  // 网站基础 URL（不带末尾斜杠）
  // 优先使用环境变量，否则使用默认值
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://frontierweekly.com',
  
  // 网站名称
  name: {
    zh: '前沿今辰观',
    en: 'Frontier Daily',
  },
  
  // 网站描述
  description: {
    zh: '无噪声前沿趋势发现与科技干货洞察',
    en: 'No slop frontier trends and firsthand tech insights',
  },
  
  // 作者信息
  author: {
    name: 'Frontier Daily Team',
    email: 'xuhaoruins@hotmail.com',
  },
  
  // 社交媒体账号（可选，用于 Twitter Card）
  twitter: {
    site: '', // 如 @frontierweekly
    creator: '', // 如 @yourhandle
  },
  
  // OG 图片默认配置
  ogImage: {
    width: 1200,
    height: 630,
  },
}

/**
 * 获取完整的页面 URL
 */
export function getPageUrl(path = '', lang = 'zh') {
  const base = siteConfig.url
  if (lang === 'en') {
    return `${base}/en${path}`
  }
  return `${base}${path}`
}

/**
 * 获取 OG 图片 URL
 */
export function getOgImageUrl(title, lang = 'zh') {
  const base = siteConfig.url
  return `${base}/api/og?title=${encodeURIComponent(title)}&lang=${lang}`
}

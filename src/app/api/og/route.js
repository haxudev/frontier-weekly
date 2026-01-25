import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * 动态生成社交媒体分享图片 (OG Image)
 * 
 * 用法: /api/og?title=文章标题&lang=zh
 * 
 * 支持微信分享时显示精美的预览图
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || '前沿今辰观'
  const lang = searchParams.get('lang') || 'zh'
  
  const isEnglish = lang === 'en'
  const siteName = isEnglish ? 'Frontier Daily' : '前沿今辰观'
  const subtitle = isEnglish 
    ? 'No slop frontier trends and firsthand tech insights'
    : '无噪声前沿趋势发现与科技干货洞察'

  // 计算标题字体大小（根据标题长度动态调整）
  const titleLength = title.length
  let titleFontSize = 56
  if (titleLength > 40) titleFontSize = 40
  else if (titleLength > 25) titleFontSize = 48

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* 装饰性背景元素 */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '60px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '80px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.15))',
            filter: 'blur(60px)',
          }}
        />

        {/* 网站名称 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '40px',
              background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
              borderRadius: '4px',
              marginRight: '16px',
            }}
          />
          <span
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: isEnglish ? '0.05em' : '0.1em',
            }}
          >
            {siteName}
          </span>
        </div>

        {/* 文章标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '1000px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
              margin: 0,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {title}
          </h1>
        </div>

        {/* 副标题 */}
        <p
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '32px',
            letterSpacing: isEnglish ? '0.02em' : '0.05em',
          }}
        >
          {subtitle}
        </p>

        {/* 底部装饰线 */}
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            width: '200px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

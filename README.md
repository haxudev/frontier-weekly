# Weekly Analysis Brief / 科技研究周报

一个简洁优雅的周报发布网站，支持 Markdown 内容渲染和中英双语。

## ✨ 特性

- 📝 **Markdown 渲染** - 优雅的 Markdown 内容展示，支持 GFM 语法
- 🌓 **深色/浅色模式** - 自动跟随系统设置，支持手动切换
- 🌍 **中英双语** - 界面支持中文和英文切换
- 📅 **历史回顾** - 按年份归档，方便查看往期内容
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **静态生成** - 支持静态导出，便于部署

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 查看网站。

### 构建生产版本

```bash
npm run build
```

### 静态导出

构建后的静态文件将输出到 `out` 目录，可直接部署到任何静态托管服务。

## 📁 项目结构

```
weekly-brief/
├── content/
│   └── weeks/           # 周报 Markdown 文件
│       ├── 2026-week-01.md
│       ├── 2025-week-52.md
│       └── ...
├── src/
│   ├── app/             # Next.js App Router 页面
│   ├── components/      # React 组件
│   ├── contexts/        # React Context (语言切换)
│   └── lib/             # 工具函数
├── public/              # 静态资源
└── ...
```

## 📝 添加新周报

在 `content/weeks/` 目录下创建新的 Markdown 文件，文件名格式建议为 `YYYY-week-WW.md`。

### Frontmatter 格式

```markdown
---
title: 周报标题
date: 2026-01-03
weekNumber: 1
tags:
  - 标签1
  - 标签2
  - 标签3
---

# 周报正文内容

...
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 周报标题 |
| `date` | string | 发布日期 (YYYY-MM-DD) |
| `weekNumber` | number | 周数编号 |
| `tags` | array | 标签列表（可选） |

## 🎨 自定义样式

### 主题色

编辑 `tailwind.config.js` 中的 `colors.primary` 来修改主题色：

```js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#你的颜色',
        // ...
      }
    }
  }
}
```

### Markdown 样式

编辑 `src/app/globals.css` 中的 `.markdown-content` 相关样式。

## 🌐 部署

### Vercel (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 自动构建和部署

### 静态托管

```bash
npm run build
```

将 `out` 目录部署到任何静态托管服务（GitHub Pages, Netlify, Cloudflare Pages 等）。

## 🧠 记忆统计（Supabase）

本项目新增了一个记忆来源统计页面，用于展示 `memory_source_stats` 的 Top 10 来源占比，并将其余来源合并到“其他”。

### 环境变量

参考 [.env.example](.env.example) 添加到 `.env.local`：

- `SUPABASE_URL`
- `SUPABASE_PUBLIC_KEY`（Supabase anon/publishable key）

### 展示与接口

- 展示：全站右下角浮动按钮「记忆 / Memory」，点击弹出统计泡泡
- 静态数据：`/memory-source-stats.json`（构建期生成）

如果你看到 404 且错误里带 `PGRST205`，通常表示 PostgREST 找不到 `public.memory_source_stats`（表/视图不存在，或不在暴露的 schema）。

可通过环境变量自定义：

- `MEMORY_SOURCE_STATS_TABLE`（默认 `memory_source_stats`）
- `MEMORY_SOURCE_STATS_SCHEMA`（默认 `public`，会作为 `Accept-Profile` 发送给 PostgREST）

### 本地命令行查询

```bash
npm run memory:stats
```

### 说明（静态导出）

本项目启用了 Next.js 静态导出（`output: 'export'`），因此不使用 `app/api/*` 路由。
记忆统计数据会在构建阶段尝试从 Supabase 拉取并写入 `public/memory-source-stats.json`；
如果构建环境未配置 Supabase 变量，将生成空数据以保证静态站点可以正常构建与部署。

## 📄 License

MIT

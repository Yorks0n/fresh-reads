---
title: "〔中译〕The new Matter for Web"
source: links
published: "2026-11-24T09:00:00+08:00"
slug: "the-new-matter-for-web"
summary: "Matter 官网公告全文中译：重构版 Matter for Web 的排版、双栏布局、⌘K 与批量整理等新细节。"
lang: zh-CN
---

> 原文：[The new Matter for Web](https://www.getmatter.com/web-app/)（Matter 官网公告，2026 年 11 月）。本文是完整中文翻译（非摘要），由 Link 翻译于 2026-11-24。

今天，Matter 正式推出全新的 [Matter for Web](https://web.getmatter.com)。它从零开始重构，比以往更快、功能更强、界面更美，也支持更多个性化设置。下面是一份简明导览——从排版聊到键盘快捷键。

![Matter for Web：左侧导航 rail、Queue 队列，以及在阅读器中打开的文章](https://www.getmatter.com/web-app/m/hero.webp)

## 排版

新应用对排版格外用心，遵循 Robert Bringhurst 的经典之作《排版设计基础》（The Elements of Typographic Style）的原则。

文本全面采用两端对齐：断行算法在断开任何一行之前，会先通盘权衡整个段落，并把词间距约束在 1/5 至 1/3 em 之间。

- **行长 Measure**：每行约 66 个字符；宽屏设置下约 75 个字符
- **词间距 Word spaces**：介于 1/5 em 至 1/3 em 之间
- **连字符 Hyphens**：断词处前至少两个字母、后至少三个字母；段落的最后一个完整行不使用连字符
- **段落节奏 Rhythm**：段落之间半行；标题上方一个整行，下方半行
- **全大写词 Capitals**：增加 6% 的字间距
- **数字 Figures**：正文里用不齐线数字（oldstyle），标题里用齐线数字（lining）
- **字体 Faces**：共九款，包括 Lyon Text、Valkyrie 和 Geist Serif，每款都校准到相同的 x 字高与行距

我们挑选了用心的默认值——包括新加入的 Geist Serif——但字体、字号、栏宽、对齐方式与主题，都可以按你的喜好自行定制。

## 信息架构

Matter 里有很多列表：除了 Inbox 和 Queue，还有 Highlights、Favorites、Archive 这样的次级列表，以及内容过滤器、你关注的订阅源和标签。

我们的设计目标是让这些列表触手可及，同时避免完全展开的侧边导航栏带来的那种沉重的视觉负担。

我们选择了紧凑的导航 rail：静止时隐藏文字标签，鼠标悬停时展开为相应的菜单。比如 Library 展开为一个标准的弹出菜单，而 Following 和 Tags 会唤起一个自带搜索的整高面板。这些菜单都是即用即走，永远不会与文章抢戏。

## 双栏布局

旧版网页应用默认是单栏全宽列表，新版则默认双栏布局。对比一下：

![Before：旧版 Matter 网页应用，Queue 是一个全宽列表](https://www.getmatter.com/web-app/m/before.webp)

![After：列表与阅读器中的文章并排](https://www.getmatter.com/web-app/m/after.webp)

此前我们一直抵制双栏布局，原则是「阅读时不应有任何干扰」。问题在于，超宽列表既笨拙又浪费空间。

为了减少干扰，我们把进入专注模式做得非常容易：按下 Return，或双击一篇文章（或点击工具栏右端的展开图标）即可。开始滚动之后，工具栏自己也会淡出。

侧栏——包括 Co-Reader（为文章生成摘要、回答你就文章提出的问题）、你的 Notebook（高亮与笔记），以及 More like this（相关推荐）——默认隐藏，需要时按下 `]` 呼出。

## ⌘K

Matter 里几乎所有功能都能通过 ⌘K 到达。输入「dark」「kindle」或「import」，你要找的功能就在眼前。

这个组件用的是 Paco Coursey 的 cmdk 库。

## 我们得意的一些细节（不完全清单）

### 批量整理 Bulk triage

用过 Superhuman 的话，你会感到熟悉。按住 Shift 再按 `↓` 选中多篇文章，或按 `⌘A` 全选整个列表，然后一次性归档、收藏、打标签或导出。你甚至可以把一摞文章导出为单个 PDF，开头还带一份目录。

### 文本选择工具栏

我们重新设计了文本选择工具栏，让它更清晰、更流畅、更直觉。举个小例子：选中一整段通常要点三次——第一次定住光标，第二次选中一个单词，第三次选中整段。我们现在会在第二次点击（选单词）时抑制工具栏，免得它在整段被选中之前闪一下。

另一个便利：按住 ⌘，一次点击即可选中一整段。工具栏还会变形为笔记输入框。

### 标注缩影 Annotations Minimap

文章右缘的标记对应每条高亮在页面上的落点，一眼就能看出一篇内容被划得多密、划在哪里。悬停即可阅读高亮，点击即可跳转过去。左缘的标记对各级标题做同样的事。

### 金句图 Quote shots

我们设计了一组海报风格的图形模板，用来分享金句，共二十一种样式，从简单的高亮卡片到瑞士风排版再到凸版印刷。每个元素都可自定义——包括去除水印。

### 打印

我们热爱纸（这句话有损我们的人设！），所以打印版式倾注了心血：宽边距、两端对齐，还可以把图片剔除——正是它们在分页处撑出大片尴尬的空白。

### PDF

现在可以拖放 PDF 了。（终于。）

## 把你的资料库带过来

从 Readwise Reader、Instapaper、Pocket、Omnivore、Raindrop 或 GoodLinks 迁移？把你的导出文件直接拖进应用就行。

这是一个我们拖了太久的重构；如今终于有了一个连我们自己都喜欢的网页应用，感觉真好。去 [web.getmatter.com](https://web.getmatter.com) 试试吧。如果有什么让你不爽的地方，无论多小，都请写信告诉我们：<hello@getmatter.com>。

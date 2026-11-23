# 新鲜事儿

公开的全文阅读存档。各来源把每日稿件写成 Markdown，放进这个仓库；GitHub Actions 用 Astro 生成静态网页和全文 RSS，再发布到 GitHub Pages。

约定地址是 <https://yorks0n.github.io/fresh-reads/>。阅读器订阅全文，网页只是一个能在手机上读的简单目录。

生产环境的 `content/` 可以是空的。测试用的虚构稿在 `tests/fixtures/`，不会进入站点，也不会进入订阅源。

## 架构

```text
content/<source>/YYYY-MM-DD[-slug].md
        │
        ▼
  校验 frontmatter（失败则构建失败）
        │
        ▼
  marked 把 Markdown 渲染成 HTML（不是 MDX，不会执行组件）
        │
        ▼
  sanitize-html 按同一份允许列表消毒
        │
        ▼
  若正文第一个 h1 与 title 相同，删掉这个 h1
        │
        ▼
  改写站内链接；把内容目录里的相对图片收成 /media/...
        │
        ├─► 网页文章使用这份 HTML
        └─► RSS 的 description 和 content:encoded 使用同一份 HTML
            （相对地址改成绝对地址）
        │
        ▼
  Astro 静态构建。网页和 feed 都是构建产物，不提交进仓库
        │
        ▼
  推到 main 后，GitHub Actions 用官方 Pages 动作部署
```

运行时依赖只有 Astro、marked、sanitize-html、js-yaml。没有客户端 JavaScript。

## 实现时定下的规则

- 站点源是 `https://yorks0n.github.io`，base 是 `/fresh-reads`。这是用户项目 Pages 的路径：仓库名 `fresh-reads` 会挂在用户站点下面。导航、canonical、订阅地址、图片都从 `src/lib/site.js` 这一处拼出来。
- 永久链接是 `/p/<source>/<slug>/`。`slug` 就是这篇的永久 id。可以同时写 `id`，但必须和 `slug` 相同。
- RSS 的 guid 固定为 `tag:yorks0n.github.io,2026:fresh-reads/<source>/<slug>`，`isPermaLink="false"`。这里的 `2026` 是这套编号启用的年份，不是文章年份。按年去改它会让所有旧稿变成新 guid。
- 同一 slug 再次提交会换正文，guid 和链接不变。`pubDate` 始终用 `published`。若写了 `updated`，feed 里的 `atom:updated` 用它，否则用 `published`。
- 不保证已经订阅的阅读器会刷新旧文。不少客户端按 guid（有的还连同 `pubDate`）缓存全文。本站不会为了逼客户端刷新而去换 guid。会重新拉取并采用 `content:encoded` 的阅读器能看到新正文；其余客户端可能一直显示旧正文，直到用户清缓存或重新订阅。这里没有拿 GoodLinks、NetNewsWire、Reeder 做过实测。
- `description` 和 `content:encoded` 都是消毒后的全文。前者按 XML 转义，后者放在 CDATA 里。短摘要 `summary` 只用在网页列表上。
- 本地图片复制到 `/media/<source>/...`。feed 里写成 `https://yorks0n.github.io/fresh-reads/media/...`。`https://` 图片保持原样。
- 样式表很小，Astro 会把它内联进页面。只要另外产生静态资源，URL 也必须带 `/fresh-reads`。
- Markdown 里的站内链接写成 `/archive/`、`/p/<source>/<slug>/` 这种不带 base 的路径，构建时再补上 `/fresh-reads`。

## 本地命令

需要 Node.js 22 或更新版本。

```bash
npm ci
npm test
npm run dev
npm run build
npm run preview
node scripts/import-html.mjs --help
```

`npm test` 会跑校验、渲染、RSS，并真正执行三次 Astro 构建：虚构夹具、空目录、一条错误元数据。`npm run build` 使用仓库里的 `content/`，把结果写到 `dist/`。`dist/` 不提交。

开发服务器和预览的首页是 <http://127.0.0.1:4321/fresh-reads/>。

## 稿件格式

一篇一个文件：

```text
content/<source>/YYYY-MM-DD.md
content/<source>/YYYY-MM-DD-<slug>.md
```

`<source>` 和 `<slug>` 都是小写 slug：字母、数字、短横线，不能首尾是短横线。文件名里的日期必须等于 `published` 的 `+08:00` 日历日。文件名里如果写了 slug，必须和 frontmatter 一致。

建议的来源目录名（只是约定，代码不写死）：

| 来源 | 目录 |
| --- | --- |
| Reddit | `reddit` |
| 游戏 | `games` |
| Hacker News | `hn` |
| 中文 X | `chinese-x` |

新来源直接建新目录，不用改代码。

```markdown
---
title: "【示例·虚构】一篇不会发布的标题"
source: hn
published: "2026-01-15T08:30:00+08:00"
slug: "fictional-digest"
updated: "2026-01-15T09:45:00+08:00"
summary: "纯文本短摘要，不是真实新闻。"
lang: zh-CN
---

正文可以用 Markdown，也可以夹安全的 HTML。

## 小节

- 列表
- **粗体** 和 *强调*

> 引用

`代码` 和表格、图片、链接都会保留。
```

必填：`title`、`source`、`published`、`slug`（或与之相同的 `id`）。

可选：`updated`、`summary`、`lang`。

`published` 和 `updated` 必须是 `YYYY-MM-DDTHH:mm:ss+08:00`。`Z`、`+00:00`、没有时区的日期都会让构建失败。时间按东八区核对，`2026-02-31` 这种日期也会失败。

未知字段会失败，避免把写错的 `publised` 悄悄丢掉。`summary` 只能是纯文本。不要使用 `.mdx`。

同一来源下 slug 不能重复。不同来源可以同名 slug，guid 里带了来源。

构建失败时会列出文件路径和原因，例如：

```text
内容校验失败（2）：
- hn/2026-01-15-story.md: published 必须是 YYYY-MM-DDTHH:mm:ss+08:00（必须写明 +08:00，不能用 Z 或其他时区）
- hn/note.md: 文件名必须是 YYYY-MM-DD.md 或 YYYY-MM-DD-<slug>.md
```

## 从完整 HTML 导入

已有的整页 HTML 不要原样提交。导入脚本抽出 `body`，丢掉 `head`、样式表和脚本，再消毒成可以嵌进 Markdown 的片段。页面自己的 CSS 不会留下来。标题、粗体、列表、引用、代码、链接、图片、表格这些语义会留下。构建时还会用同一套规则再消毒一次。

```bash
node scripts/import-html.mjs \
  --html ./digest.html \
  --source hn \
  --slug fictional-digest \
  --title "【示例·虚构】一篇不会发布的标题" \
  --published 2026-01-15T08:30:00+08:00 \
  --summary "虚构导入示例" \
  --lang zh-CN \
  --out content/hn/2026-01-15-fictional-digest.md
```

输出文件名必须是 `YYYY-MM-DD-<slug>.md`。脚本只读本地文件，不会联网，也不会写入密钥。

## 网页上保留什么

统一模板提供版式。正文里保留：

- 标题层级 `h1`–`h6`（与 `title` 相同的第一个 `h1` 会去掉，避免和模板标题重复）
- 段落、换行、粗体、强调、删除线
- 有序和无序列表、引用
- 行内代码和代码块
- 链接、图片、图注
- 基本表格（含 `colspan` / `rowspan`）

会去掉：`script`、`style`、`iframe`、表单和输入控件、`svg`、事件属性（`onclick`、`onerror` 等）、`javascript:`、`data:`、`vbscript:`、`file:`、协议相对地址 `//...`。不允许的标签如果只是包了一层（例如 `div`），里面的段落和文字还在。

本地图片用相对路径，例如 `![说明](./shot.png)`，文件放在同一篇 Markdown 旁边，且必须位于 `content/` 内。允许 png、jpg、jpeg、gif、webp、avif。不接受 svg，避免把可执行的标记送上同一域名。`https://` 图片不下载、不改写。

## RSS

| 地址 | 内容 |
| --- | --- |
| `/fresh-reads/feeds/all.xml` | 全部稿件 |
| `/fresh-reads/feeds/<source>.xml` | 该来源 |

绝对地址形如 `https://yorks0n.github.io/fresh-reads/feeds/all.xml`。

每页 `<head>` 都有 `rel="alternate"` 的 feed 发现链接。首页、来源页和文章页也有可读的「订阅」链接，不只有机器可读的 `<link>`。

GitHub Pages 按扩展名把 `.xml` 发成 `application/xml`。这里改不了响应头。常见阅读器接受这个类型；页面上的发现链接仍然标明 `application/rss+xml`。

空目录也会生成合法的 `/feeds/all.xml`，里面没有 `<item>`。没有稿件的来源不会出现单独的 feed。

`lastBuildDate` 取现有稿件里最晚的 `updated` 或 `published`，不用构建当时的时钟，所以没有内容变化时 feed 日期不变。

## 修订和并行投稿

修订一篇已发布的稿：改原来的那个文件，保持 `slug` 不变。可以改正文和 `updated`。不要另起一个 slug 再删掉旧文件，否则 guid 变了，阅读器会把它当成新的一篇。

文件名里的日期是首次发布日。链接里没有日期，所以只改文件名、不改 slug 时旧链接还在；没有必要时不要改文件名。

不同来源、不同文件的改动路径不重叠，可以各自开 pull request，一起合并。不要 `git push --force`，也不要重置 `main`。同一文件撞车时，把 PR 更新到最新的 `main` 再解决冲突。

本阶段不发放机器人凭证，也不把任何机器人接到这个仓库。投稿先用 pull request。

## 权限边界

GitHub 的 classic PAT、fine-grained PAT 和 Actions 的 `GITHUB_TOKEN` 都不能按子目录授权。能写这个仓库的令牌，就能改 `content/` 以外的任何文件，包括工作流。细粒度令牌的粒度是整个仓库，不是文件夹。

因此「只让某个来源机器人改自己的目录」不能靠令牌实现。能做的是：

- 约定每个机器人只提交 `content/<自己的来源>/`
- CI 拒绝坏的元数据和重复 slug
- 用 pull request 看 diff
- 以后如果需要，可以加 CODEOWNERS，按路径请求评审

CODEOWNERS 只会要求对应的人来评审，不能阻止一个已经有写权限的令牌改别的目录。不要把它理解成目录级权限。

这个仓库里的工作流只用 `GITHUB_TOKEN`：测试任务是 `contents: read`；部署任务额外要 `pages: read`、`actions: write` 来上传产物，以及部署任务上的 `pages: write` 和 `id-token: write`。没有个人访问令牌，也没有把密钥写进仓库。

## 公开内容

仓库是公开的。合并之后，全文、图片和 feed 任何人都能看到。

不要提交：

- 未公开的群聊、私人消息、未准备公开的历史存档
- 令牌、cookie、密码、私钥、内网地址
- 写成「真实新闻」的虚构例子

虚构示例只放在 `tests/fixtures/`，标题带「【示例·虚构】」。生产目录只放准备公开的稿件。

## 启用 GitHub Pages

仓库已经是 Public。Actions 不能用默认的 `GITHUB_TOKEN` 替你打开 Pages，需要在网页上选一次来源。

1. 打开 <https://github.com/Yorks0n/fresh-reads/settings/pages>。
2. Build and deployment → Source 选 **GitHub Actions**。
3. 把本 PR 合并到 `main`。合并后的 `pages` 工作流会测试、构建并部署。也可以在 Actions 里对 `main` 手动运行 `pages`。
4. 若第一次部署停在 `github-pages` 环境保护规则上，由仓库管理员批准这一次。
5. 打开 <https://yorks0n.github.io/fresh-reads/>。

`pages` 工作流只在 `main` 的推送和手动运行时部署，pull request 不会部署。手动运行若选了别的分支，任务会跳过，避免把未合并的分支发到正式站点。

若还没把 Source 改成 GitHub Actions，`configure-pages` 会失败。改完设置后重跑 `pages` 即可。工作流还会核对 Pages 的 base path 是 `/fresh-reads`。

生成出来的 HTML 和 XML 不要提交。`.gitignore` 排除了 `dist/`。

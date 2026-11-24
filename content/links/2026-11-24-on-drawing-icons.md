---
title: "〔中译〕On Drawing Icons"
source: links
published: "2026-11-24T18:00:00+08:00"
slug: "on-drawing-icons"
summary: "Mark Otto 讲述 Pierre 全新图标库的诞生:1,200 多个新图标、三种尺寸的设计系统、Figma 组件化绘制与自制插件,以及一条以规范 SVG 为契约的 Figma-to-React 构建管线。"
lang: zh-CN
---

发布于 2026 年 11 月 18 日,作者 [@mdo](https://x.com/mdo)


历时数月的设计与开发,Pierre 今天迎来了一个全新的图标库。过去几个月里,我在这上面花了多得离谱的时间——为一个一个图标的细节较劲,打磨整个系统,顺手改进构建管线。现在是时候把这一切展示出来了:先讲怎么设计图标,再讲怎么构建它们的 React 组件,以及一路上那些有趣的岔路。

![Pierre 线性图标](https://pierre.computer/writing/on-drawing-icons/pierre-icons-outline.png)

*新 Pierre beta 图标的一览。*

你完全可以说这是一次复仇式重设计——毕竟 [Cursor 的图标把我们所有人都"碾压"了](https://www.minoradventures.co/blog/the-making-of-cursors-icons)(icon-mogged us all)。他们的文章展示了产品图标库必须随产品一起演进,而要做到位,往往需要彻底重画一遍,才能得到一个更统一、更漂亮的库。整体做得真好,处处都是佳作。这帮家伙,胆子可真不小。

当然,这一切与复仇毫无关系,与*手艺*才有关系。重画这些图标的同时,我们也可以重新审视它们在我们的 React 应用里被处理、打包和使用的全过程。自底向上:一次像素级的重设计,加上一场幕后代码的大翻修。

最终成果是 1,200 多个新图标,覆盖三种尺寸、最多三种变体,全部可以在 Figma、SVG 和 React 中使用。

且看我们是怎么一步步走到这里的。

## 我们是如何走到这一步的

### 最初的图标

把时间拨回 2022 年,我们刚开始做 Pierre 的时候。这批风格极不统一的小图标,是我为 Pierre 画的最早一批图标。除了给工作状态和 Git 状态定下几个基本形——圆形表示工作,超椭圆(squircle)表示 Git——之外,几乎没有什么别的东西把它们凝聚在一起。

![Pierre 早期产品图标的一部分](https://pierre.computer/writing/on-drawing-icons/pierre-original-icons.png)

从一开始,它们的描边宽度就参差不齐,viewBox 尺寸五花八门,还有一大堆构图上的杂乱与错误。有些我压根没用过,因为它们实在是……太糟了。

工作状态图标与 Git 状态图标之间是最一致的——事后想想也合理,因为那正是当时我们在产品上投入最多时间和精力的地方。来点回忆,看看当时的模样。

![展示 Blended Diffs 提案的 Pierre 分支页面](https://pierre.computer/writing/on-drawing-icons/pierre-diff-branch.png)

*回看 Pierre 大约第二个产品版本。*

快进到 2025 年,我们刚对产品做了一次大规模翻修:加入 GitHub 同步、全新的界面、简化的流程,还探索了一个围绕洞察、生产力与代码评审的 agentic(智能体)首页。

![Pierre 的 change 视图,界面各处都在使用图标](https://pierre.computer/writing/on-drawing-icons/pierre3-change.png)

*大概是 Pierre v4?我很爱这个方向,至今深深怀念。*

图标集也膨胀了——有些是真的变宽了(说的就是你,宽房子)——而且它们在界面中的地位愈发重要。图标以新的尺寸、颜色和组件形态遍地开花。我的最爱之一,是小巧的填充图标叠加层,以及 Reviewers(评审者)的头像堆叠。那感觉太对了。

![使用图标系统的 Pierre 界面控件与元数据](https://pierre.computer/writing/on-drawing-icons/pierre3-icons-ui.png)

*Pierre change 界面的新组件。*

最后来到 2026 年:老的 Pierre 产品不复存在,我们有了 [Code Storage](https://code.storage),以及 [Diffs](https://diffs.com)、[Trees](https://trees.com) 等开源项目和更多产品。产品天翻地覆,图标却没跟上。

### Pierre 图标库 v1

这就是上一代 Pierre 图标库的起点。将近 400 个图标,风格混杂,但几乎全部采用 1.5px 的描边宽度。

![Pierre icons v1](https://pierre.computer/writing/on-drawing-icons/pierre-icons-v1.png)

*2026 年年中时的上一代 Pierre 图标库。*

一眼望去,你可能会注意到:

- 我们有一大堆箭头和尖角。这些年来我似乎从来没有对它们的大小、描边或 viewBox 满意过。
- 自从 Pierre.co 停运,大量图标再无用武之地,正是削减冗余的好机会:富文本编辑、Linear 的 issue 关联、各种设备等等。
- 有些图标只是换了个名字重复存在。
- 一些图标有自定义的 viewBox——横长形通常是 18×16px(比如侧栏开关图标),窄尖角则是 8×16px。
- 我们各自都有几个自己深恶痛绝的图标。Jacob 一直不喜欢我的齿轮图标,我讨厌那个折叠地图图标,至于 sparkle 图标——如今我们每个人都有一肚子话想说。

我们还有另一个更小的图标库,用于 [Pierre VS Code 图标主题](https://diffs.com/icons)。我们在 Trees 项目中使用这些图标,它们大多是语言、标准和项目的品牌专属图标。

![Pierre VS Code icons](https://pierre.computer/writing/on-drawing-icons/pierre-vscode-icons.png)

*[Pierre VS Code Icons](https://diffs.com/icons),可在 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pierrecomputer.pierre-vscode-icons) 上获取。*

清理那套图标并不在这次工作的直接范围之内,但画某些图标的 Duo 变体时,我心里装着它们。等时机成熟,我可以速通式地把它们也翻新一遍。

### 我们的图标工作流

现有的工作流很简单:在 Figma 里设计,导出为 SVG,再用 npm 脚本处理、优化并转换成 React 组件。

- 在 Figma 中按 16×16px 网格绘制图标。
- 用 Figma 的原生导出把图标导出为 SVG。
- 通过 npm 脚本按目录导入源 SVG。
- 用 [SVGO](https://github.com/svg/svgo) 优化和清理 SVG,去掉 Figma 特有的杂质、扁平化分组、剥离固定颜色等等。
- 再用 [SVGR](https://react-svgr.com/) 把优化后的 SVG 转换成带类型的 React 组件,并附带共享的自定义 props。

这一切由一条 `npm run icons:beta` 命令完成:先清空现有目录,再从零重建每一个图标。

```bash
➜ ~/pierre/icons (icons-next) npm run icons:beta
Building icons...

► Cleaning up existing generated components...
  🗑 Removed 423 existing components
► Building canonical SVG variants from manifest...
  ✓ IconArrowRight (3 variants)
  ✓ IconArrowRightFill (3 variants)
  ✓ IconPlus (3 variants)
  …

✓ Generated 423 icon components
```

## 新目标

设计目标的第一稿,把规格、API 构想和工作流实验统统搅进了同一张超大许愿清单:

- 把每个图标都按 12、16、24 像素重画一遍。
- 为每种图标尺寸引入专属的描边宽度。
- 定义一致的描边宽度、圆角半径和复现形。
- 删掉过时的图标和多余的变体。
- 让线性、填充和双色(duotone)感觉像一家人。
- 在 Figma 中用可复用的组件图层组合出相关图标。
- 确保图标图层尽可能保持非破坏性。(主要是避免提前轮廓化,保留更多布尔复合矢量。)
- 把这些图层暴露到 React 组件中,让前景和背景可以分别设色。
- 以及,或许干脆跳过本地构建脚本,直接从 Figma 导出 React 组件。

我最初构想的 React API 是每个概念家族一个组件,视觉风格、尺寸和状态都用 props 表达。我想看看,在 Figma 和 React 里用同一种方式构建图标是否成立。

```tsx
<IconGitStatus variant="duo" state="modified" size={16} />
<IconFile variant="fill" state="code" size={24} />
<IconBell variant="outline" state="unread" />
<IconComment variant="solid" state="check" />
```

对文件、评论、状态容器这类家族,这种 API 对我的吸引力极大。`IconFile` 作为父形状,文字、代码、锁、图片等字形作为可互换的图层。带时钟徽标的文件也许就写成 `<IconFile badge="clock" />`,而不是单独来一个 `IconFileBadgeClock`。

### 三种尺寸

事实证明,图标设计是自虐狂的事业。显然,我就是等不及要把同一个图标画上三种花样。虽然费时,但考虑到我们原有 1.5px 描边的数学特性——尤其是往更小或更大的尺寸缩放时——这确有必要。

| 尺寸 | 缩放后的描边 |
| --- | --- |
| 12×12 | 1.125px |
| 16×16 | 1.5px |
| 24×24 | 2.25px |

小数值不一定就是坏事,但缩放会影响视觉重量、间距、转角处理,以及小图形与其容器之间的关系。12px 图标往往需要更少的细节——线条更简、圆角更少、形状略作调整——而 24px 图标则可以有*更多*细节。

![12、16、24 像素的 Pierre 图标描边 token](https://pierre.computer/writing/on-drawing-icons/pierre-icons-stroke.png)

*三种尺寸对应不同的描边宽度,部分线条图标的 Fill 变体使用更重的描边。*

经过大量测试,**我最终把 12、16、24 的默认描边 token 定为 1px、1.25px 和 2px。**(大多数)线条类符号的填充变体会再加一档,到 1.25px、1.5px 和 2.5px。图标内部更细的细节则降一档描边(例如 24px 图标上用 1.5px 而不是 2px)。把这些值存成 Figma 变量后,评估系统时就能一次性改掉整个尺寸,而不必反复编辑几百个矢量。*不过,在我折腾各种数值的过程中,这种事还是干了太多回。*

![Pierre icons 24](https://pierre.computer/writing/on-drawing-icons/pierre-icons-details.png)

*较大的 24px 尺寸下新增细节的一些示例。*

按三种尺寸设计,也带来了一些有趣的加分项:在更大的 24px 上加入这些额外细节。虽然描边更重,我们仍能展示多得多的东西,让这些图标的更大实例受益。想想空状态、新手引导流程、营销站点等等。落到实处就是:信封可以有更多线条,建筑会多出几扇窗户和门之间的横梁,齿轮的齿更多(存心气 Jacob),锁也装上了钥匙孔。

## 在 Figma 中构建

一旦开始构建一个图标家族,很快你就会发现同一批部件在几十个相似图标里反复出现。比如 File 会衍生出 FilePlus、FileMinus、FileImage 等等。我可不想因为微调了 File 的基础形状,就不得不手动更新每一个图标。

管好所有这些部件,意味着先得在绘制和组织方式上发挥创造性,再进一步把创建和更新图标的工作流往更自动化的方向优化。

于是我踏上了一条"路径"(哈),在 Figma 里用一系列互相连接、各自带多种变体的组件来画这些新图标。这些组件包括我所说的图标图层(icon layers)、图标遮罩(icon masks)和基础形状(base shapes)。

![Figma 中 Pierre 图标组件库总览](https://pierre.computer/writing/on-drawing-icons/pierre-icons-figma.png)

*Figma 中 Pierre 图标家族背后的组件库。*

![用于组合超椭圆、圆形与加号图标的 Figma 图层与组件集](https://pierre.computer/writing/on-drawing-icons/pierre-shape-layers.png)

*基础形状与图标图层组合出跨尺寸、跨变体的相关图标。*

图标图层与遮罩充当可复用的组件集,供出现在其他图标内部的部件使用:

- 文件与文件夹内的字形,如文字、代码、图片、锁。
- 容器符号,如加号、减号、勾、叉。
- 斜线、未读圆点及其他叠加层。
- 遮罩形状,负责挖掉基础图标的一部分,让叠加层或徽标保持清晰可辨。

这些额外组件在某些方面让事情变复杂了,但最终解决了一个关键痛点:对加号徽标或文件夹形状做点小改动,原本最多要手动更新几十个图标。由于 Figma 支持非破坏性的布尔编组(union、subtract 等),调整像 `IconFile` 这样的共享组件形状,意味着其余 20 个图标自动更新。

![文件图标、图片图层及加号、减号、齿轮徽标的 Figma 组件集](https://pierre.computer/writing/on-drawing-icons/pierre-components.png)

*用于组合相关图标及其变体的几个组件集。*

在 16px 下,这些组件是这样组合起来的:

```text
IconFileImage · 16px
├─ Outline
│  └─ Union
│     ├─ IconFile · Outline
│     └─ IconLayerImage
├─ Fill
│  └─ Subtract
│     ├─ IconFile · Fill
│     └─ IconLayerImage
└─ Duo
   ├─ IconFile · Fill
   └─ IconLayerImage

IconLayerImage · 16px
└─ Outline
   ├─ Subtract
   │  ├─ Vector 621
   │  └─ IconFile
   └─ Ellipse 523
```

```text
IconFileBadgeGear · 16px
├─ Outline
│  └─ Union
│     ├─ Subtract
│     │  ├─ IconFile · Outline
│     │  └─ IconMaskGear · Mask
│     └─ IconMaskGear · Top
├─ Fill
│  ├─ Subtract
│  │  ├─ IconFile · Fill
│  │  └─ IconMaskGear · Mask
│  └─ IconMaskGear · Top
└─ Duo
   ├─ Subtract
   │  ├─ IconFile · Fill
   │  └─ IconMaskGear · Mask
   └─ IconMaskGear · Top

IconMaskGear · 16px
├─ Top
│  └─ Subtract
│     ├─ Vector
│     └─ Ellipse 535
└─ Mask
   └─ Ellipse 531
```

相关图标的收益滚雪球式增长——超椭圆、圆形、评论、文件、文件夹加起来,牵动另外 65 个组件,每个组件九种变体、三种尺寸,共计近 600 个独立图标。

现在,为了管理所有这些图标家族,我想要一种更省事的办法,把一个图标的整批变体换成另一个图标。这就意味着 vibe coding 几个专门伺候我自己的辅助插件。

### LAYER SWAP

Layer Swap 是我为这次重绘做的第一个插件。选中一个或多个图标组件集,选定某个嵌套的组件图层,然后到处替换它。插件会按属性匹配变体,所以 12px 的线性图形会被替换为替换目标的 12px 线性图形,而不是 Figma 默认认定的那个组件。

[▶ 观看视频:在 Figma 中替换图标图层](https://pierre.computer/writing/on-drawing-icons/pierre-icons-layer-swap.mp4)

举个例子,如果我已经有了含两个图层(`IconSquircle` 与 `IconLayerPlus`)的 `IconSquirclePlus`,我只想复制这个组件,把加号换成减号。照老办法,那意味着复制粘贴或替换实例,还得处理属性、尺寸对不上的问题。现在不用了。

它还能在所有变体上同时旋转、翻转某个嵌套图层。让箭头换个方向,只需一次操作,而不是六次或九次,而且变换以图层自身中心为基准。

### SHAPE LANGUAGE OVERLAY

早期我为新图标定义了一版整体的形状语言(shape language),但在设计过程中很少回头查看它。给所有东西挨个切换小红色叠加层太繁琐,我也不想在每个图标里再塞一个常驻的组件图层。

[▶ 观看视频:Shape Language Overlay 插件演示](https://pierre.computer/writing/on-drawing-icons/pierre-icons-shape-lang.mp4)

于是我 vibe coding 了一个 Shape Language Overlay 插件,用来注册本地的形状组件、按尺寸把它们与图标变体对应,并放进一个锁定的同级 frame。图标移动时叠加层可以随之刷新,清除时也不会改动将要导出的组件。

不过我没怎么用它,因为这些形状要求我通常都记在脑子里,而同级 frame 最后把我的工作区弄得比我想要的还乱。

### TAPER STROKE

我又绕进了一条更难走的"路径"问题:渐细描边(tapered strokes),主要集中在箭头图标上。三条等宽的描边交于一点时,涂出来的面积比任何一条单独的描边都多,所以即使路径在技术上完美无缺,交点看起来仍然偏重。

![箭头交汇处视觉收窄的四个阶段](https://pierre.computer/writing/on-drawing-icons/figma-plugin-taper-01.png)

这类视觉修正源自字体设计,但对图标同样有帮助。字体设计师早就习惯在 `M`、`W`、`V` 这类字母的笔画交汇处收细笔画。你以为到 2026 年早该告别这些了,但视网膜屏幕只是让边缘更平滑,并不会抹去交点处多出来的视觉质量。在我们图标的任何尺寸下,多条反锯齿描边仍会聚成一团。更糟的是,深色背景上的白色图标还会进一步晕开。

![同一支箭头在交汇处收窄到 1.5px](https://pierre.computer/writing/on-drawing-icons/figma-variable-width-02.png)

Figma 现在有了[原生的路径可变宽度工具](https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers#h_01JYM29VEN8ABWTDXJR529446R)(见上图),但它无法应用到这些箭头类合并矢量上,而且似乎也不能只作用于路径的单侧。这两个问题都让我们没法用它。

![Taper Stroke 插件在 Figma 中调整箭头](https://pierre.computer/writing/on-drawing-icons/figma-plugin-taper-02.png)

于是我又 vibe coding 了一个叫 **Taper Stroke** 的自定义插件,补上 Figma 在矢量上的这个缺口。它把路径网络拆成可编辑的原生描边,识别出主干与冠部,并且(相当关键的是)把它们朝交汇处收窄,同时保持外部轮廓不变。

插件最终完成得不错,效果也挺好,但我并没有百分之百的把握,不知道怎样把它纳入工作流最合适。归根结底我不想仓促行事,所以这次新发布的第一个 beta 不会采用渐细描边。我希望能在后续版本中加入。

### ICON PREVIEW GRID

在写这篇博客的过程中,我还意识到我需要几张图——一部分图标的子集,外加全部图标的网格视图和列表视图。于是我用了 Figma 新的 AI 工具生成了一个插件来做这些事,给这篇文章配图变得轻而易举。

全选图标,打开插件,配置一下,开跑。这里我分别生成了线性、填充、双色三套网格。

![Icon Preview Grid 插件与生成的图标网格](https://pierre.computer/writing/on-drawing-icons/figma-plugin-grid.png)

*Icon Preview Grid 插件与生成的图标网格。*

它还生成了全部图标的列表视图:

![紧凑列表形式的 Pierre beta 图标全目](https://pierre.computer/writing/on-drawing-icons/pierre-icons-all-list.png)

说实话,太酷了。

## 从 Figma 到 React?

Figma 里的组合方式逐渐成形时,我野心勃勃地想在 React 里做同样的事。我希望借助单个 Figma 插件,导出后无需任何额外的脚本或工具,就能从 Figma 直接得到 React。这个念头远早于这次图标重绘项目——当时我做了第一个 SVGO 导出器插件的原型。它为接下来的一切打下了很好的基础。

![React Icon Exporter 插件与 Figma 中的 Pierre 图标组件](https://pierre.computer/writing/on-drawing-icons/pierre-icons-figma-react-export.png)

*React Icon Exporter:启动插件,全选组件,即可看到 React 组件将如何生成。*

**于是有了 React Icon Exporter 插件。**它读取选中的组件集,识别组件内的变体,并把每个 Figma 属性转换成一个 React prop。它建立在原先的 SVGO 导出器插件之上,是那项工作的自然延伸。

- `Size=12/16/24` 变成 `size`
- `Type=Outline/Fill/Duo` 变成 `type`

空变体和只包含一个名为 `Placeholder` 的图层的变体会被跳过,这样模板组件集就能定义完整的矩阵,又不必假装每个图标都支持全部组合。

像 `IconFileCode` 这样的组件集,会产出一个将近 100 行、包含全部九个变体的组件:

```tsx
// Generated by the React Icon Exporter Figma plugin, do not edit manually.
import type { SVGAttributes } from 'react';
import { Colors, type IconProps } from '../types';

export interface IconFileCodeProps
  extends IconProps,
    Omit<SVGAttributes<SVGSVGElement>, 'color' | 'style' | 'className' | 'width' | 'height'> {
  /** @default "outline" */
  type?: "outline" | "fill" | "duo";
  /** @default 16 */
  size?: 12 | 16 | 24;
}

const variants = {
  "outline-12": {
    viewBox: "0 0 12 12",
    overflow: false,
    body: <path d="M7.37.01a2 2 0 0 1 1.216.576l1.828 1.828A2 2 0 0 1 11 3.828V10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2A2 2 0 0 1 2.796.01L3 0h4.172zM3 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H9a2 2 0 0 1-2-2V1zm1.646 3.646a.5.5 0 1 1 .708.708L3.707 7l1.647 1.646a.5.5 0 1 1-.708.708l-2-2a.5.5 0 0 1 0-.708zm2 0a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 1 1-.708-.708L8.293 7 6.646 5.354a.5.5 0 0 1 0-.708" className="union" fill="currentColor"/>,
  },
  "fill-12": {
    viewBox: "0 0 12 12",
    overflow: false,
    body: <path d="M7 1.5A2.5 2.5 0 0 0 9.5 4H11v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h4zM5.354 4.646a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 1 0 .708-.708L3.707 7l1.647-1.646a.5.5 0 0 0 0-.708m2 0a.5.5 0 1 0-.708.708L8.293 7 6.646 8.646a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708zM8 .182c.216.098.415.233.586.404l1.828 1.828a2 2 0 0 1 .404.586H9.5A1.5 1.5 0 0 1 8 1.5z" className="subtract" fill="currentColor"/>,
  },
  "duo-12": {
    viewBox: "0 0 12 12",
    overflow: true,
    body: <><path d="M7 1.5A2.5 2.5 0 0 0 9.5 4H11v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h4z" opacity="0.25" fill="currentColor" className="bg"/><path d="M8 .182c.216.098.415.233.586.404l1.828 1.828a2 2 0 0 1 .404.586H9.5A1.5 1.5 0 0 1 8 1.5z" opacity="1" fill="currentColor" className="fg"/><path d="M6.646 4.646a.5.5 0 0 1 .707 0l2 2a.5.5 0 0 1 0 .707l-2 2a.5.5 0 1 1-.707-.707L8.293 7 6.646 5.353a.5.5 0 0 1 0-.707M5.354 4.646a.5.5 0 0 0-.707 0l-2 2a.5.5 0 0 0 0 .707l2 2a.5.5 0 1 0 .707-.707L3.707 7l1.647-1.647a.5.5 0 0 0 0-.707" fill="currentColor" opacity="1" className="fg"/></>,
  },
  "outline-16": {
    viewBox: "0 0 16 16",
    overflow: false,
    body: <path d="M10.685.005a1 1 0 0 1 .608.288l3.414 3.414a1 1 0 0 1 .293.707V13a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h6.586zM4 1.25A1.75 1.75 0 0 0 2.25 3v10c0 .966.784 1.75 1.75 1.75h8A1.75 1.75 0 0 0 13.75 13V5H12a2 2 0 0 1-2-2V1.25zm2.308 4.808a.626.626 0 0 1 .884.884L5.135 9l2.057 2.058a.626.626 0 0 1-.884.884l-2.5-2.5a.626.626 0 0 1 0-.884zm2.5 0a.626.626 0 0 1 .884 0l2.5 2.5a.626.626 0 0 1 0 .884l-2.5 2.5a.626.626 0 0 1-.884-.884L10.865 9 8.808 6.942a.626.626 0 0 1 0-.884" className="union" fill="currentColor"/>,
  },
  "fill-16": {
    viewBox: "0 0 16 16",
    overflow: false,
    body: <path d="M9.995 2.38a2.625 2.625 0 0 0 2.625 2.625H15V13a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h5.995zM7.192 6.058a.626.626 0 0 0-.884 0l-2.5 2.5a.626.626 0 0 0 0 .884l2.5 2.5a.626.626 0 0 0 .884-.884L5.135 9l2.057-2.058a.626.626 0 0 0 0-.884m2.5 0a.626.626 0 0 0-.884.884L10.865 9l-2.057 2.058a.626.626 0 0 0 .884.884l2.5-2.5a.626.626 0 0 0 0-.884zM11.293.293l3.414 3.414q.022.023.043.048h-2.13c-.76 0-1.375-.616-1.375-1.375V.249z" className="subtract" fill="currentColor"/>,
  },
  "duo-16": {
    viewBox: "0 0 16 16",
    overflow: true,
    body: <><path d="M9.995 2.38a2.625 2.625 0 0 0 2.625 2.625H15V13a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h5.995z" opacity="0.25" fill="currentColor" className="bg"/><path d="m11.293.293 3.414 3.414q.022.023.043.048h-2.13c-.76 0-1.375-.616-1.375-1.375V.249z" opacity="1" fill="currentColor" className="fg"/><path d="M6.308 6.058a.626.626 0 0 1 .884.884L5.135 9l2.057 2.058a.626.626 0 0 1-.884.884l-2.5-2.5a.626.626 0 0 1 0-.884zM8.808 6.058a.626.626 0 0 1 .884 0l2.5 2.5a.626.626 0 0 1 0 .884l-2.5 2.5a.626.626 0 0 1-.884-.884L10.865 9 8.808 6.942a.626.626 0 0 1 0-.884" fill="currentColor" opacity="1" className="fg"/></>,
  },
  "outline-24": {
    viewBox: "0 0 24 24",
    overflow: false,
    body: <path d="M14.37.01a2 2 0 0 1 1.216.576l5.828 5.828A2 2 0 0 1 22 7.828V20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V4A4 4 0 0 1 5.794.005L6 0h8.172zM6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8h-3a3 3 0 0 1-3-3V2zm3.293 7.293a1 1 0 1 1 1.414 1.414L8.414 13l2.293 2.293a1 1 0 1 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414zm4 0a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 1 1-1.414-1.414L15.586 13l-2.293-2.293a1 1 0 0 1 0-1.414" className="union" fill="currentColor"/>,
  },
  "fill-24": {
    viewBox: "0 0 24 24",
    overflow: false,
    body: <path d="M14.25.003V5A2.75 2.75 0 0 0 17 7.75h4.996q.003.039.004.078V20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h8.172zm-3.543 9.29a1 1 0 0 0-1.414 0l-3 3a1 1 0 0 0 0 1.414l3 3a1 1 0 1 0 1.414-1.414L8.414 13l2.293-2.293a1 1 0 0 0 0-1.414m4 0a1 1 0 1 0-1.414 1.414L15.586 13l-2.293 2.293a1 1 0 1 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414zM21.25 6.25H17c-.69 0-1.25-.56-1.25-1.25V.75z" className="subtract" fill="currentColor"/>,
  },
  "duo-24": {
    viewBox: "0 0 24 24",
    overflow: true,
    body: <><path d="M14.25.003V5A2.75 2.75 0 0 0 17 7.75h4.996q.003.039.004.078V20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h8.172z" opacity="0.25" fill="currentColor" className="bg"/><path d="M21.25 6.25H17c-.69 0-1.25-.56-1.25-1.25V.75z" opacity="1" fill="currentColor" className="fg"/><path d="M9.293 9.293a1 1 0 1 1 1.414 1.414L8.414 13l2.293 2.293a1 1 0 1 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414zM13.293 9.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 1 1-1.414-1.414L15.586 13l-2.293-2.293a1 1 0 0 1 0-1.414" fill="currentColor" opacity="1" className="fg"/></>,
  },
};

export function IconFileCode({
  type = "outline",
  size = 16,
  color = "currentcolor",
  style,
  className,
  ...props
}: IconFileCodeProps) {
  const key = `${type}-${size}` as keyof typeof variants;
  const variant = variants[key];
  const height = size;
  const width = size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox={variant.viewBox}
      width={width}
      height={height}
      style={{
        ...style,
        color: Colors[color] ?? color,
        ...(variant.overflow ? { overflow: "visible" } : null),
      }}
      className={`pi${className != null ? ` ${className}` : ``}`}
      {...props}
    >
      {variant.body}
    </svg>
  );
}
```

这个导出器还做了相当多的几何处理:

- 在临时副本上把描边轮廓化、扁平化布尔图形。
- 把原始组件 frame 保留为 SVG 的 viewBox。
- 让超出该 frame 绘制的内容保持可见。
- 把 Figma 图层名转换成稳定的 CSS 类名。
- 为 SVG id 加命名空间,防止来自不同图标实例的 mask 相互冲突。
- 识别双色调图形中的半透明部分与不透明部分。
- 为缺失、空白、重复、可疑或错位的变体写一份报告。

插件大体上能跑通,但更复杂的图标会出问题。图层、遮罩与徽标的叠加,会让最终输出出现偏差。

### 导出带徽标的图标

*徽标?我们不需要什么臭徽标。*

![Figma 中 Pierre 文件、文件夹、评论、铃铛和眼睛徽标图标的组件集](https://pierre.computer/writing/on-drawing-icons/pierre-badged-icons.png)

*我们能否像在 Figma 里那样,把这些图标当作"图层"在 React 里组合?*

尝试从 Figma 直接导出到 React 的这趟冒险里,有一环是搞清楚我能否把这套组合 API 也翻译过去。手上已有出色的 SVGO 导出插件打底,于是我一开始就试着研究如何在 React 里组合这些图标。

前面说过,带徽标的图标在 Figma 里由三部分组成:基础图标、挖空遮罩(knockout mask)和徽标本身。理想情况下,最终应该允许像 `<IconFileBadgeClock />` 和 `<IconFolderBadgeGearFill />` 这样调用图标。

```tsx
<IconFile badge="clock" />
<IconFolder badge="gear" type="fill" />
```

这样一来,组件内部可以有基础图层、原生 SVG mask,以及叠加在其上的徽标图层。单独的图标组件也依然存在。源 React 组件大概长这样:

```tsx
const badges: Record<
  NonNullable<IconFileProps["badge"]>,
  Partial<Record<keyof typeof variants, (uid: string) => ReactElement>>
> = {
  plus: {
    "fill-16": (uid) => (
      <>
        <mask id={`${uid}-badge`}>
          <rect x="-16" y="-16" width="48" height="48" fill="#fff" />
          <g color="#000">{/* knockout mask artwork */}</g>
        </mask>
        {/* plus badge artwork */}
      </>
    ),
  },
};

export function IconFile({
  badge,
  type = "outline",
  size = 16,
  ...props
}: IconFileProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const key = `${type}-${size}` as keyof typeof variants;
  const variant = variants[key];
  const badged = badge ? badges[badge]?.[key] : undefined;

  return (
    <svg
      viewBox={variant.viewBox}
      width={size}
      height={size}
      style={badged ? { overflow: "visible" } : undefined}
      {...props}
    >
      {badged ? (
        <>
          <g mask={`url(#${uid}-badge)`}>{variant.body(uid)}</g>
          {badged(uid)}
        </>
      ) : (
        variant.body(uid)
      )}
    </svg>
  );
}
```

这些在我脑子里听起来都特别好——说实话,起初我兴奋极了——可一旦动手摆弄,事情很快就散架了。

![对照线性、填充、双色与三种尺寸的文件徽标图标的几何检查](https://pierre.computer/writing/on-drawing-icons/preview-geometry.png)

首先,Figma 的几何特性让运行时组合变得不可靠。扁平化布尔图形可能让实例偏移一个像素,而超出 16px frame 的绘制内容可能产生更大的 viewBox,在 `size={16}` 时反而缩小。修复它需要固定的 viewBox、原始尺寸的图形,以及可见的溢出。

其次,组合的成本也更高。带一个徽标的文件图标 gzip 后是 2.81KB,单独导出只要 1.40KB;文件夹是 2.88KB 对 1.36KB。乘上数百个图标,这个差距相当可观,最终让这条路走不通。组合大概率还会影响 tree-shaking,不过这一点我没有验证。

那么,这趟短暂但激动人心的弯路让我们学到了什么?

- 在每个单独的 `<svg>` 元素上保留固定的 viewBox,并允许可见溢出。
- 确保最终图形在导出时能被正确扁平化,方法是在源头保留布尔图形(例如,不要提前扁平化 union 或 subtract)。
- 把组合留在 Figma——它对绘制有帮助——而不要求运行时 API 去镜像它。

总而言之,我们回到了单独图标的路线,并确保导出的 SVG 仍然是 React 端的事实来源。

## 新架构

### SVG 作为契约

导出转 React 管线的下一轮迭代,其实又回到了起点:Figma 拥有视觉事实,仓库负责所有代码处理和生成,SVG 成为两者之间的交换管线。

于是我让 LLM 把 SVGO Exporter 插件——它最初只是用来导出一批单个图标的——升级为展开所选组件的每一个绘制变体,并写出一棵规范化的 SVG 树:

```text
svg/
  IconComment/
    outline-12px.svg
    outline-16px.svg
    outline-24px.svg
    fill-12px.svg
    fill-16px.svg
    fill-24px.svg
  manifest.json
  REPORT.md
```

manifest 记录组件名、Figma 属性维度、默认值、变体属性和文件路径。空白或占位变体会被省略。SVG 里已经包含扁平化的图形、归一化的上色、固定的组件 viewBox、必要时的可见溢出、带命名空间的 id 和稳定的图层类名。这样一来,我们就不必在本地再跑一遍 SVGO。

这是 `IconArrowRight` 的条目,只截取六种变体中的两种。Figma 的 `Type` 和 `Size` 属性变成 `type` 和 `size` props,每个变体都指向 SVG 树中的一个文件:

```json
{
  "name": "IconArrowRight",
  "axes": [
    {
      "axis": "Type",
      "prop": "type",
      "numeric": false,
      "values": [
        { "figma": "Outline", "prop": "outline" },
        { "figma": "Fill", "prop": "fill" }
      ],
      "defaultValue": "outline"
    },
    {
      "axis": "Size",
      "prop": "size",
      "numeric": true,
      "values": [
        { "figma": "12px", "prop": "12" },
        { "figma": "16px", "prop": "16" },
        { "figma": "24px", "prop": "24" }
      ],
      "defaultValue": "16"
    }
  ],
  "variants": [
    {
      "key": "outline-16",
      "file": "outline-16px.svg",
      "properties": { "Type": "Outline", "Size": "16px" }
    },
    {
      "key": "fill-16",
      "file": "fill-16px.svg",
      "properties": { "Type": "Fill", "Size": "16px" }
    }
  ]
}
```

导出后,我们运行 `npm run icons` 来生成:

- 由 SVG 和 manifest 生成的 React 组件
- 每个图标变体一个 SVG sprite symbol
- 包的导出索引
- 本地 HTML 预览

它远没有我最初希望的那样神奇、那样自动化,但更稳定也更有效。同一批规范化 SVG 和 manifest 文件,随时都可以再用于生成 sprite、更多预览,以及未来的其他目标。

### 当前的 React API

现在的 API 抛弃了最初用 `type` prop 的想法。取而代之,图标的风格变体是各自独立的导出:

```tsx
import {
  IconFileBadgeGear,
  IconFileBadgeGearDuo,
  IconFileBadgeGearFill,
} from '@pierre/icons';

<IconFileBadgeGear size={12} />
<IconFileBadgeGearFill size={16} />
<IconFileBadgeGearDuo size={24} />
```

每个组件的 `size` prop 选用的是真正按 12、16 或 24 绘制的版本,而不是把单个 SVG 缩放到三种尺寸。没有某个尺寸绘制的图标,只会暴露它实际包含的尺寸,这样生成的类型可以精确到 `12 | 16`,足够严谨。

虽然我们现在很少需要大于 24px 的尺寸,但将来若要用到,这里还得继续演进。我想我们会再加一个 prop 来扩展可用的尺寸选项,同时允许你选择按哪个源尺寸来缩放。例如,`size={48}` 默认缩放 24px 的绘制版,而加一个 `sourceSize={16}` prop 则可以选用 16px 的绘制版,观感更纤细。

生成的图标组件还会:

- 接受标准 SVG 属性,如 `aria-*`、`data-*`、事件处理器和 `role`。
- 默认使用 `currentColor`,同时保留 Pierre 的具名颜色映射。
- 在 React 组件和 sprite symbol 中都保留手写的 [`overflow="visible"`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/overflow)。
- 对管线能安全分类的图形,使用确定性的 `.bg` 和 `.fg` 类名。
- 保留 SVG 里的 opacity,而不是在渲染时另行发明。
- 在仍需要 mask 的地方,把 mask 及其引用的 id 限定在单个图标实例内。

`.bg` 和 `.fg` 这对钩子始于双色图标:背景形状半透明,前景不透明。后来我们把同样的结构性钩子应用到了确认安全的填充和线性图标变体上,比如文件与文件夹徽标、分层的图标装饰。未知或含糊的 SVG 保持单色。如此一来,几乎任何图标都能用上单一填充之外的自定义颜色。

> 原文此处是一个交互式演示:可在 Outline、Fill、Duo 三种变体间切换,对比同一图标在 `currentColor` 单色与 `.bg` + `.fg` 分层上色下的效果,并提供了成对的主题色与交换颜色的按钮。

默认情况下,两个图层都继承 `currentColor`。由于生成的路径自带类名,CSS 可以直接命中它们:

```css
.bg {
  color: #009fff;
}

.fg {
  color: #0dbe4e;
}
```

一个包装组件可以限定这些规则的作用域,把颜色暴露成 props 或自定义属性,并把同一套 API 扩展到其他图标。

## 预览即 QA

最初,我在本地有一个简单的预览站点,渲染每个图标和它们的文件名。它没有被提交进仓库,除了偶尔发几张新图标截图,也没跟人分享过。但在整个过程中,这个预览很快演变成了帮我校验 API 决策、抓渲染问题、看哪里需要打磨的工具。现在它更像一个小型定制画廊应用。

![展示所有尺寸与变体的图标预览](https://pierre.computer/writing/on-drawing-icons/preview-all.png)

我还做了另一个预览版,采用更常规的目录布局:分类、浏览区,和一个常驻的检查器。

它可以:

- 在已发布的图标集与进行中的重绘之间切换。
- 按组件名搜索。
- 按线性、填充或双色筛选新图标集。
- 渲染单一尺寸,或同时展示 12、16、24。
- 从画廊切换到导航列表,同样的图标会挨着真实文字标签、以真实间距排列。

列表视图很重要,因为数学上居中的图标,放在 13px 文字旁边仍可能显得偏高、偏重或细节过多。孤立的图标网格会掩盖这些问题。

点击图标会打开浏览器原生的 popover。左侧是放大的实时渲染,以及可用样式的控制项。如果 SVG 已经分好背景层与前景层,一个 Multi 开关会给它们分配一对 Pierre 主题色,让层次分离的问题立刻显形。

这一栏的底部展示可用的 React 变体、用法片段和生成的 props。右侧通过 `@pierre/diffs` 的 File 组件渲染实际生成的 React 或规范化 SVG 源码,带语法高亮、自动换行,并匹配明暗主题。

![开启 Duo 与 Multi 的 IconFolderBadgePlus 源码弹窗](https://pierre.computer/writing/on-drawing-icons/preview-popover.png)

有意为之,它是一个生成的静态 HTML 文件,可以直接在 Chrome 里打开 `dist/index.html`:反馈回路很短,也不需要把整个产品跑起来。

预览已经抓住过好几类问题:

- 组件 frame 改变了实际生效的 viewBox。
- 图形因为丢失 overflow 而被裁切。
- 缺了某个尺寸或样式。
- 双色的透明度或图层归属不对。
- 生成的组件名与它的 SVG 家族不一致。
- 源码渲染正常,但过于复杂。
- 单独看没问题、放进类产品的行里却不对劲的图标。

不过,预览并不是唯一的检查。每次导出都会在生成器运行之前先写一份报告。每个条目都会写明图标、变体和 Figma 节点 ID,所以修复工作从在 Figma 里搜索开始,而不是在生成代码里:

```markdown
# SVG export report

- **IconGlobeLines** (`5594:52518`): has no Fill artwork; empty variants were
  not exported
- **IconSortUp / Fill, 16px** (`5987:165438`): could not export: Failed to
  export node. This node may not have any visible layers.
- **IconArrowUpRight / Outline, 24px** (`6010:166765`): could not export: in
  flatten: Failed to apply flatten operation
- **IconSquircleEllipsis** (`5661:51400`): IconSquircleEllipsis already
  exported a fill-12 variant; this duplicate was skipped
```

报告与预览相辅相成:导出报告抓的是可度量的结构性约束,浏览器抓的是仍需亲眼所见的问题。

## 新的闭环

```text
DESIGN SOURCE(设计源)
├─ Figma
│   Component sets · Shared layers · Masks + badges
│   12 / 16 / 24px
└─► SVGO Exporter

CANONICAL CONTRACT(规范契约)
├─ svg/          —— 每个绘制变体一个文件
├─ manifest.json —— 维度、默认值与路径
└─ REPORT.md     —— 缺失与重复变体、对齐与其他注意事项
        │
        ▼
   npm run icons

GENERATED TARGETS(生成目标)
├─ React          —— 带精确尺寸类型的 TSX 组件
├─ SVG sprite     —— 每个变体一个 symbol
└─ Static preview —— 画廊、目录与源码视图(dist/index.html)

VALIDATION(验证)
Structural checks(报告与生成源码)→ Fault domain(绘制、导出或构建)→ Visual review(隔离与类产品环境)
┄┄ 虚线反馈:在责任层修复(Measurable——可度量 ⇢ Visible——可见)
```

*Pierre 图标完整的设计与开发管线。*

现在的工作流是这样的:

1. 在 Figma 中绘制 12、16、24 的变体。
2. 使用可复用图层和专门的小插件,保持各图标家族整齐一致。
3. 用 SVGO Exporter 导出规范化的 SVG 变体和 `manifest.json`。
4. 检查 `REPORT.md`,留意缺失的图形、重复项、对齐问题与其他注意事项。
5. 替换 `@pierre/icons` 中的 SVG 树并运行 `npm run icons`。
6. 检查生成的 React、sprite 和预览产物。
7. 既在隔离环境下、也在类产品列表中测试图标。
8. 在正确的层级修复问题:绘制、导出约束、生成器,或预览。

最后一点很重要。当基础文件图标发生偏移时,答案不是在 React 组件里用 CSS 微调;当多色双色图形需要稳定的钩子时,答案也不是手动重命名几百个 Figma 图层。管线应该保存设计意图,只在能确定性完成的地方叠加代码复杂度。

## 经验教训

呼——这一路,连同这篇博文,都够折腾的。可以说,我们最终回到了离起点很近的地方,只是方法精细了许多,几乎没有牺牲什么。最终架构甚至比任何一次原型弯路所暗示的都更简单,但它恰恰是那些工作换来的。

- 直接从 Figma 到 React 的导出证明了组件属性可以变成精确的 TypeScript API,乍看之下惊艳无比。不过,它并非没有问题。
- 运行时徽标组合证明了遮罩与图层可以保持语义完整,随后又表明单个扁平化的图标更契合我们的用法和包体积。
- 调试一像素偏移的经历,把"固定 viewBox + 可见溢出"确立为不容妥协的硬约束。
- 在双色图标上的多色实验产出了 `.bg` 与 `.fg` 钩子,可与所有变体组合使用。
- 对着实时截图和生成源码做提示(prompting),让预览从一份文档变成真正可用的测试面,既测 API 也测视觉问题。

如今,每个 Pierre 图标都有一条从设计到代码的完整留痕,包括层层调试与 QA 检查、更强大的功能,以及每个图标内部可定制得多的结构。虽然一开始设想的那些有趣的事没有全部做成,我对结果仍无比满意。接下来,该设计下一批图标了。

你的图标工作流有什么有趣之处?我很想听听。带上几句说明,[到 X/Twitter 上喊我吧](https://x.com/mdo)。

&lt;3

原文：https://pierre.computer/writing/on-drawing-icons

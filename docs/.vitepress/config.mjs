import { defineConfig } from "vitepress";

const githubPagesBase = "/mgfx-docs-site/";
const base = process.env.GITHUB_PAGES === "true" ? githubPagesBase : "/";

const luxLanguage = {
  name: "lux",
  displayName: "Lux",
  scopeName: "source.lux",
  aliases: ["luxc"],
  patterns: [
    { include: "#comments" },
    { include: "#strings" },
    { include: "#declarations" },
    { include: "#keywords" },
    { include: "#constants" },
    { include: "#numbers" },
    { include: "#types" },
    { include: "#operators" },
  ],
  repository: {
    comments: {
      patterns: [
        {
          name: "comment.block.lux",
          begin: "--\\[\\[",
          end: "\\]\\]",
        },
        {
          name: "comment.line.double-dash.lux",
          match: "--.*$",
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: "string.quoted.double.lux",
          begin: "\"",
          end: "\"",
          patterns: [{ name: "constant.character.escape.lux", match: "\\\\." }],
        },
        {
          name: "string.quoted.single.lux",
          begin: "'",
          end: "'",
          patterns: [{ name: "constant.character.escape.lux", match: "\\\\." }],
        },
        {
          name: "string.quoted.template.lux",
          begin: "`",
          end: "`",
          patterns: [
            { name: "constant.character.escape.lux", match: "\\\\." },
            {
              name: "meta.interpolation.lux",
              begin: "\\$\\{",
              end: "\\}",
              patterns: [
                { include: "#strings" },
                { include: "#keywords" },
                { include: "#constants" },
                { include: "#numbers" },
                { include: "#operators" },
              ],
            },
          ],
        },
      ],
    },
    declarations: {
      patterns: [
        {
          name: "meta.function.declaration.lux",
          match:
            "\\b(export\\s+)?(shared\\s+|client\\s+|server\\s+)?(macro\\s+|host\\s+expr\\s+)?(fn)\\s+([A-Za-z_][A-Za-z0-9_:.]*)",
          captures: {
            1: { name: "keyword.control.import.lux" },
            2: { name: "storage.modifier.realm.lux" },
            3: { name: "storage.modifier.phase.lux" },
            4: { name: "keyword.declaration.function.lux" },
            5: { name: "entity.name.function.lux" },
          },
        },
        {
          name: "meta.import.lux",
          match:
            "\\b(import|export|extern|public|all|macro|host|package|from|as)\\b",
          captures: {
            1: { name: "keyword.control.import.lux" },
          },
        },
        {
          name: "meta.enum.declaration.lux",
          match:
            "\\b(export\\s+)?(runtime\\s+)?(enum)\\s+([A-Za-z_][A-Za-z0-9_]*)",
          captures: {
            1: { name: "keyword.control.import.lux" },
            2: { name: "storage.modifier.phase.lux" },
            3: { name: "keyword.declaration.enum.lux" },
            4: { name: "entity.name.type.enum.lux" },
          },
        },
        {
          name: "meta.part.order.lux",
          match: "\\b(part)\\s+(order|before|after)\\b",
          captures: {
            1: { name: "keyword.control.module.lux" },
            2: { name: "keyword.control.module.lux" },
          },
        },
      ],
    },
    keywords: {
      patterns: [
        {
          name: "keyword.control.lux",
          match:
            "\\b(match|if|then|else|for|while|repeat|until|do|return|break|continueif|breakif|stopif|stopifn)\\b",
        },
        {
          name: "storage.modifier.lux",
          match:
            "\\b(local|const|client|server|shared|runtime|repr|number|string|table|existing)\\b",
        },
        {
          name: "support.constant.gmod.realm.lux",
          match: "\\b(SERVER|CLIENT)\\b",
        },
      ],
    },
    constants: {
      patterns: [
        {
          name: "constant.language.lux",
          match: "\\b(nil|true|false|_)\\b",
        },
      ],
    },
    numbers: {
      patterns: [
        {
          name: "constant.numeric.lux",
          match: "\\b(?:0x[0-9A-Fa-f]+|\\d+(?:\\.\\d+)?)\\b",
        },
      ],
    },
    types: {
      patterns: [
        {
          name: "support.type.lux",
          match: "\\b[A-Z][A-Za-z0-9_]*\\b",
        },
      ],
    },
    operators: {
      patterns: [
        {
          name: "keyword.operator.lux",
          match: "=>|->|\\|>|\\?\\?|\\?[:.\\[]|\\.\\.|[+\\-*/%#=<>~|&!]+",
        },
        {
          name: "punctuation.separator.lux",
          match: "[{}()\\[\\],;:]",
        },
      ],
    },
  },
};

const headingRegex = /<h([1-6])[^>]*>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi;
const headingContentRegex = /(.*?)<a.*? href="#(.*?)".*?>.*?<\/a>/i;
const hiddenSearchSections = new Set([
  "Scope",
  "This Page",
  "Function Reference",
  "Reading Order",
  "Groups",
  "适用边界",
  "本页 API",
  "函数参考",
  "阅读顺序",
  "分组说明",
]);

function clearHtmlTags(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSearchSections(_file, html) {
  const matches = [];
  for (const match of html.matchAll(headingRegex)) {
    const parsed = headingContentRegex.exec(match[2]);
    const title = clearHtmlTags(parsed?.[1] || "");
    const anchor = parsed?.[2] || "";
    if (!title) continue;
    matches.push({
      level: Number(match[1]),
      title,
      anchor,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  const sections = [];
  let pageTitle = "";
  let current = null;

  function flush() {
    if (!current || current.skip) return;
    const text = clearHtmlTags(current.text);
    if (!text && current.titles.length <= 1) return;
    sections.push({
      anchor: current.anchor,
      titles: current.titles,
      text,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i];
    const next = matches[i + 1];
    const content = html.slice(heading.end, next ? next.start : html.length);

    if (heading.level === 1) {
      flush();
      pageTitle = heading.title;
      current = {
        anchor: heading.anchor,
        titles: [heading.title],
        text: content,
        skip: false,
      };
      continue;
    }

    if (heading.level === 2) {
      flush();
      current = {
        anchor: heading.anchor,
        titles: pageTitle ? [pageTitle, heading.title] : [heading.title],
        text: content,
        skip: hiddenSearchSections.has(heading.title),
      };
      continue;
    }

    if (current && !current.skip) {
      current.text += ` ${heading.title} ${content}`;
    }
  }

  flush();
  return sections;
}

const englishNav = [
  { text: "Use", link: "/USAGE" },
  { text: "API", link: "/API" },
  { text: "Reference", link: "/api-reference/" },
  { text: "Performance", link: "/PERFORMANCE" },
  { text: "Shaders", link: "/SHADERS" },
];

const chineseNav = [
  { text: "使用", link: "/zh/USAGE" },
  { text: "API", link: "/zh/API" },
  { text: "详细参考", link: "/zh/api-reference/" },
  { text: "性能", link: "/zh/PERFORMANCE" },
  { text: "Shader", link: "/zh/SHADERS" },
];

const englishSidebar = [
  {
    text: "Use MGFX",
    items: [
      { text: "Overview", link: "/" },
      { text: "Use from Lux", link: "/USAGE" },
      { text: "API Overview", link: "/API" },
      {
        text: "Detailed API",
        collapsed: false,
        items: [
          { text: "Family Index", link: "/api-reference/" },
          { text: "Frame Scope and Debugging", link: "/api-reference/frame" },
          { text: "Primitives", link: "/api-reference/primitives" },
          { text: "Images and Masks", link: "/api-reference/images" },
          { text: "Widgets", link: "/api-reference/widgets" },
          { text: "Text API", link: "/api-reference/text-api" },
          { text: "Paint, Patterns, Transforms, and Capabilities", link: "/api-reference/paint" },
        ],
      },
      { text: "Text Rendering", link: "/TEXT" },
      { text: "Performance", link: "/PERFORMANCE" },
    ],
  },
  {
    text: "Maintenance",
    items: [
      { text: "Lux Package Architecture", link: "/ARCHITECTURE" },
      { text: "Shader Build and Packaging", link: "/SHADERS" },
      { text: "Documentation Site", link: "/DOCS_SITE" },
    ],
  },
  {
    text: "History",
    collapsed: true,
    items: [
      { text: "Removed Shape Batching Design", link: "/BATCHING" },
      { text: "Removed Batch Coverage", link: "/BATCH_COVERAGE" },
    ],
  },
];

const chineseSidebar = [
  {
    text: "使用文档",
    items: [
      { text: "总览", link: "/zh/" },
      { text: "在 Lux 中使用", link: "/zh/USAGE" },
      { text: "API 总览", link: "/zh/API" },
      {
        text: "详细 API",
        collapsed: false,
        items: [
          { text: "分组入口", link: "/zh/api-reference/" },
          { text: "帧作用域与调试", link: "/zh/api-reference/frame" },
          { text: "基础图元", link: "/zh/api-reference/primitives" },
          { text: "图像与遮罩", link: "/zh/api-reference/images" },
          { text: "组件图元", link: "/zh/api-reference/widgets" },
          { text: "文本 API", link: "/zh/api-reference/text-api" },
          { text: "绘制、图案、变换与能力", link: "/zh/api-reference/paint" },
        ],
      },
      { text: "文字渲染", link: "/zh/TEXT" },
      { text: "性能", link: "/zh/PERFORMANCE" },
    ],
  },
  {
    text: "维护文档",
    items: [
      { text: "Lux package 架构", link: "/zh/ARCHITECTURE" },
      { text: "Shader 与打包", link: "/zh/SHADERS" },
      { text: "文档站维护", link: "/zh/DOCS_SITE" },
    ],
  },
  {
    text: "历史记录",
    collapsed: true,
    items: [
      { text: "已移除的批处理设计", link: "/zh/BATCHING" },
      { text: "已移除的批处理覆盖面", link: "/zh/BATCH_COVERAGE" },
    ],
  },
];

export default defineConfig({
  base,
  title: "MGFX",
  description: "MGFX documentation for Lux and Garry's Mod",
  lang: "en-US",
  cleanUrls: true,
  outDir: "../site_build",
  lastUpdated: true,
  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
    languages: [luxLanguage],
  },
  ignoreDeadLinks: [
    /^https?:\/\//,
  ],
  head: [
    ["meta", { name: "theme-color", content: "#ffffff" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
  ],
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "MGFX",
      description: "MGFX documentation for Lux and Garry's Mod",
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      title: "MGFX",
      description: "MGFX 中文文档",
      themeConfig: {
        nav: chineseNav,
        sidebar: chineseSidebar,
        outline: {
          level: [2, 3],
          label: "本页目录",
        },
        docFooter: {
          prev: "上一页",
          next: "下一页",
        },
        lastUpdated: {
          text: "最后更新",
          formatOptions: {
            dateStyle: "medium",
            timeStyle: "short",
          },
        },
      },
    },
  },
  themeConfig: {
    siteTitle: "MGFX",
    search: {
      provider: "local",
      options: {
        detailedView: false,
        disableQueryPersistence: true,
        miniSearch: {
          searchOptions: {
            prefix: true,
            fuzzy: 0.15,
            boost: {
              title: 8,
              titles: 4,
              text: 1,
            },
          },
          _splitIntoSections: splitSearchSections,
        },
      },
    },
    nav: englishNav,
    sidebar: englishSidebar,
    outline: {
      level: [2, 3],
      label: "On This Page",
    },
    docFooter: {
      prev: "Previous",
      next: "Next",
    },
    lastUpdated: {
      text: "Last updated",
      formatOptions: {
        dateStyle: "medium",
        timeStyle: "short",
      },
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/TimeWatcher/mgfx-docs-site" },
      { icon: "github", link: "https://github.com/TimeWatcher/lux" },
    ],
  },
  vite: {
    build: {
      emptyOutDir: true,
    },
  },
});

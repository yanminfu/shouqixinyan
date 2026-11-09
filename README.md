# 手启心言 · 面向乡镇学校的具身化创意表达课程实施智能体

华中师范大学第二届教育智能体设计大赛参赛作品（教学赋能主题）——文学院「文欣杯」项目《以手启思，以身达意》的实践衍生品。

帮助缺乏专业美育师资的乡镇托管班教师和支教志愿者，在材料、课时与场地受限的条件下，把一节普通手工活动转化为具有**身体参与、材料互动、语言生成、持续迭代**的创意表达课程。

## 快速开始

纯静态站点，**无需构建、无需后端**，任何静态托管（kimi.link / GitHub Pages / 学校服务器）上传即可运行。

本地预览（无 Node 环境时）：

```powershell
powershell -ExecutionPolicy Bypass -File server/dev-server.ps1
# 打开 http://127.0.0.1:8123
```

## 页面结构

| 页面 | 说明 |
|---|---|
| `index.html` | 项目首页：理念（身体语言编码）、四阶模式、三大功能、三维框架、三地实践、时间线、团队 |
| `agent.html` | ★ 智能体页：Kimi/Claude 式中央对话——欢迎说明卡 + 建议问题 + 流式对话 + 会话历史 + 作品照片上传 |
| `works.html` | 学生作品数据库：地点/课型筛选、矩阵编码四维条形图、儿童自述 |
| `lessons.html` | 四阶模式教案库（智能体 few-shot 知识底座） |
| `tools.html` | 研究工具库（观察量表/编码规程/TTCT/问卷/访谈） |
| `refs.html` | 参考文献库（理论可溯源） |

## 智能体技术架构

- **模型**：OpenAI 兼容接口（默认 DeepSeek，浏览器端流式 SSE）；接口参数内置在 `agent.js` 的 `DEFAULT_CFG`，页面对外不可见（评审/教师视角零配置）；如需更换 Key 直接改该常量即可
- **大脑**：`assets/js/agent.js` 内置完整系统提示词（角色/理论根基/低资源原则/表达支架/课后迭代/边界伦理，源自申报书与公开材料）+ 项目知识库上下文（作品/教案/工具自动同步自 `data.js`）
- **三大功能**：课前适配（支持表单引导）、课中表达支架、课后三维诊断，通过模式 chips 与提示词结构控制输出格式
- **降级保障**：模型接口不可达时自动切换内置规则引擎（`Offline`），仍可演示三大功能的结构化输出
- **多模态**：支持上传学生作品照片（自动压缩），接口支持 vision 时随消息发送做 OCR/图像理解；纯文本接口自动降级
- **会话**：localStorage 持久化 30 组对话，左侧栏可切换/删除/新建

## 文件地图

```
assets/css/style.css   设计系统（暖纸底/黛青/赭石，圆角有机形态）
assets/js/data.js      项目数据库：作品/教案/工具/文献/四阶/三维/材料替代 KB
assets/js/md.js        轻量 Markdown 渲染器（表格/引用/列表，防注入）
assets/js/main.js      图标库/侧栏/页脚/滚动动画/数据页渲染器
assets/js/agent.js     智能体引擎：配置/提示词/流式调用/离线引擎/会话/附件
server/server.js       可选 Express 后端（模型代理 + 知识库 + 会话存档），见 server/README.md
server/dev-server.ps1  本地预览用静态服务器（PowerShell，无需安装）
```

## 后续迭代（对照分工文档）

- 管乾宇《四阶课程模式规则说明》《三维课堂观察指标》→ 更新 `agent.js` 中 `SYS_PROMPT`
- 高琳蕊/许睿涵结构化课例 → 追加到 `data.js` 的 `DB.lessons` / `DB.works`，知识库自动同步
- 需要服务端知识库/隐藏 Key → 部署 `server/`，前端 `callLLM` 改指 `/api/chat`

## 发布

**kimi.link（国内访问快，评审推荐）**：

```bash
# 打包（zip 根目录直接是 index.html）
powershell Compress-Archive -Path publish\* -DestinationPath site-bundle.zip -Force
# 发布到既有站点（ID 见项目群公告/交接文档；会覆盖线上版本，可用 rollback 回滚）
~/.kimi-work/bin/kimix.exe website publish <网站ID> static site-bundle.zip --wait
```

**GitHub Pages**：推送本仓库后在 Settings → Pages 选择 `main` 分支根目录即可（纯静态无需构建）。

---

项目团队：严泯福 · 管乾宇 · 高琳蕊 · 许睿涵 · 蔡明涵 · 王路洋 ｜ 指导老师：江雪 ｜ 华中师范大学文学院

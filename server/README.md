# 手启心言 · 可选后端

静态站点（本仓库根目录的 html/js/css）**本身就是完整可运行的**，浏览器直连 OpenAI 兼容模型接口，无需本目录即可部署到 GitHub Pages / kimi.link。

本目录是「有服务器时的增强形态」，对应分工文档中“网站后端”的部分：

| 能力 | 说明 |
|---|---|
| `POST /api/chat` | 模型代理转发（流式 SSE）。Key 留在服务端，浏览器零暴露；可接学校内网模型 |
| `GET /api/kb` `GET /api/kb/:file` | 知识库挂载点：把结构化教案/规则文档放进 `kb/` 目录即可被读取，后续可扩展检索 |
| `GET/POST /api/sessions` | 会话服务端存档（跨设备同步用） |

## 启动

```bash
cd server
npm install            # 仅 express 一个依赖
set LLM_API_KEY=sk-你的key && set LLM_BASE_URL=https://api.deepseek.com/v1 && set LLM_MODEL=deepseek-chat && node server.js
# 打开 http://localhost:8080
```

## 与前端对接

前端 `assets/js/agent.js` 目前直连模型接口。切换到本后端只需把 `callLLM` 中的 fetch 地址改为 `/api/chat`（body 与消息格式完全一致），并移除浏览器端 Authorization 头。届时：

- API Key 不再随网页公开
- 可在 `kb/` 放入管乾宇的《四阶课程模式规则说明》《三维课堂观察指标》与高琳蕊/许睿涵的结构化课例，作为服务端知识库
- 学校评审若要求接入校内平台（HiAgent），可用本服务做适配层

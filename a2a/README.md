# 手启心言 · A2A / SSE 服务

比赛系统的「A2A 服务」只让填一个 **SSE URL**，填完它自己会去请求这个地址、读事件流做解析。静态站做不到这件事（只能发文件、不能保持长连接），所以这里放一个薄服务：它复用站点同一份提示词和知识库，把模型回答以 SSE 推回去。

站点本身不需要改动，这个服务是并列部署的。

## 一个地址，三种回包格式

平台解析规则未知，所以同一个端点支持三种格式，靠路径或参数切换：

| 地址 | 回包 | 适用 |
|---|---|---|
| `/sse` | `data: 文本增量` | 最宽容，**先试这个** |
| `/sse/openai` | OpenAI chunk：`data: {"choices":[{"delta":{"content":"…"}}]}`，以 `data: [DONE]` 收尾 | 平台按 OpenAI 兼容解析时 |
| `/sse/a2a` | A2A 0.3 JSON-RPC 事件（`task` → `artifact-update` → `completed`） | 平台按 A2A 规范解析时 |

也可以写成 `?fmt=openai`。**平台给你的 URL 是固定的，所以格式要在一开始就定好**——如果填上去之后解析不出来，换一个路径重新填即可，不用改代码。

## 平台怎么把问题传进来

服务会把下面这些位置都找一遍，命中即用：

- 查询参数：`?q=` / `?query=` / `?message=` / `?prompt=` / `?input=` / `?text=` / `?content=`
- POST JSON：`{"q":"…"}`、`{"message":{"parts":[{"text":"…"}]}}`（A2A）、`{"messages":[{"role":"user","content":"…"}]}`（OpenAI）

什么都不带时（平台很可能先空探一次），返回一条自我介绍流：`event: metadata` 带名称与四个技能，然后结束。这样"自动解析"至少能读到你是谁。

## 三个技能是怎么选中的

`?skill=plan|scaffold|iterate` 显式指定；没指定就按问题关键词猜（设计/教案 → 课前，引导/讲述 → 课中，诊断/反思 → 课后），都不像就走自由对话。提示词和知识库来自 `assets/js/prompt.js` 与 `assets/js/data.js`，**和网页端同一份**，改一处两边同时生效。

## 本地跑

```bash
node a2a/server.mjs            # 默认 0.0.0.0:9000
PORT=9100 node a2a/server.mjs  # 换端口
```

自测：

```bash
curl -sN "http://127.0.0.1:9000/sse?q=什么是四阶模式"          # 看得到逐字推送即正常
curl -s  "http://127.0.0.1:9000/.well-known/agent-card.json"   # 能力名片
curl -s  "http://127.0.0.1:9000/health"
```

## 部署到阿里云函数计算 FC

1. `powershell -ExecutionPolicy Bypass -File a2a/make-zip.ps1` → 生成 `a2a/a2a-fc.zip`（内含 `server.mjs` + `assets/js/prompt.js` + `assets/js/data.js`）
2. 控制台 → 函数计算 FC → 创建函数 → 选 **Web 函数**，运行环境 **Node.js 20**
3. 代码：上传 `a2a-fc.zip`；启动命令 `node server.mjs`；监听端口 `9000`（代码默认值，不用改）
4. 触发器：**HTTP 触发器**，认证方式选「无需认证」（否则平台不带签名访问会被拒），记下公网地址
5. 函数配置：超时时间调到 **60–120 秒**（模型生成要几十秒，默认 3 秒会截断）
6. 环境变量（可选）：
   - `LLM_API_KEY` 换成自己的 Key，不填则用内置 DeepSeek Key
   - `A2A_TOKEN` 设了之后，访问必须带 `?token=xxx` 或 `Authorization: Bearer xxx`（平台表单只有 URL，所以用 `?token=`）
7. 浏览器打开 `https://<你的函数地址>/health`，看到 `{"ok":true,...}` 就活了

拿到地址后，比赛系统里填：

```
https://<你的函数地址>/sse
```

如果想先试 OpenAI 兼容解析：`https://<你的函数地址>/sse/openai`。

## 排错

| 现象 | 原因 | 处理 |
|---|---|---|
| 平台提示解析失败 | 格式不对 | 换 `/sse/openai` 或 `/sse/a2a` 重新填 |
| 请求 401 | 设了 `A2A_TOKEN` | URL 后面加 `?token=xxx` |
| 请求 403/超时 | FC 未开公网触发器，或函数超时太短 | 检查触发器与超时设置 |
| 只收到最后一段文本 | 网关把流缓冲了 | 仍然可用（我们会在结束时一次性给出全文），只是不逐字 |
| 回复"服务异常" | 模型 Key 失效或欠费 | 换 `LLM_API_KEY`，或查 DeepSeek 余额 |

## 文件

```
a2a/server.mjs     服务本体（路由 / SSE / JSON-RPC / 能力名片）
a2a/make-zip.ps1   打 FC 代码包
a2a/README.md      本文件
```

服务只依赖 Node 内置模块（`http`、`fs`、`path`），无 npm 依赖，Node 18+ 即可。

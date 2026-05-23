# 社区生鲜团购项目 AI 初始记忆手册

更新时间：2026-05-17
适用范围：`D:\石卓林\学校\graduation` 下三项目联动开发（小程序 + 管理端 + Java后端）

## 1. 项目定位（AI必须先理解）
- 这是本科毕设项目：社区生鲜团购。
- 核心闭环：商品浏览 -> 拼团下单 -> 团长核销/自提 -> 订单流转。
- AI能力场景：食材/菜谱推荐（前端入口 + 后端LLM调用）。

## 2. 目录与职责
根目录：`D:\石卓林\学校\graduation`
- `community-fresh-group-buy`：UniApp 微信小程序前端（用户端）。
- `admin-community-fresh-group-buy`：后台前端（运营/管理端）。
- `community-fresh-group-buy-java`：Spring Boot 后端。

## 3. 小程序（community-fresh-group-buy）技术事实
- 技术栈：UniApp + Vue3 + TypeScript + Vite + Tailwind + weapp-tailwindcss。
- 关键页面：`src/pages/` 下包含 `index`、`goods`、`group-buy`、`order`、`mine`、`leader`、`ai-food` 等。
- 路由：`src/pages.json`。
- 样式注意：
  - 目标端是微信小程序，视觉单位应按 `rpx` 适配。
  - 使用 Tailwind 时，若出现尺寸偏小，优先按“设计值 * 2”的策略提升字号/间距（与小程序视觉一致）。
  - 避免只看H5视觉判断，需以微信开发者工具实机效果为准。

## 4. Java后端（community-fresh-group-buy-java）技术事实
- 技术栈：Spring Boot + MyBatis-Plus + MySQL + Redis。
- 主配置：`src/main/resources/application.yml`。
- 模块结构：`controller/service/mapper/entity/dto/config/common/utils`。
- AI调用核心：
  - 配置类：`com.langkeyo.config.DeepSeekProperties`
  - 服务类：`com.langkeyo.service.AiLlmService`
  - 控制器入口：`com.langkeyo.controller.AiController`

## 5. AI服务配置约定（关键）
当前后端配置：
- `deepseek.base-url: https://api.deepseek.com`
- `deepseek.api-key: ${DEEPSEEK_API_KEY:}`
- `deepseek.model: deepseek-chat`

结论：
- 未设置环境变量 `DEEPSEEK_API_KEY` 时，`AiLlmService.ask()` 会抛错：
  - `AI服务未配置，请联系管理员`

本地联调建议：
1. 使用 profile：`application-local.yml`
2. 启动激活：`spring.profiles.active=local` 或 `--spring.profiles.active=local`
3. 生产环境只走环境变量，不在仓库提交真实 key。

## 6. 关键业务流（给AI做任务时的上下文）
1. 用户端下单与拼团：`group-buy`、`order` 相关接口联动。
2. 团长工作台：`leader` 页面负责待核销与确认提货流程。
3. 我的页面：根据 `isLeader` 分流“进入工作台”或“申请团长”。
4. AI推荐：前端请求后端 AI 接口，后端转发至 DeepSeek 并返回结构化结果。

## 7. 给AI的工作规则（建议粘贴到每次会话）
- 先确认改动落在哪个子项目，不要跨项目误改。
- 所有建议优先给“文件路径 + 行号 + 修改点”。
- 对小程序UI问题，优先检查 `tw` 类在微信端的真实尺寸是否过小。
- 对AI报错，先看：
  1) profile 是否激活；
  2) `DEEPSEEK_API_KEY` 是否已注入进当前进程；
  3) `AiLlmService` 是否进入了配置校验分支。
- 不要输出全量重写代码，优先给最小改动方案。

## 8. 常见故障排查清单
### 8.1 AI服务未配置
- 现象：`RuntimeException: AI服务未配置，请联系管理员`
- 排查：
  1. 检查运行进程环境变量是否存在 `DEEPSEEK_API_KEY`。
  2. 检查 active profile 是否是预期值（如 local）。
  3. 检查 `application-local.yml` 是否被加载。

### 8.2 小程序页面尺寸偏小
- 现象：申请团长等页面字体、按钮、输入框偏小。
- 排查：
  1. 先确认是否使用了较小的 Tailwind 尺寸档位（如 `text-xs`、`p-3`）。
  2. 按微信端视觉将关键尺寸上调约 2 档到 4 档。
  3. 优先在真机/开发者工具中确认，不以浏览器H5为准。

## 9. 建议后续增强（可选）
- 增加后端启动时 AI 配置自检日志（仅打印是否配置，不打印明文key）。
- 为 AI 返回结构添加 schema 校验与降级文案。
- 将本手册拆分为：架构手册 / 接口手册 / 故障手册，便于按需注入模型上下文。

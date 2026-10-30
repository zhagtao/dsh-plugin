# 本地验证

## Host / API

```bash
node test/usage.test.mjs
```

脚本会：

1. 从环境变量或 DSH 凭证文件（`$DSH_HOME/.credentials.yaml`）读取 `COMMAND_CODE_API_KEY`（只在本进程内使用，不打印）。
2. 调用 `collectUsage()` 校验 GOAT 套餐、月度额度、5 小时/每周窗口。
3. 用桩 Context 注册 `/api/command-code/usage`，依次验证 200、缺失凭证 401、无效凭证 401/502。
4. 不修改当前 Desktop profile，也不启动 GUI。

## Client 渲染

`client.js` 是 `window.__ModuleLoader__` 工厂。可以用 jsdom + React 做挂载验证：

```bash
npm install react@19.3.0 react-dom@19.3.0 jsdom@30
```

然后构造一个 `t` 函数、桩 `ctx.slots` 和桩 `fetch`，断言：

- 收起态显示 `GOAT`、5 小时/每周百分比、剩余额度；
- 点击 header 后出现 `.ccu-details`；
- 点击刷新时请求带 `?refresh=1`；
- 组件卸载时清理 interval 和事件监听。

开发时也可以启动一个临时 profile：把本目录 `link:` 进临时 profile 的依赖与 `dsh.profile.bundles`，不触碰当前 profile。

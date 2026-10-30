# Command Code 套餐用量

一个 DeepSeek Harness（DSH）bundle，把 **Command Code 套餐**的实时用量放进左下角用户头像打开的账号菜单。点击「剩余用量」展开详情；不再有常驻右下角的悬浮卡片。

![GOAT icon](icon.svg)

本插件位于仓库的 `command-code-usage/` 子目录；仓库根目录是插件集合，不在根目录平铺插件代码。

## 显示内容

- **套餐**与订阅状态
- **5 小时 / 每周滚动限额**：百分比进度条，详情中还有已用 / 上限与重置倒计时
- **月度额度**剩余 / 总量（GOAT 为 70 credits）
- 额外额度（如有）、续费日期、最近更新时间
- 手动刷新与打开 Command Code Studio 用量页
- 检查并安装插件更新（需安装支持更新 API 的 DSH 插件市场）
- 加载骨架、错误提示、旧数据刷新失败提示

菜单内的用量区默认收起，点击「剩余用量」可展开或收起详情，状态不写入 `localStorage`。小窗口下区域限制高度并可滚动，按钮保留键盘焦点样式。

## 挂载方式

DSH 的账号菜单是 `settings.launcher` 单占位组件，没有菜单项级别的插件插槽。因此 `client.js` 仍注册一个无可见内容的 `shell.overlay` 组件来获得 React 生命周期，但不渲染悬浮卡片：

- 通过菜单项结构（`Settings` 与 `Feedback` / 登录或退出动作）识别打开的账号菜单；文本变化时再用 `Account menu` 触发器位置兜底。确认后向菜单项区域挂载一个由本插件拥有的 host 节点。
- 用 React portal 渲染用量区，不修改、不替换「设置 / 意见反馈 / 退出登录」等原有菜单项和事件。
- 用 `MutationObserver` 处理菜单打开、重建、关闭；插件卸载时断开监听并移除 host。
- 菜单关闭或页面切换后不会留下浮层，也不会遮挡输入框。

## 从 GitHub 安装

DSH 安装器把 Git 规格交给 pnpm；用 `#path:` 选择仓库中的插件子目录：

```text
https://github.com/zhagtao/dsh-plugin.git#path:/command-code-usage
```

也可以使用 Git 简写：

```text
github:zhagtao/dsh-plugin#path:/command-code-usage
```

在 Harness 左侧 **Plugins** 页面选择安装 bundle，填入上面的地址。安装完成后启用 `Command Code Usage`，刷新页面即可。展开用户菜单中的「剩余用量」后，可检查插件更新并在发现新版本时点击更新。此功能依赖支持更新 API 的 DSH 插件市场；不可用时可在 Plugins 页面重新安装同一地址。更新完成后按提示刷新页面或重启 DSH。

## 从本地目录安装

```bash
git clone https://github.com/zhagtao/dsh-plugin.git
```

然后在 **Plugins** 页面选择本地 bundle，选中 clone 仓库中的 `command-code-usage/` 子目录，而不是仓库根目录。

> 本地安装时由 DSH 的安装器把目录转换为 `link:` 依赖，需手动更新本地源目录；文档和仓库中不记录任何本机绝对路径。

## 数据来源

Host 半用 DSH 凭证服务中的 `COMMAND_CODE_API_KEY` 调用 Command Code 官方接口：

| 请求 | 用途 |
|---|---|
| `GET https://api.commandcode.ai/alpha/billing/credits` | 月度剩余额度、5 小时/每周窗口 |
| `GET https://api.commandcode.ai/alpha/billing/subscriptions` | 套餐 id、状态、续费日期 |

浏览器只调用同源的 `GET /api/command-code/usage`，该路由通过 Host Connection 注册，只允许已认证的 owner Peer 访问，并带 30 秒服务端缓存。**API Key 不会进入页面。**

## 配置

无需配置。凭证名称固定为 `COMMAND_CODE_API_KEY`，与 `command-code` provider 使用的键一致；它可以在「设置 → 模型」中保存，也可以通过启动环境变量提供。

如果 Key 未配置，账号菜单的用量区会显示「请先在设置 → 模型中配置 COMMAND_CODE_API_KEY」，并提供重试按钮。

## 安全与隐私

- Host 到 Command Code 的请求使用 `Authorization: Bearer <key>`，只在服务端发起。
- 客户端响应仅包含套餐、额度和窗口数字，不含用户邮箱、token 或任何凭证。
- `cache-control: no-store`，服务端缓存 30 秒；手动刷新带 `?refresh=1` 绕过缓存。
- 用量查询不写入 profile；只有用户主动选择更新插件时，插件市场才执行安装操作。插件无构建脚本。
- 仓库内不包含本机路径、用户名或凭证文件。

## 开发与验证

在插件目录执行：

```bash
cd command-code-usage
node --check index.js
node --check client.js
node test/usage.test.mjs
```

`test/usage.test.mjs` 会从环境变量或本机 DSH 凭证文件（`$DSH_HOME/.credentials.yaml`）读取 `COMMAND_CODE_API_KEY`，只打印套餐摘要，不打印 Key，也不会修改当前 profile。详见 [test/README.md](test/README.md)。

## 结构

```text
dsh-plugin/
└─ command-code-usage/
   ├─ index.js            # Host：凭证解析、Command Code 请求、/api 路由
   ├─ client.js           # Client：无头 shell.overlay 宿主、账号菜单 portal、轮询、locale
   ├─ cordis.patch.yml    # 插入 command-code-usage Host 行
   ├─ package.json        # bundle + dsh.client 清单
   ├─ locale/{en,zh}.json # Plugin Manager 标题/描述
   ├─ icon.svg            # 原创山羊图标
   └─ test/               # 本地验证脚本
```

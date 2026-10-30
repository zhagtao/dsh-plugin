# dsh-plugin

DeepSeek Harness（DSH）插件集合。仓库根目录只放集合级文件；每个插件位于自己的子目录，可独立安装和更新。

## 插件列表

| 插件 | 说明 |
|---|---|
| [command-code-usage](command-code-usage/README.md) | 在窗口右下角显示 Command Code GOAT 套餐的额度、5 小时与每周滚动限额。 |

## 从 GitHub 安装

DSH 安装器支持 pnpm 的 `#path:` 子目录参数，因此可以直接安装仓库中的某个插件：

```text
https://github.com/zhagtao/dsh-plugin.git#path:/command-code-usage
```

也可以使用 Git 简写：

```text
github:zhagtao/dsh-plugin#path:/command-code-usage
```

在 Harness 左侧 **Plugins** 页面选择安装 bundle，填入上面的地址。安装完成后启用对应插件并刷新页面。

## 从本地目录安装

```bash
git clone https://github.com/zhagtao/dsh-plugin.git
```

然后在 **Plugins** 页面选择本地 bundle，选中目标插件自己的子目录（例如 `command-code-usage/`），不要选择仓库根目录。

## 目录约定

- 根目录只保留集合级文件，例如本 README、`.gitignore`。
- 每个插件一个独立子目录，目录内包含自己的 `package.json`、`cordis.patch.yml`、Host/Client 代码、locale 与测试。
- 插件目录名与其 bundle 名称保持一致，便于按 `#path:/<目录>` 安装。

## 隐私

仓库不包含本机绝对路径、个人邮箱、API Key 或其他凭证。插件运行所需的密钥由 DSH 凭证服务在 Host 侧解析。

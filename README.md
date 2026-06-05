# EasternSunLAN 简体中文汉化包

这是 EasternSunLAN LAN 版的简体中文汉化资源仓库，用于跟踪汉化改动、自动打包，并通过 GitHub Releases 分发覆盖式汉化包。

## 当前版本

- 适配模组版本：`3.11.09`
- 汉化包版本：`3.11.09-zhCN.9`
- 发布日期：`2026-06-05`

## 下载与安装

从 GitHub Releases 下载最新的 `EasternSunLAN_zhCN_pack_*.zip`。

安装步骤：

1. 关闭游戏和启动器。
2. 将压缩包内容解压到 `D2R\Mods\EasternSunLAN\`。
3. 允许覆盖同名文件。
4. 启动 EasternSunLAN，并在游戏语言为简体中文时使用。

压缩包内路径从 `EasternSunLAN.mpq` 开始；覆盖后实际文件应位于：

```text
D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\local\lng\strings
D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\local\lng\strings-legacy
D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\D2RLAN\Filters\override_rules.lua
D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\hd\global\excel\desecratedzones.json
```

## 仓库内容

- `strings/`：当前 D2R 字符串汉化资源。
- `strings-legacy/`：legacy 字符串汉化补丁，补足地面物品名、稀有名片段等旧表读取场景。
- `mpq-data/`：除 `strings/` 外需要覆盖到 `EasternSunLAN.mpq/data/` 的汉化资源。
- `localization/`：本轮参考旧版精修的批处理记录、底材阶级表和审计摘要。
- `tools/build-pack.ps1`：从仓库源码生成覆盖式汉化包。
- `tools/verify-pack.ps1`：解包并校验 manifest、SHA256 和 JSON 解析。
- `tools/apply-item-tier-labels.mjs`：从 `item-names.json` 清理旧的普通/扩展/精英底材标签，避免干扰游戏生成名。
- `tools/sync-tier-labels-to-override-rules.mjs`：把底材阶级标签生成为 `override_rules.lua` 的 suffix 规则。
- `tools/sync-desecrated-zone-level-names.mjs`：把恐怖区域右上角提示使用的 `desecratedzones.json` level names 同步为中文，并添加 `[ACT1]` 到 `[ACT5]` 前缀。
- `tools/sync-override-rules-from-reference.mjs`：参考旧版过滤器汉化，生成当前版本的过滤器覆盖文件，并将符文名规范为英文。
- `tools/sync-item-name-descriptions.mjs`：把 `translated_item-names.json` 中的 tooltip-only 说明补进主 `item-names.json`，避免游戏内只剩物品名和属性行。
- `tools/sync-legacy-strings.mjs`：从本机 MOD 的 `strings-legacy` 生成仓库内 legacy 汉化，并修正稀有名片段直译。

本仓库不包含完整模组、存档、高清贴图、完整 SunRise Filter 或 Launcher/HUD DLL。发版包只覆盖过滤器汉化补丁 `override_rules.lua`，不覆盖用户的完整掉落过滤器。`desecratedzones.json` 只用于本地化恐怖区域右上角提示中的 `level_names`，并加上 `[ACT1]` 到 `[ACT5]` 前缀帮助定位。右上角倒计时 `Next Rotation In` 来自 Launcher/HUD DLL 的硬编码文本，本汉化包不再尝试翻译或修改 DLL，以避免启动器/游戏崩溃。符文名按当前项目规则保留英文。底材名右侧使用短标签显示阶级：普通 `[N]`、扩展 `[Ex]`、精英 `[El]`；标签由 `override_rules.lua` 追加，不写入基础物品名字符串。

## 本地打包

```powershell
pwsh ./tools/build-pack.ps1
pwsh ./tools/verify-pack.ps1 -ZipPath ./dist/EasternSunLAN_zhCN_pack_v3.11.09-zhCN.9.zip
```

## 版本规则

Release tag 使用：

```text
v{模组版本}-zhCN.{汉化修订号}
```

例如：`v3.11.09-zhCN.5`。如果模组仍是 `3.11.09`，但只更新汉化，递增为 `v3.11.09-zhCN.6`。

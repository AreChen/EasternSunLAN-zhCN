# Changelog

## v3.11.09-zhCN.2 - 2026-06-01

- 为武器、防具底材名追加阶级短标签：普通 `[N]`、扩展 `[Ex]`、精英 `[El]`。
- 从当前模组 `armor.txt` 与 `weapons.txt` 生成 `762` 条底材阶级映射。
- 同步更新 `strings/item-names.json` 与 `strings/translated_strings/translated_item-names.json`。
- 新增底材阶级映射生成、应用和测试脚本，后续版本可重复执行。

验证：

- 底材标签幂等检查：`changed=0`
- JSON 解析错误：`0`
- manifest SHA256 不匹配：`0`

## v3.11.09-zhCN.1 - 2026-06-01

- 建立独立汉化包仓库，跟踪 `strings/` 下的简体中文资源。
- 参考旧版精修翻译，重点覆盖物品名、词缀、属性说明、技能、场景名和怪物名。
- 修正多处明显错译和机翻残留，例如 `Hide`、`Pelt`、`Bar`、`Fetish`、`Sucker`、`Diablo`、`Frozen tundra`、`Throne of Destruction` 等。
- 保留英文符文名，遵守当前项目本地化规则。
- 加入覆盖式汉化包打包脚本、manifest SHA256 清单和包级验证脚本。

验证：

- JSON 解析错误：`0`
- manifest SHA256 不匹配：`0`
- 非位置占位符顺序不匹配：`0`

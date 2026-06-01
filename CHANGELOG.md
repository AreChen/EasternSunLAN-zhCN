# Changelog

## v3.11.09-zhCN.5 - 2026-06-01

- 修复主 `item-names.json` 缺少 tooltip-only 说明的问题，恢复符文储存者、材料储存器、宝石储存器等道具说明。
- 补全过滤器符文名英文化范围，`低级古符`、`中级古符`、`高级古符` 的输出符文名也改为英文。
- 新增说明覆盖测试，防止 `s01-s46`、`s51-s83` 等储存器说明只存在于 `translated_strings` 而不进入主加载文件。

验证：

- 主 `item-names.json` 缺失说明 key：`0`
- 中文符文名残留扫描：`0`
- 过滤器本地化测试：通过
- item-name 说明覆盖测试：通过
- zip 包内过滤器路径检查：通过
- manifest SHA256 不匹配：`0`
- JSON 解析错误：`0`

## v3.11.09-zhCN.4 - 2026-06-01

- 修正过滤器覆盖规则中的中文符文名，改为项目统一使用的英文符文名。
- `新符` 按当前 Eastern Sun 符文名显示为 `I/U/Shi/.../Wo`。
- `古符` 按 LoD 符文名显示为 `El/Eld/Tir/.../Zod`。
- 更新过滤器同步脚本，后续从参考文件刷新时会自动规范符文名。
- 增加回归测试，禁止符文提示中的中文符文名重新出现。

验证：

- 中文符文名残留扫描：`0`
- 过滤器本地化测试：通过
- zip 包内过滤器路径检查：通过
- manifest SHA256 不匹配：`0`
- JSON 解析错误：`0`

## v3.11.09-zhCN.3 - 2026-06-01

- 将 `data/D2RLAN/Filters/override_rules.lua` 纳入汉化包覆盖内容。
- 参考旧版 `override_rules_cn.lua` 的人工润色中文，优化当前 683 条过滤器覆盖规则。
- 保留当前版本过滤器结构和非中文 locale，仅同步 `enUS`/`zhCN` 中文显示字段。
- 新增过滤器同步脚本、过滤器本地化测试和包内容测试。

验证：

- 过滤器本地化测试：通过
- zip 包内过滤器路径检查：通过
- JSON 解析错误：`0`
- manifest SHA256 不匹配：`0`

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

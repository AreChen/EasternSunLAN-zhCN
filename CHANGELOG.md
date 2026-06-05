# Changelog

## v3.11.09-zhCN.9 - 2026-06-05

- 明确取消 Launcher/HUD DLL 层面的倒计时翻译处理；`Next Rotation In` 属于 DLL 硬编码文本，本汉化包不包含也不修改任何 DLL，以避免启动器或游戏崩溃。
- 更新仓库 README、AGENTS 和包内 README，说明恐怖区域地区名汉化仍由 `desecratedzones.json` 提供，倒计时文字保持原版英文。
- 加强包内容测试，禁止将 DLL、EXE 或 Launcher 路径文件打入 GitHub 发版 zip。

验证：

- 所有 Node 回归测试：通过
- 包内容检查确认无 DLL/EXE/Launcher 文件：通过
- `verify-pack.ps1`：通过

## v3.11.09-zhCN.8 - 2026-06-04

- 将恐怖区域右上角提示中的 `（终局区域）` 统一为 ASCII 括号格式 ` (终局区域)`，例如 `[ACT1] 血鸦的工坊 第1层 (终局区域)`。
- 更新恐怖区域名称同步脚本，使全角括号和 ASCII 括号输入都能稳定生成同一份本地化 `level_names`，避免重复同步后出现缺失翻译。
- 新增回归测试，禁止 `desecratedzones.json` 中的恐怖区域名称重新出现全角括号。

验证：

- 恐怖区域 `level_names` 同步检查：通过
- 恐怖区域名称回归测试：通过
- 包内容检查继续验证 `desecratedzones.json` 存在，且不包含已修复的英文恐怖区域 `name` 值。

## v3.11.09-zhCN.7 - 2026-06-04

- 将 `data/hd/global/excel/desecratedzones.json` 纳入汉化包，仅本地化 `level_names.name`，并按 `levels.txt` 的 Act 字段添加 `[ACT1]` 到 `[ACT5]` 前缀，修复右上角恐怖区域提示显示 `Crypt of Damnation`、`Infested Lair`、`Endless Abyss` 等英文区域名且不易定位的问题。
- 新增恐怖区域名称同步脚本和回归测试，确保 `Crypt of Damnation`、`Infested Lair Level 1/2`、`Endless Abyss Level 1-6` 等提示名称不再以英文出现在 `level_names` 中，并保留 ACT 前缀。
- 保持恐怖区域轮换、等级边界、经验加成和传送点配置不变；本次只改显示名。

验证：

- 恐怖区域 `level_names` 同步检查：通过
- 恐怖区域名称回归测试：通过
- 包内容检查会验证 `desecratedzones.json` 存在，并禁止上述英文 `name` 值回退。

## v3.11.09-zhCN.6 - 2026-06-01

- 将 `strings-legacy/` 纳入汉化包，补足 legacy 物品名和稀有名片段的 `zhCN`，修复部分地面装备只显示等级/孔数、不显示名称的问题。
- 修正稀有名片段直译，例如 `Stone Nails` 不再显示为“石头钉子”，相关片段改为 `磐石`、`钉刺`、`尸骸`、`邪灵`、`罩影`、`帷幕` 等更适合组合的短词。
- 将底材阶级标签从 `item-names.json` 移出，改由 `override_rules.lua` 的 suffix 规则追加，避免魔法/稀有装备名只剩 `(45)` 这类等级显示。
- 明确发版包只分发 `data/D2RLAN/Filters/override_rules.lua`，不再包含完整 `SunRise Filter`，避免覆盖用户正在使用的掉落过滤器。
- 新增 legacy 字符串同步脚本、阶级标签 override 同步脚本和回归测试，防止 `strings-legacy/item-names.json`、`item-nameaffixes.json` 再次缺失关键 `zhCN`，也防止阶级标签重新写回字符串表。

验证：

- legacy item-name/item-nameaffix 空 `zhCN`：`0`
- legacy 字符串同步检查：通过
- legacy 稀有名片段测试：通过
- override 阶级标签测试：通过
- zip 包内 legacy 路径检查：通过

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

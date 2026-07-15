# 中国原油进口分国别查询

网页按总量、大区和国家查询中国月度原油进口量，单位为 `kbd`（千桶/日）。当前数据覆盖 2009-01 至 2026-05。

## 数据口径

- 工作表：`Crude imports — Volume`
- 月份：第 6 行，从 `C6` 开始
- 大区与国家：第 7–80 行
- 总进口量：第 81 行 `Total crude imports`
- 空单元格保留为 `null`（未发布），数字 `0` 保留为已报告零值
- 大区和全国数值直接采用工作簿内的汇总行，不重新加总国家行

## 每月更新

收到新版工作簿后运行：

```powershell
py scripts\extract_crude_imports.py "新版工作簿.xlsx" public\data\crude-imports.json
npm run build
```

抽取程序会自动读取从 `C6` 起连续的月份列，并输出网页使用的数据快照。构建通过后即可发布新版本。

## 本地开发

```powershell
npm install
npm run dev
```

本项目使用 vinext 与 Sites 托管配置；发布数据是静态快照，不是实时数据库连接。

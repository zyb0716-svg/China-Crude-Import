"use client";

import { useEffect, useMemo, useState } from "react";

type Level = "total" | "continent" | "country";
type Series = {
  id: string;
  name: string;
  level: Level;
  continent: string | null;
  values: Array<number | null>;
};
type Payload = {
  metadata: {
    sourceFile: string;
    sheet: string;
    unit: string;
    compiled: string;
    sources: string;
    firstMonth: string;
    latestMonth: string;
  };
  dates: string[];
  series: Series[];
};

const CONTINENT_LABELS: Record<string, string> = {
  "Middle East": "中东",
  Africa: "非洲",
  "CIS/Europe": "独联体/欧洲",
  Americas: "美洲",
  "Asia-Pacific": "亚太",
};

const COUNTRY_LABELS: Record<string, string> = {
  "Saudi Arabia": "沙特阿拉伯",
  Iraq: "伊拉克",
  Iran: "伊朗",
  Oman: "阿曼",
  "United Arab Emirates": "阿联酋",
  Kuwait: "科威特",
  Yemen: "也门",
  Qatar: "卡塔尔",
  Angola: "安哥拉",
  Sudan: "苏丹",
  "Congo, Republic of the": "刚果（布）",
  "Congo, Democratic Republic of the": "刚果（金）",
  "Equatorial Guinea": "赤道几内亚",
  Libya: "利比亚",
  Nigeria: "尼日利亚",
  Algeria: "阿尔及利亚",
  Chad: "乍得",
  Egypt: "埃及",
  Mauritania: "毛里塔尼亚",
  Gabon: "加蓬",
  Ghana: "加纳",
  Cameroon: "喀麦隆",
  "South Africa": "南非",
  "Cote d'Ivoire": "科特迪瓦",
  "South Sudan": "南苏丹",
  Mozambique: "莫桑比克",
  Senegal: "塞内加尔",
  Niger: "尼日尔",
  Togo: "多哥",
  Russia: "俄罗斯",
  Kazakhstan: "哈萨克斯坦",
  Norway: "挪威",
  UK: "英国",
  Azerbaijan: "阿塞拜疆",
  Turkey: "土耳其",
  Denmark: "丹麦",
  Sweden: "瑞典",
  Turkmenistan: "土库曼斯坦",
  Venezuela: "委内瑞拉",
  Brazil: "巴西",
  Argentina: "阿根廷",
  Ecuador: "厄瓜多尔",
  Colombia: "哥伦比亚",
  Cuba: "古巴",
  Canada: "加拿大",
  Mexico: "墨西哥",
  Bolivia: "玻利维亚",
  US: "美国",
  Curaçao: "库拉索",
  Uruguay: "乌拉圭",
  Aruba: "阿鲁巴",
  Panama: "巴拿马",
  Guyana: "圭亚那",
  "Trinidad and Tobago": "特立尼达和多巴哥",
  Indonesia: "印度尼西亚",
  Vietnam: "越南",
  Thailand: "泰国",
  "Brunei Darussalam": "文莱",
  Malaysia: "马来西亚",
  Australia: "澳大利亚",
  Mongolia: "蒙古",
  Myanmar: "缅甸",
  "Papua New Guinea": "巴布亚新几内亚",
  Philippines: "菲律宾",
  Japan: "日本",
  "South Korea": "韩国",
  Singapore: "新加坡",
  "East Timor": "东帝汶",
  "New Zealand": "新西兰",
};

const fmt = (value: number | null | undefined, digits = 1) =>
  value == null
    ? "—"
    : value.toLocaleString("zh-CN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

const displayName = (series: Series) => {
  if (series.level === "total") return "总进口量";
  if (series.level === "continent") return CONTINENT_LABELS[series.name] || series.name;
  const zh = COUNTRY_LABELS[series.name];
  return zh ? `${zh} · ${series.name}` : series.name;
};

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function TrendChart({ dates, values, label }: { dates: string[]; values: Array<number | null>; label: string }) {
  const width = 980;
  const height = 360;
  const margin = { top: 22, right: 24, bottom: 54, left: 72 };
  const valid = values.filter((value): value is number => value != null);
  if (!valid.length) return <div className="empty-state">所选时段暂无已发布数据</div>;

  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const spread = Math.max(max - min, max * 0.16, 1);
  const yMin = min < 0 ? min - spread * 0.16 : Math.max(0, min - spread * 0.16);
  const yMax = max + spread * 0.12;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const x = (index: number) => margin.left + (dates.length === 1 ? plotW / 2 : (index / (dates.length - 1)) * plotW);
  const y = (value: number) => margin.top + plotH - ((value - yMin) / (yMax - yMin)) * plotH;

  const segments: string[] = [];
  let current = "";
  values.forEach((value, index) => {
    if (value == null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? " L" : "M"}${x(index).toFixed(2)} ${y(value).toFixed(2)}`;
  });
  if (current) segments.push(current);
  const tickEvery = Math.max(1, Math.ceil(dates.length / 8));

  return (
    <div className="chart-wrap">
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}月度进口趋势`}>
        <defs>
          <linearGradient id="lineGlow" x1="0" x2="1">
            <stop offset="0" stopColor="#2d7774" />
            <stop offset="1" stopColor="#d0803f" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = yMin + ((yMax - yMin) * step) / 4;
          const yy = y(value);
          return (
            <g key={step}>
              <line x1={margin.left} x2={width - margin.right} y1={yy} y2={yy} className="grid-line" />
              <text x={margin.left - 12} y={yy + 5} textAnchor="end" className="axis-label">{fmt(value, 0)}</text>
            </g>
          );
        })}
        {dates.map((date, index) =>
          index % tickEvery === 0 || index === dates.length - 1 ? (
            <text key={date} x={x(index)} y={height - 20} textAnchor="middle" className="axis-label">{date}</text>
          ) : null,
        )}
        {segments.map((path, index) => <path key={index} d={path} className="trend-line" />)}
        {values.map((value, index) =>
          value == null ? null : (
            <circle key={dates[index]} cx={x(index)} cy={y(value)} r={dates.length > 72 ? 2.2 : 3.5} className="trend-point">
              <title>{`${dates[index]} · ${fmt(value)} kbd`}</title>
            </circle>
          ),
        )}
      </svg>
    </div>
  );
}

export function CrudeImportDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<Level>("total");
  const [continent, setContinent] = useState("Middle East");
  const [country, setCountry] = useState("Saudi Arabia");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    fetch("/data/crude-imports.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: Payload) => {
        setData(payload);
        setStart(payload.dates[0]);
        setEnd(payload.dates.at(-1) || "");
      })
      .catch(() => setError("数据加载失败，请刷新页面后重试。"));
  }, []);

  const continents = useMemo(() => data?.series.filter((item) => item.level === "continent") || [], [data]);
  const countries = useMemo(
    () => data?.series.filter((item) => item.level === "country" && item.continent === continent) || [],
    [data, continent],
  );

  useEffect(() => {
    if (countries.length && !countries.some((item) => item.name === country)) setCountry(countries[0].name);
  }, [countries, country]);

  const selected = useMemo(() => {
    if (!data) return null;
    if (level === "total") return data.series.find((item) => item.level === "total") || null;
    if (level === "continent") return data.series.find((item) => item.level === "continent" && item.name === continent) || null;
    return data.series.find((item) => item.level === "country" && item.name === country) || null;
  }, [data, level, continent, country]);

  const startIndex = data ? Math.max(0, data.dates.indexOf(start)) : 0;
  const endIndex = data ? Math.max(startIndex, data.dates.indexOf(end)) : 0;
  const rangeDates = data?.dates.slice(startIndex, endIndex + 1) || [];
  const rangeValues = selected?.values.slice(startIndex, endIndex + 1) || [];
  const avg = average(rangeValues);
  const validValues = rangeValues.filter((value): value is number => value != null);
  const ranking = useMemo(() => {
    if (!data || !selected) return [];
    let candidates: Series[];
    if (level === "total") candidates = data.series.filter((item) => item.level === "continent");
    else if (level === "continent") candidates = data.series.filter((item) => item.level === "country" && item.continent === continent);
    else {
      const parent = data.series.find((item) => item.level === "continent" && item.name === selected.continent);
      candidates = parent ? [selected, parent] : [selected];
    }
    return candidates
      .map((item) => ({ item, value: average(item.values.slice(startIndex, endIndex + 1)) }))
      .filter((entry): entry is { item: Series; value: number } => entry.value != null)
      .sort((a, b) => b.value - a.value)
      .slice(0, level === "continent" ? 12 : 8);
  }, [data, selected, level, continent, startIndex, endIndex]);
  const rankingMax = Math.max(...ranking.map((entry) => entry.value), 1);

  if (error) return <main className="load-state">{error}</main>;
  if (!data || !selected) return <main className="load-state">正在载入原油进口数据…</main>;

  const selectedLabel = displayName(selected);
  const periodLabel = `${rangeDates[0] || "—"} 至 ${rangeDates.at(-1) || "—"}`;

  return (
    <main className="dashboard-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CHINA CRUDE IMPORT</p>
          <h1>中国原油进口分国别查询</h1>
        </div>
        <div className="freshness">
          <span>数据日期</span>
          <strong>{data.metadata.latestMonth}</strong>
          <small>单位：kbd（千桶/日）</small>
        </div>
      </header>

      <nav className="tabs" aria-label="查询层级">
        {(["total", "continent", "country"] as Level[]).map((item) => (
          <button key={item} className={`tab ${level === item ? "active" : ""}`} onClick={() => setLevel(item)} type="button">
            {item === "total" ? "总进口量" : item === "continent" ? "按大洲" : "按国家"}
          </button>
        ))}
      </nav>

      <section className="query-panel" aria-label="查询条件">
        {level === "total" && <div className="scope-summary">
          <span>查询对象</span>
          <strong>总进口量</strong>
        </div>
        }
        {level !== "total" && (
          <label>
            <span className="field-label">大洲选择</span>
            <select value={continent} onChange={(event) => setContinent(event.target.value)}>
              {continents.map((item) => <option key={item.id} value={item.name}>{displayName(item)}</option>)}
            </select>
          </label>
        )}
        {level === "country" && (
          <label className="country-field">
            <span className="visually-hidden">国家 / 地区</span>
            <select aria-label="国家或地区" value={country} onChange={(event) => setCountry(event.target.value)}>
              {countries.map((item) => <option key={item.id} value={item.name}>{displayName(item)}</option>)}
            </select>
          </label>
        )}
        <label>
          <span className="field-label">开始月份</span>
          <select value={start} onChange={(event) => setStart(event.target.value)}>
            {data.dates.slice(0, endIndex + 1).map((date) => <option key={date}>{date}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">结束月份</span>
          <select value={end} onChange={(event) => setEnd(event.target.value)}>
            {data.dates.slice(startIndex).map((date) => <option key={date}>{date}</option>)}
          </select>
        </label>
        <div className="metric inline-metric">
          <span>期间月均</span>
          <strong>{fmt(avg)} kbd</strong>
          <small>{validValues.length} 个月有效值</small>
        </div>
      </section>

      <section className={`analysis-grid ${level === "country" ? "single" : ""}`}>
        <article className="block chart-panel">
          <div className="panel-heading">
            <div><h3>{selectedLabel}月度进口趋势</h3><span>{periodLabel}</span></div>
            <em>kbd</em>
          </div>
          <TrendChart dates={rangeDates} values={rangeValues} label={selectedLabel} />
        </article>

        {level !== "country" && <article className="block ranking-panel">
          <div className="panel-heading">
            <div><span>PERIOD AVERAGE</span><h3>{level === "total" ? "大洲月均排名" : "国家月均排名"}</h3></div>
            <em>kbd</em>
          </div>
          <div className="ranking-list">
            {ranking.map(({ item, value }, index) => (
              <button
                type="button"
                key={item.id}
                className="ranking-row"
                onClick={() => {
                  if (item.level === "continent") { setContinent(item.name); setLevel("continent"); }
                  if (item.level === "country") { setContinent(item.continent || continent); setCountry(item.name); setLevel("country"); }
                }}
              >
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="rank-main">
                  <span className="rank-label">{displayName(item)}</span>
                  <span className="bar-track"><i style={{ width: `${Math.max(0, (value / rankingMax) * 100)}%` }} /></span>
                </span>
                <strong>{fmt(value)}</strong>
              </button>
            ))}
          </div>
        </article>}
      </section>

      <section className="block table-panel">
        <div className="panel-heading">
          <div><span>MONTHLY DETAIL</span><h3>月度数据明细</h3></div>
          <em>{rangeDates.length} 个月</em>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>月份</th><th>{selectedLabel}</th><th>环比</th><th>同比</th></tr></thead>
            <tbody>
              {rangeDates.map((date, index) => {
                const value = rangeValues[index];
                const previous = index ? rangeValues[index - 1] : null;
                const mom = value != null && previous != null && previous !== 0 ? ((value - previous) / previous) * 100 : null;
                const yearAgoIndex = startIndex + index - 12;
                const yearAgo = yearAgoIndex >= 0 ? selected.values[yearAgoIndex] : null;
                const yoy = value != null && yearAgo != null && yearAgo !== 0 ? ((value - yearAgo) / yearAgo) * 100 : null;
                return (
                  <tr key={date}>
                    <td>{date}</td><td className="numeric">{fmt(value)}</td>
                    <td className={`numeric ${mom != null && mom < 0 ? "negative" : "positive"}`}>{mom == null ? "—" : `${mom >= 0 ? "+" : ""}${fmt(mom)}%`}</td>
                    <td className={`numeric ${yoy != null && yoy < 0 ? "negative" : "positive"}`}>{yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${fmt(yoy)}%`}</td>
                  </tr>
                );
              }).reverse()}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}

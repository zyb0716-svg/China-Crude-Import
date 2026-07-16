import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the crude-import dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>中国原油进口分国别查询<\/title>/i);
  assert.match(html, /正在载入原油进口数据/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("published snapshot has one value per series and month", async () => {
  const payload = JSON.parse(await readFile(new URL("../public/data/crude-imports.json", import.meta.url), "utf8"));
  assert.equal(payload.dates.length, 209);
  assert.equal(payload.dates[0], "2009-01");
  assert.equal(payload.dates.at(-1), "2026-05");
  assert.equal(payload.series.filter((row) => row.level === "total").length, 1);
  assert.equal(payload.series.filter((row) => row.level === "continent").length, 5);
  assert.equal(payload.series.filter((row) => row.level === "country").length, 69);
  assert.equal(new Set(payload.series.map((row) => row.id)).size, payload.series.length);
  assert.ok(payload.series.every((row) => row.values.length === payload.dates.length));
  assert.ok(payload.series.some((row) => row.values.includes(null)), "missing values must remain null");
  assert.ok(payload.series.some((row) => row.values.includes(0)), "reported zeroes must remain numeric zeroes");
});

test("implements the first review-sheet revision", async () => {
  const source = await readFile(new URL("../app/CrudeImportDashboard.tsx", import.meta.url), "utf8");
  assert.match(source, /CHINA CRUDE IMPORT<\/p>/);
  assert.match(source, /<span>数据日期<\/span>/);
  assert.match(source, /按大洲/);
  assert.match(source, /setStart\(payload\.dates\[0\]\)/);
  assert.match(source, /<th>同比<\/th>/);
  assert.doesNotMatch(source, /hero-copy|期末值|期间峰值|首末变化|占全国进口比重|数据状态|<footer>/);
});

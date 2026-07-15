import type { Metadata } from "next";
import { CrudeImportDashboard } from "./CrudeImportDashboard";

export const metadata: Metadata = {
  title: "中国原油进口分国别查询",
  description: "按总量、大区和国家查询中国月度原油进口量（kbd）",
};

export default function Home() {
  return <CrudeImportDashboard />;
}

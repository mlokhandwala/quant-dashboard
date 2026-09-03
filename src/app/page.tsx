"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Flame, 
  Award, 
  BarChart3, 
  Globe2, 
  DollarSign, 
  Layers,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid,
  AreaChart,
  Area 
} from "recharts";

interface MacroData {
  last_updated: string;
  brent_crude: { value: number; unit: string; percentile_10yr: number; verdict: string; trend: string };
  us_10y: { value: number; unit: string; percentile_10yr: number; verdict: string; trend: string };
  india_10y: { value: number; unit: string; percentile_10yr: number; verdict: string; trend: string };
  dxy: { value: number; unit: string; percentile_10yr: number; verdict: string; trend: string };
  usdinr: { value: number; unit: string; percentile_10yr: number; verdict: string; trend: string };
  fii_dii_history: Array<{ Year: string; FII_Net_Inflow_Cr?: number; DII_Net_Inflow_Cr?: number; FII_Net_Equity_Cr?: number; DII_Net_Equity_Cr?: number; Strategic_Market_Dynamic?: string }>;
  india_macro_history: Array<any>;
  daily_chart_history?: Array<{ Date: string; Brent: number; US10Y: number; DXY: number; USDINR: number; Nifty50: number; IndiaGSec?: number }>;
}

interface StockItem {
  Symbol: string;
  Name: string;
  Period?: string;
  Years?: number;
  Cum_CFO_Cr: number;
  Cum_PAT_Cr: number;
  Cash_Conv_Pct: number;
  Avg_ROCE_Pct: number;
  Latest_Debt_Cr: number;
  Peak_Debt_Cr?: number;
  Sales_CAGR?: number;
  CMP?: number;
  PE?: number;
  MCap_Cr?: number;
}

interface ScreenerData {
  last_updated: string;
  total_audited_equities: number;
  plan_a_count: number;
  plan_b_count: number;
  traps_count: number;
  plan_a_top: StockItem[];
  plan_b_top: StockItem[];
  traps_top: StockItem[];
  all_equities_compact: StockItem[];
}

export default function QuantDashboard() {
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [screener, setScreener] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"macro" | "planA" | "planB" | "traps" | "search">("macro");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<"Brent" | "US10Y" | "IndiaGSec" | "USDINR" | "DXY" | "Nifty50">("Brent");
  const [timeframe, setTimeframe] = useState<"1M" | "6M" | "1Y" | "ALL">("1Y");
  const [flowTimeframe, setFlowTimeframe] = useState<"3Y" | "5Y" | "ALL">("ALL");
  const [flowMode, setFlowMode] = useState<"both" | "net">("both");

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/quant-dashboard" : "";
        const [macroRes, screenerRes] = await Promise.all([
          fetch(`${basePath}/data/macro_pulse.json`),
          fetch(`${basePath}/data/forensic_screener.json`)
        ]);
        const m = await macroRes.json();
        const s = await screenerRes.json();
        setMacro(m);
        setScreener(s);
      } catch (err) {
        console.error("Failed loading data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredStocks = React.useMemo(() => {
    if (!screener || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return screener.all_equities_compact
      .filter(s => s.Symbol.toLowerCase().includes(q) || s.Name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [screener, searchQuery]);

  const filteredChartHistory = React.useMemo(() => {
    if (!macro?.daily_chart_history) return [];
    const history = macro.daily_chart_history;
    if (timeframe === "1M") return history.slice(-22);
    if (timeframe === "6M") return history.slice(-125);
    if (timeframe === "1Y") return history.slice(-250);
    return history;
  }, [macro, timeframe]);

  const filteredFlowHistory = React.useMemo(() => {
    if (!macro?.fii_dii_history) return [];
    let list = macro.fii_dii_history.map(item => {
      const fii = Number(item.FII_Net_Equity_Cr || 0);
      const dii = Number(item.DII_Net_Equity_Cr || 0);
      return {
        ...item,
        FII_Net_Equity_Cr: fii,
        DII_Net_Equity_Cr: dii,
        Net_Domestic_Absorption_Cr: dii - Math.abs(fii < 0 ? fii : 0) // Net positive cushion
      };
    });
    if (flowTimeframe === "3Y") return list.slice(-3);
    if (flowTimeframe === "5Y") return list.slice(-5);
    return list;
  }, [macro, flowTimeframe]);

  const indicatorConfigs = {
    Brent: {
      name: "Brent Crude Oil",
      unit: "USD/bbl",
      color: "#f43f5e",
      dataKey: "Brent",
      desc: "Energy & input cost benchmark. Elevated levels squeeze margins across paints, adhesives, chemicals, and tires."
    },
    US10Y: {
      name: "US 10-Year Treasury Yield",
      unit: "%",
      color: "#f59e0b",
      dataKey: "US10Y",
      desc: "Global risk-free rate anchor. Elevated yields keep global discount rates high, capping emerging market valuation multiples."
    },
    IndiaGSec: {
      name: "India 10-Year Sovereign G-Sec Yield",
      unit: "%",
      color: "#10b981",
      dataKey: "IndiaGSec",
      desc: "Benchmark domestic sovereign borrowing cost. Anchored yields at 6.89% provide an equity-friendly domestic capital structure."
    },
    USDINR: {
      name: "USD / INR Exchange Rate",
      unit: "INR",
      color: "#06b6d4",
      dataKey: "USDINR",
      desc: "Currency valuation measure. Currency softening acts as a top-line margin tailwind for Indian Pharma and IT exporters."
    },
    DXY: {
      name: "US Dollar Index (DXY)",
      unit: "Index",
      color: "#a855f7",
      dataKey: "DXY",
      desc: "Tracks the greenback vs a basket of global currencies. Softness supports emerging market institutional liquidity."
    },
    Nifty50: {
      name: "Nifty 50 Benchmark Index",
      unit: "Points",
      color: "#10b981",
      dataKey: "Nifty50",
      desc: "Core Indian large-cap equity gauge reflecting domestic economic momentum and institutional absorption."
    }
  };

  const activeConfig = indicatorConfigs[selectedIndicator];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 animate-spin text-emerald-400" />
          <div className="text-lg tracking-widest uppercase">Connecting to Quant Terminal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0c121e]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">QUANT TERMINAL</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0 Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Macro Regimes & 10-Year Forensic Screening Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              NSE 2,566 Equities Audited
            </span>
            <span className="hidden sm:inline-block text-slate-400">
              Updated: {macro?.last_updated ? new Date(macro.last_updated).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Today"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("macro")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "macro"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Globe2 className="w-4 h-4" /> Macro Regime Radar
          </button>

          <button
            onClick={() => setActiveTab("planA")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "planA"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" /> Plan A: Munger Compounders ({screener?.plan_a_count})
          </button>

          <button
            onClick={() => setActiveTab("planB")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "planB"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" /> Plan B: Dhandho Deep Value ({screener?.plan_b_count})
          </button>

          <button
            onClick={() => setActiveTab("traps")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "traps"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Forensic Traps ({screener?.traps_count})
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "search"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Search className="w-4 h-4 text-purple-400" /> 2,566 Equities Screener
          </button>
        </div>

        {/* TAB 1: MACRO REGIME RADAR */}
        {activeTab === "macro" && macro && (
          <div className="space-y-6">
            {/* Top Indicator KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Brent Crude */}
              <div 
                onClick={() => setSelectedIndicator("Brent")}
                className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                  selectedIndicator === "Brent" 
                    ? "bg-[#141e33] border-rose-500 ring-2 ring-rose-500/20 shadow-lg" 
                    : "bg-[#0e1626] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Brent Crude Oil</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    {macro.brent_crude.percentile_10yr}th %ile
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white tracking-tight">
                  ${macro.brent_crude.value}
                  <span className="text-xs text-slate-400 font-sans font-normal ml-1">/bbl</span>
                </div>
                <div className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {macro.brent_crude.trend}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Margin Squeeze Risk</span>
                  <span className="text-[10px] text-rose-400 underline font-mono">Click to chart</span>
                </div>
              </div>

              {/* US 10Y Yield */}
              <div 
                onClick={() => setSelectedIndicator("US10Y")}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  selectedIndicator === "US10Y" 
                    ? "bg-[#141e33] border-amber-500 ring-2 ring-amber-500/20 shadow-lg" 
                    : "bg-[#0e1626] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">US 10-Yr Yield</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    {macro.us_10y.percentile_10yr}th %ile
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white tracking-tight">
                  {macro.us_10y.value}%
                </div>
                <div className="mt-2 text-xs font-medium text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {macro.us_10y.verdict}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Global Discount Rate</span>
                  <span className="text-[10px] text-amber-400 underline font-mono">Click to chart</span>
                </div>
              </div>

              {/* India 10Y G-Sec */}
              <div 
                onClick={() => setSelectedIndicator("IndiaGSec")}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  selectedIndicator === "IndiaGSec" 
                    ? "bg-[#141e33] border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg" 
                    : "bg-[#0e1626] border-emerald-500/30 hover:border-emerald-500/60"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">India 10Y G-Sec</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {macro.india_10y.percentile_10yr}th %ile
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                  {macro.india_10y.value}%
                </div>
                <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> BENIGN / ANCHORED
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Low domestic borrowing cost</span>
                  <span className="text-[10px] text-emerald-400 underline font-mono">Click to chart</span>
                </div>
              </div>

              {/* USD / INR */}
              <div 
                onClick={() => setSelectedIndicator("USDINR")}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  selectedIndicator === "USDINR" 
                    ? "bg-[#141e33] border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg" 
                    : "bg-[#0e1626] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">USD / INR</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">Top Tier</span>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white tracking-tight">
                  ₹{macro.usdinr.value}
                </div>
                <div className="mt-2 text-xs font-medium text-cyan-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Exporter Tailwinds
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>IT / Pharma Boost</span>
                  <span className="text-[10px] text-cyan-400 underline font-mono">Click to chart</span>
                </div>
              </div>

              {/* Dollar Index (DXY) */}
              <div 
                onClick={() => setSelectedIndicator("DXY")}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  selectedIndicator === "DXY" 
                    ? "bg-[#141e33] border-purple-500 ring-2 ring-purple-500/20 shadow-lg" 
                    : "bg-[#0e1626] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Dollar Index (DXY)</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                    {macro.dxy.percentile_10yr}th %ile
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white tracking-tight">
                  {macro.dxy.value}
                </div>
                <div className="mt-2 text-xs font-medium text-purple-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> Neutral-to-Soft
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Limits EM Outflows</span>
                  <span className="text-[10px] text-purple-400 underline font-mono">Click to chart</span>
                </div>
              </div>

            </div>

            {/* EXPANDED INTERACTIVE HISTORICAL CHART CARD */}
            <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                      {activeConfig.name} Multi-Horizon Historical Trajectory
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Unit: {activeConfig.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                    {activeConfig.desc}
                  </p>
                </div>

                {/* Timeframe Buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {(["1M", "6M", "1Y", "ALL"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded transition ${
                        timeframe === tf
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Body */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartHistory} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="Date" 
                      stroke="#64748b" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear().toString().slice(-2)}`;
                      }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} ${activeConfig.unit}`, activeConfig.name]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={activeConfig.dataKey} 
                      stroke={activeConfig.color} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-800/80 text-slate-400 font-mono">
                <div className="flex items-center gap-4">
                  <span>Click other macro cards above to switch indicator view</span>
                  <button 
                    onClick={() => setSelectedIndicator("Nifty50")} 
                    className={`underline hover:text-white ${selectedIndicator === "Nifty50" ? "text-emerald-400 font-bold" : ""}`}
                  >
                    View Nifty 50 Trend
                  </button>
                </div>
                <span>Data points: {filteredChartHistory.length} trading sessions</span>
              </div>
            </div>

            {/* Institutional Flow Decoupling Chart */}
            <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                      Institutional Absorption: Domestic Structural Revolution (₹ Cr)
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {flowTimeframe === "ALL" ? "2015-2026 (12Y)" : flowTimeframe === "5Y" ? "2022-2026 (5Y)" : "2024-2026 (3Y)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Multi-horizon comparison of Foreign Institutional (FII) vs Domestic Institutional (DII) Net Equity Flows
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setFlowMode("both")}
                      className={`px-2.5 py-1 rounded transition ${
                        flowMode === "both"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      FII vs DII
                    </button>
                    <button
                      onClick={() => setFlowMode("net")}
                      className={`px-2.5 py-1 rounded transition ${
                        flowMode === "net"
                          ? "bg-cyan-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Net Absorption
                    </button>
                  </div>

                  {/* Horizon Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                    {(["3Y", "5Y", "ALL"] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setFlowTimeframe(h)}
                        className={`px-2.5 py-1 rounded transition ${
                          flowTimeframe === h
                            ? "bg-slate-700 text-white font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono hidden sm:block">
                    2026 YTD DII: <span className="font-bold text-emerald-400">+₹3,80,000 Cr</span>
                  </div>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredFlowHistory} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="Year" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")} Cr`]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    {flowMode === "both" ? (
                      <>
                        <Bar dataKey="FII_Net_Equity_Cr" name="FII Net Equity (₹ Cr)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="DII_Net_Equity_Cr" name="DII Net Equity (₹ Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </>
                    ) : (
                      <Bar dataKey="Net_Domestic_Absorption_Cr" name="Net Domestic Absorption Cushion (₹ Cr)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-semibold text-emerald-400 mb-1">Permanent Domestic Bid</div>
                  DII SIP inflows (~?28,000+ Cr/month) have structurally decoupled Indian equities from foreign capital flight.
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-semibold text-cyan-400 mb-1">Sovereign Debt Anchored</div>
                  G-Sec yields at 6.89% (35th percentile) allow top-tier balance sheets to fund growth at low cost of capital.
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-semibold text-amber-400 mb-1">Crude & Capex Posture</div>
                  Crude at $96.66 warrants prioritizing companies with pricing power (Plan A) over commodity-input price takers.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLAN A (MUNGER COMPOUNDERS) */}
        {activeTab === "planA" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Plan A: Quality Moat Compounders (Top {screener.plan_a_top.length} Stocks)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Criteria: 10-Year Average ROCE = 20%, 10-Year Cash Conversion (CFO/PAT) = 70%, Debt = ?300 Cr.
                </p>
              </div>
              <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20 font-medium">
                {screener.plan_a_count} Qualified across NSE
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Avg ROCE</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">Debt (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">CMP (?)</th>
                    <th className="py-2.5 px-3 text-right">P/E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.plan_a_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 font-bold text-emerald-400">{stock.Symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">{stock.Cash_Conv_Pct}%</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-cyan-300">?{stock.Latest_Debt_Cr}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `?${stock.CMP}` : "-"}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{stock.PE || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLAN B (DHANDHO DEEP VALUE) */}
        {activeTab === "planB" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-cyan-400" />
                  Plan B: Pabrai Dhandho Deep Value (Top {screener.plan_b_top.length} Stocks)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Criteria: 10-Year Cash Conversion = 75%, Clean Balance Sheet (Debt = ?150 Cr), ROCE 15% to 35%.
                </p>
              </div>
              <div className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/20 font-medium">
                {screener.plan_b_count} Qualified across NSE
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Avg ROCE</th>
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">Debt (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">CMP (?)</th>
                    <th className="py-2.5 px-3 text-right">P/E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.plan_b_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 font-bold text-cyan-400">{stock.Symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-300">{stock.Cash_Conv_Pct}%</td>
                      <td className="py-2 px-3 text-right text-amber-300 font-bold">{stock.Avg_ROCE_Pct}%</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{stock.Latest_Debt_Cr}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `?${stock.CMP}` : "-"}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{stock.PE || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FORENSIC TRAPS */}
        {activeTab === "traps" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-rose-500/30 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Forensic Disasters & Paper Profit Traps (Top {screener.traps_top.length} Leveraged Traps)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Eliminated at Gate 1 (Excessive Debt) and Gate 5 (Cash Conversion &lt; 30% or Negative Operating Cash).
                </p>
              </div>
              <div className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20 font-medium">
                {screener.traps_count} Disqualified across NSE
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3 text-right">Total Debt (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (? Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (? Cr)</th>
                    <th className="py-2.5 px-3">Forensic Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.traps_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-rose-950/20 transition">
                      <td className="py-2 px-3 font-bold text-rose-400">{stock.Symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-300">?{Math.round(stock.Latest_Debt_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold">{stock.Cash_Conv_Pct}%</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 font-sans text-xs text-rose-300/80">
                        {stock.Latest_Debt_Cr > 5000 ? "Crushing Debt Burden" : "Severe Accrual Mirage / Low CFO"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SEARCH ANY OF 2,566 EQUITIES */}
        {activeTab === "search" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-400" />
                  Instant Forensic Auditor across 2,566 Listed Equities
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type any company name or ticker to inspect 10-year cash conversion, debt solvency, and ROCE
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. INFY, RELIANCE, TATA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            {searchQuery.trim() === "" ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Type a ticker or company name above to view its 10-year audited forensic metrics.
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No company found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                      <th className="py-2.5 px-3">Ticker</th>
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3 text-right">10-Yr Cash Conv</th>
                      <th className="py-2.5 px-3 text-right">10-Yr Avg ROCE</th>
                      <th className="py-2.5 px-3 text-right">Debt (? Cr)</th>
                      <th className="py-2.5 px-3 text-right">10-Yr CFO (? Cr)</th>
                      <th className="py-2.5 px-3 text-right">10-Yr PAT (? Cr)</th>
                      <th className="py-2.5 px-3 text-right">CMP (?)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-bold text-purple-400">{stock.Symbol}</td>
                        <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                        <td className={`py-2 px-3 text-right font-bold ${stock.Cash_Conv_Pct >= 70 ? "text-emerald-400" : stock.Cash_Conv_Pct < 30 ? "text-rose-400" : "text-amber-400"}`}>
                          {stock.Cash_Conv_Pct}%
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${stock.Avg_ROCE_Pct >= 20 ? "text-emerald-400" : "text-slate-300"}`}>
                          {stock.Avg_ROCE_Pct}%
                        </td>
                        <td className={`py-2 px-3 text-right ${stock.Latest_Debt_Cr > 1000 ? "text-rose-400 font-bold" : "text-slate-300"}`}>
                          ?{stock.Latest_Debt_Cr}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-300">?{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `?${stock.CMP}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

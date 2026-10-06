"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Search,
  Flame,
  Award,
  BarChart3,
  Globe2,
  Layers,
  ExternalLink,
  Briefcase,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageSquareQuote,
  BookOpen,
  Calculator,
  Compass,
  XCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
  Pillar_Tag?: string;
  MCap_Cr?: number;
  CMP?: number;
  PE?: number;
  Ex_Cash_PE?: number;
  EV_EBIT?: number;
  FCF_Yield_Pct?: number;
  Avg_ROCE_Pct: number;
  Latest_ROCE_Pct?: number;
  ROIIC_5Y_Pct?: number;
  Reinvest_Rate_5Y_Pct?: number;
  Sales_CAGR?: number;
  Sales_CAGR_5Y?: number;
  PAT_CAGR_10Y?: number;
  PAT_CAGR_5Y?: number;
  Cash_Conv_Pct: number;
  Cash_Conv_3Y_Pct?: number;
  Cum_CFO_Cr: number;
  Cum_PAT_Cr: number;
  Latest_CFO_Cr?: number;
  Latest_PAT_Cr?: number;
  Avg_FCF_3Y_Cr?: number;
  Latest_Debt_Cr: number;
  Net_Cash_Cr?: number;
  DE_Ratio?: number;
  FA_Expansion_5Y?: number;
  Promoter_Pct?: number;
  Intrinsic_Value?: number;
  MoS_Pct?: number;
}

interface AccountSummary {
  client_id: string;
  initial_capital: number;
  settled_cash: number;
  unsettled_sale_receivable_t1: number;
  total_cash_after_t1: number;
  usable_cash_today_80pct: number;
  live_equity_value: number;
  total_account_equity: number;
  realized_pnl_since_inception: number;
  unrealized_pnl_open: number;
}

interface DisqualifiedExit {
  Symbol: string;
  Qty_Sold: number;
  Exit_Price?: number;
  Order_No?: string;
  Exit_Date: string;
  Reason: string;
}

interface ShoonyaStock {
  Symbol: string;
  Name: string;
  Strategy: string;
  Horizon: string;
  Allocation_Pct: number;
  Quantity?: number;
  Recommended_Add_Qty?: number;
  Target_Total_Qty?: number;
  Order_No?: string;
  Product?: string;
  Entry_Price: number;
  Invested_Value?: number;
  CMP: number;
  Current_Value?: number;
  Unrealized_PnL?: number;
  Target_Price: number;
  Intrinsic_Value?: number;
  MoS_Pct?: number;
  Stop_Loss: number;
  PE: number;
  Ex_Cash_PE?: number;
  Avg_ROCE_Pct: number;
  ROIIC_5Y_Pct?: number;
  Reinvest_Rate_5Y_Pct?: number;
  PAT_CAGR_5Y_Pct?: number;
  Cash_Conv_Pct: number;
  Cash_Conv_3Y_Pct?: number;
  Latest_Debt_Cr: number;
  Net_Cash_Cr?: number;
  Cum_CFO_Cr: number;
  Cum_PAT_Cr: number;
  Moat_Rating: string;
  Forensic_Status: string;
  Thesis_Summary: string;
  Pillar_1_Business_Model: string;
  Pillar_2_Financial_Moat: string;
  Pillar_3_Qualitative_Scuttlebutt: string;
  Pillar_4_Macro_Risks: string;
  Trigger_Source: string;
  ValuePickr_Scuttlebutt?: {
    topic_id: number;
    topic_title: string;
    thread_url: string;
    posts: Array<{
      author: string;
      date: string;
      post_number?: number;
      text: string;
      url?: string;
    }>;
  };
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
  const [portfolio, setPortfolio] = useState<ShoonyaStock[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [disqualifiedExits, setDisqualifiedExits] = useState<DisqualifiedExit[]>([]);
  const [portfolioUpdated, setPortfolioUpdated] = useState<string>("");
  const [expandedStock, setExpandedStock] = useState<string | null>("SHARDAMOTR");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shoonya" | "knowledge" | "planA" | "planB" | "macro" | "traps" | "search">("shoonya");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<"Brent" | "US10Y" | "IndiaGSec" | "USDINR" | "DXY" | "Nifty50">("Brent");
  const [timeframe, setTimeframe] = useState<"1M" | "6M" | "1Y" | "ALL">("1Y");
  const [flowTimeframe, setFlowTimeframe] = useState<"3Y" | "5Y" | "ALL">("ALL");
  const [flowMode, setFlowMode] = useState<"both" | "net">("both");

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/quant-dashboard" : "";
        const ts = Date.now();
        const [macroRes, screenerRes, portRes] = await Promise.all([
          fetch(`${basePath}/data/macro_pulse.json?t=${ts}`, { cache: "no-store" }),
          fetch(`${basePath}/data/forensic_screener.json?t=${ts}`, { cache: "no-store" }),
          fetch(`${basePath}/data/shoonya_portfolio.json?t=${ts}`, { cache: "no-store" }).catch(() => null)
        ]);
        if (macroRes.ok) {
          const m = await macroRes.json();
          setMacro(m);
        }
        if (screenerRes.ok) {
          const s = await screenerRes.json();
          setScreener(s);
        }
        if (portRes && portRes.ok) {
          const p = await portRes.json();
          setPortfolio(p.portfolio || []);
          setAccountSummary(p.account_summary || null);
          setDisqualifiedExits(p.disqualified_exits || []);
          setPortfolioUpdated(p.last_updated || "");
        }
      } catch (err) {
        console.error("Failed loading data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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
    const list = macro.fii_dii_history.map(item => {
      const fii = Number(item.FII_Net_Equity_Cr || 0);
      const dii = Number(item.DII_Net_Equity_Cr || 0);
      return {
        ...item,
        FII_Net_Equity_Cr: fii,
        DII_Net_Equity_Cr: dii,
        Net_Domestic_Absorption_Cr: dii - Math.abs(fii < 0 ? fii : 0)
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
                <h1 className="text-lg font-bold tracking-tight text-white">BUFFETT–MUNGER & PABRAI TERMINAL</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 Authentic
                </span>
              </div>
              <p className="text-xs text-slate-400">10-Year Incremental ROIC (ROIIC), Reinvestment Runway & Intrinsic Value Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {screener?.total_audited_equities?.toLocaleString() || "1,902"} NSE 10-Yr Audits
            </span>
            <span className="hidden sm:inline-block text-slate-400 font-mono">
              Synced: {portfolioUpdated || "2026-10-06"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("shoonya")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "shoonya"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" /> Shoonya Portfolio & Finalists ({portfolio.length})
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "knowledge"
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold"
                : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Knowledge Store & Metrics Guide
          </button>

          <button
            onClick={() => setActiveTab("planA")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "planA"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" /> Pillar 1: Buffett–Munger ({screener?.plan_a_count})
          </button>

          <button
            onClick={() => setActiveTab("planB")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "planB"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" /> Pillar 2A/2B: Pabrai Spawners & Dhandho ({screener?.plan_b_count})
          </button>

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

          {/* Archival Dropdown for Forensic Traps & All Equities Search */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "traps" || activeTab === "search"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <span>More Screeners</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {moreMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 font-sans"
                onMouseLeave={() => setMoreMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setActiveTab("traps");
                    setMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    activeTab === "traps" ? "bg-rose-500/20 text-rose-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-rose-300">Disqualified Cows & Traps ({screener?.traps_count})</div>
                    <div className="text-[10px] text-slate-400">Optical ROCE dividend cows & subsidy traps</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("search");
                    setMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    activeTab === "search" ? "bg-purple-500/20 text-purple-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Search className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-purple-300">Search All 1,902 Audited Equities</div>
                    <div className="text-[10px] text-slate-400">Inspect ROIIC, Reinvest %, IV & MoS for any stock</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            TAB: KNOWLEDGE STORE & METRICS REFERENCE GUIDE
           ===================================================================== */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            {/* Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-950/30 via-[#0c1424] to-[#080d17] border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Knowledge Store: Plain-English Guide to Our Core Metrics & Investment Charter
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Permanent reference guide explaining every number in our scanner (`Ex-Cash P/E`, `ROCE`, `Reinvest %`, `ROIIC`, `IV & MoS`) using real NSE examples.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
                  Live Verified Benchmark: SHARDAMOTR @ ₹924.00
                </span>
              </div>

              {/* Quick Example Pill Bar */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <span className="text-slate-400 font-sans font-semibold">How to read a live-verified scanner summary line:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">12.7x Ex-Cash P/E</span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">34.5% Live ROCE</span>
                  <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">67% Reinvest</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">89.6% ROIIC</span>
                  <span className="px-2.5 py-1 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">IV: ₹1,809 (+49% MoS)</span>
                </div>
              </div>
            </div>

            {/* 6 Core Metrics Glossary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Ex-Cash P/E */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold">
                    1. 12.7x Ex-Cash P/E
                  </span>
                  <span className="text-xs text-slate-400 font-mono">True Price of the Business</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  How many years of profit you are paying for the business (after subtracting its bank balance)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>The Shop Analogy:</strong> Suppose you buy a shop for ₹10 Lakhs, and inside the shop&apos;s safe there is ₹2 Lakhs in debt-free cash that belongs to you the moment you buy it. Your <strong>true cost</strong> for the shop itself is ₹8 Lakhs. If the shop earns ₹63,000 a year in profit, you are really paying <strong>12.7x</strong> (`₹8L / ₹63k`) for the operating business.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
                  Formula: (Live Market Cap - Net Cash) ÷ Annual Net Profit (PAT)
                </div>
                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300">
                  <strong className="text-cyan-400">In SHARDAMOTR (₹924):</strong> Live Market Cap is <code className="text-white">₹5,304 Cr</code>. It holds <code className="text-emerald-400">₹1,087 Cr Net Cash</code> (`20.5%` of Market Cap!). So you pay <code className="text-white">₹4,217 Cr</code> for a business earning <code className="text-white">₹332 Cr/yr</code> = <strong>12.7x Ex-Cash P/E</strong> (Similarly, <code className="text-emerald-400">ZENSARTECH</code> has <code className="text-emerald-400">₹1,842 Cr Net Cash</code> and trades at <strong>10.7x Ex-Cash P/E</strong>).
                </div>
              </div>

              {/* Card 2: 10Y Median & Live ROCE */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                    2. 34.5% Live ROCE (30% 10Y Med)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Existing Engine Profitability</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  How much annual operating profit the business generates per ₹100 of capital tied up inside it
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Meaning:</strong> Return on Capital Employed measures the quality of the business moat. We check <strong>BOTH</strong> the <strong>10-Year Median ROCE</strong> AND today&apos;s <strong>Live ROCE</strong> so a company whose recent returns are falling (<code className="text-rose-400">CMSINFO</code> dropped from 30% to 17.9% ROCE) is immediately caught and disqualified.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-amber-300">
                  Formula: Operating Profit (EBIT) ÷ (Total Equity + Total Debt) ≥ 20%
                </div>
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-slate-300">
                  <strong className="text-amber-400">In Our Finalists:</strong> <code className="text-emerald-400">CAMS</code> earns <strong>47.0% Live ROCE</strong>, <code className="text-emerald-400">MPSLTD</code> earns <strong>38.7% Live ROCE</strong>, <code className="text-emerald-400">SHARDAMOTR</code> earns <strong>34.5% Live ROCE</strong>, and <code className="text-emerald-400">LTM</code> earns <strong>29.6% Live ROCE</strong>.
                </div>
              </div>

              {/* Card 3: 5Y Reinvestment Rate */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold">
                    3. 67% Reinvest (5-Yr Retention)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Fuel Ploughed Back Into Growth</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Out of every ₹100 of profit earned, how much is kept inside the business to build new capacity?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why It Exposes &quot;Dividend Cow&quot; Traps:</strong> A company can boast a 60%–80% ROCE on an old factory built 20 years ago, but if its market is saturated and it has nowhere left to grow, it pays out 95%–100%+ of profits as dividends (<code className="text-rose-400">CASTROLIND</code> reinvested only <strong>5%</strong>; <code className="text-rose-400">ACCELYA</code> reinvested <strong>0%</strong>). Without reinvestment, earnings stagnate.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-purple-300">
                  Formula: 100% - 5-Year Average Dividend Payout % (or ΔNet Worth ÷ ∑5Y PAT)
                </div>
                <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300">
                  <strong className="text-purple-400">In SHARDAMOTR & ZENSARTECH:</strong> <code className="text-emerald-400">SHARDAMOTR</code> retains <strong>67.0%</strong> of profits (expanding Fixed Assets + CWIP <strong>1.81x</strong> with zero net debt), and <code className="text-emerald-400">ZENSARTECH</code> retains <strong>65.2%</strong>.
                </div>
              </div>

              {/* Card 4: 5Y & 3Y ROIIC */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                    4. 89.6% ROIIC (Incremental ROIC)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Charlie Munger&apos;s #1 Metric</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  How much NEW annual profit was generated by every NEW ₹100 reinvested over the last 5 & 3 years?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Meaning:</strong> Legacy ROCE tells you about the past; <strong>ROIIC (Return on Incremental Invested Capital)</strong> tells you about the future. We require both <strong>5Y ROIIC ≥ 18%</strong> AND positive <strong>3Y ROIIC ≥ 10%</strong> with <strong>zero recent peak-profit breakdown</strong> so recent capex drags are caught automatically.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-300">
                  Formula: ΔOperating Profit (EBIT) ÷ ΔInvested Capital (5Y & 3Y Windows)
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300">
                  <strong className="text-emerald-400">In MPSLTD, LTM & CAMS:</strong> <code className="text-emerald-400">CAMS</code> earns <strong>71.7% (5Y) / 40.6% (3Y) ROIIC</strong>, <code className="text-emerald-400">MPSLTD</code> earns <strong>63.7% (5Y) / 40.8% (3Y) ROIIC</strong>, and <code className="text-emerald-400">LTM</code> earns <strong>55.8% (5Y) / 16.8% (3Y) ROIIC</strong>.
                </div>
              </div>

              {/* Card 5: Intrinsic Value & Margin of Safety */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono text-xs font-bold">
                    5. IV: ₹1,809 (+49% MoS)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Worth vs. Live Market Price</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  What the business is conservatively worth (IV) and our percentage discount cushion (Margin of Safety)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Meaning:</strong> Instead of buying because a stock crossed a 200-day moving average, we calculate its conservative <strong>Intrinsic Value (IV)</strong> from its Owner Earnings (cash profits) plus Net Cash in the bank, divided by the <strong>live post-bonus/split Market Cap</strong> from Screener.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-teal-300">
                  Margin of Safety (MoS %) = (Intrinsic Value - Current Price) ÷ Intrinsic Value
                </div>
                <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-xs text-slate-300">
                  <strong className="text-teal-400">In SHARDAMOTR & ZENSARTECH:</strong> <code className="text-emerald-400">SHARDAMOTR</code> has an Intrinsic Value of <strong>₹1,809/share</strong> vs live price <strong>₹924</strong> (<strong>+48.9% MoS</strong>). <code className="text-emerald-400">ZENSARTECH</code> has an IV of <strong>₹647/share</strong> vs live price <strong>₹447</strong> (<strong>+31.0% MoS</strong>).
                </div>
              </div>

              {/* Card 6: 10Y & 3Y Cash Conversion */}
              <div className="p-5 rounded-xl bg-[#0c121e] border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-xs font-bold">
                    6. 101% (3Y) Cash Conv + Q1 YoY Growth
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Real Cash & Live Momentum</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Are reported accounting profits turning into hard cash AND growing in the latest FY26 / Jun 2026 quarter?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why We Check Both Cash Conversion AND Live FY26/Q1 Trajectory:</strong> Checking both 10Y & 3Y CFO/PAT catches subsidy traps (<code className="text-rose-400">CHAMBLFERT</code> dropped to 7% CFO/PAT in FY26), while checking live Consolidated & Standalone FY26 + Jun 2026 quarterly results catches companies whose recent profits rolled over (<code className="text-rose-400">CMSINFO</code> & <code className="text-rose-400">DHANUKA</code>).
                </p>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-blue-300">
                  Gates: 10Y & 3Y CFO/PAT ≥ 75% | 3Y Peak PAT Drawdown ≥ -6% | Q1 PAT YoY ≥ -15%
                </div>
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300">
                  <strong className="text-blue-400">In Our 5 Finalists:</strong> 3-Yr Cash Conversion is <strong>102.4% (`CAMS`)</strong>, <strong>101.6% (`LTM`)</strong>, <strong>101.2% (`SHARDAMOTR`)</strong>, <strong>89.9% (`ZENSARTECH`)</strong>, and <strong>81.6% (`MPSLTD`)</strong>.
                </div>
              </div>
            </div>

            {/* Section 2: The Master Compounding Law */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#0c121e] to-[#0c121e] border border-emerald-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Live Forensic Comparison: Verified Compounders vs. Disqualified Traps
                  </h3>
                </div>
                <span className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                  Intrinsic Growth Rate ≈ Reinvestment Rate × ROIIC
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Compare our 5 live-verified finalists against the 4 stocks we exited and the 2 candidates (<code className="text-rose-400">CMSINFO</code>, <code className="text-rose-400">DHANUKA</code>) our upgraded live Screener audit blocked before purchase:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/70 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3 text-right">Live ROCE</th>
                      <th className="py-2.5 px-3 text-right">5Y Reinvest %</th>
                      <th className="py-2.5 px-3 text-right">5Y / 3Y ROIIC</th>
                      <th className="py-2.5 px-3 text-right">Peak PAT Drop</th>
                      <th className="py-2.5 px-3 text-right">Live Ex-Cash P/E</th>
                      <th className="py-2.5 px-3">Live Forensic Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="bg-emerald-950/15">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">CAMS (Live Held)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">47.0%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300">35.0%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">71.7% / 40.6%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">0.0% (All-Time High)</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">34.4x</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">PASS: 68% MF RTA Monopoly; PAT ₹351→₹465→₹472→₹491 Cr; Q1 PAT +17.6% YoY</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">LTM (Finalist)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">29.6%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300">49.3%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">55.8% / 16.8%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">0.0% (All-Time High)</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">20.7x</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">PASS: L&T Tier-1 IT Compounder; ₹10,258 Cr Net Cash; Q1 PAT +17.1% YoY (+18% MoS)</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">MPSLTD (Finalist)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">38.7%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300">33.8%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">63.7% / 40.8%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">0.0% (All-Time High)</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">24.4x</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">PASS: 3.75x Asset Expansion; PAT ₹119→₹149→₹173→₹188 Cr; Q1 PAT +42.9% YoY</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">SHARDAMOTR (Finalist)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">34.5%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300 font-bold">67.0%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">89.6% / 10.7%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">-3.8% (EBIT Record)</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">12.7x</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">PASS: Triple-Crown (P1+2A+2B); ₹1,087 Cr Net Cash (20.5% MCap); Q1 Sales +33.7% YoY</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">ZENSARTECH (Finalist)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">22.8%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300 font-bold">65.2%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">34.3% / 7.2%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">0.0% (All-Time High)</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">10.7x</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">PASS: Pillar 2B Dhandho; ₹1,842 Cr Net Cash (18.1% MCap); PAT at record ₹776 Cr TTM</td>
                    </tr>
                    <tr className="bg-rose-950/15">
                      <td className="py-2.5 px-3 font-bold text-rose-400">CMSINFO (Blocked)</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">17.9% (Fell)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">74.7%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">26.4% / -61.5%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-21.2% Drop</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">10.8x</td>
                      <td className="py-2.5 px-3 font-sans text-rose-300">BLOCKED PRE-BUY: PAT peaked at ₹372 Cr (FY25) and fell to ₹303 Cr (FY26) & ₹293 Cr (TTM)</td>
                    </tr>
                    <tr className="bg-rose-950/15">
                      <td className="py-2.5 px-3 font-bold text-rose-400">DHANUKA (Blocked)</td>
                      <td className="py-2.5 px-3 text-right text-amber-300">23.8%</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">79.4%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">23.2% / 2.2%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-9.8% (Q1 -35.7%)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">14.6x</td>
                      <td className="py-2.5 px-3 font-sans text-rose-300">BLOCKED PRE-BUY: Consolidated froze at FY25; live Standalone PAT fell & Q1 plunged -35.7% YoY</td>
                    </tr>
                    <tr className="bg-rose-950/15">
                      <td className="py-2.5 px-3 font-bold text-rose-400">CASTROLIND (Exited)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">79.0% (Optical)</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">5.0%</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">Low</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">+4.3% CAGR</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">17.1x</td>
                      <td className="py-2.5 px-3 font-sans text-rose-300">EXITED: Pays out 95% as dividends because legacy lubricant market is stagnant</td>
                    </tr>
                    <tr className="bg-rose-950/15">
                      <td className="py-2.5 px-3 font-bold text-rose-400">ACCELYA (Exited)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">56.5% (Optical)</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">0.0%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">1.2%</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-1.8% CAGR</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">17.6x</td>
                      <td className="py-2.5 px-3 font-sans text-rose-300">EXITED: Foreign PE parent extracts 107% of earnings; Fixed Assets shrank 56%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Two-Pillar Architecture Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#0c121e] border border-amber-500/30 space-y-2.5">
                <div className="text-xs font-mono text-amber-400 font-bold uppercase">Pillar 1 (~60% Allocation)</div>
                <h4 className="text-sm font-bold text-white">Buffett–Munger Reinvestment Compounders & Toll Bridges</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>10Y Median ROCE ≥ <strong>20%</strong> & Latest ROCE ≥ <strong>18%</strong></li>
                  <li>5Y Incremental Return (ROIIC) ≥ <strong>18%</strong></li>
                  <li>5Y Reinvestment Rate ≥ <strong>35%</strong> (or Capital-Light Toll Bridge like <code>CAMS</code>)</li>
                  <li>COVID-Adjusted 5Y PAT CAGR ≥ <strong>11%</strong> & 10Y Sales CAGR ≥ <strong>8%</strong></li>
                  <li>10Y Cash Conv ≥ <strong>75%</strong> & 3Y Cash Conv ≥ <strong>70%</strong></li>
                  <li>Debt/Equity ≤ <strong>0.25x</strong> & Ex-Cash P/E ≤ <strong>38x</strong></li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0c121e] border border-cyan-500/30 space-y-2.5">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">Pillar 2A (~20% Allocation)</div>
                <h4 className="text-sm font-bold text-white">Mohnish Pabrai &quot;Spawners&quot; (Multi-Bagger Engine)</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>Owner-Operated: Promoter Holding ≥ <strong>45%</strong> with <strong>0% Pledge</strong></li>
                  <li>Aggressive Ploughback: 5Y Earnings Retention ≥ <strong>65%</strong> (Div Payout ≤ 30%)</li>
                  <li>Physical Capacity Expansion: 5Y Gross Block Growth ≥ <strong>1.40x</strong></li>
                  <li>10Y Median ROCE ≥ <strong>16%</strong> & 10Y PAT CAGR ≥ <strong>12%</strong></li>
                  <li>Self-Funded Capex: 3Y Avg FCF &gt; 0 & Debt/Equity ≤ <strong>0.30x</strong></li>
                  <li>Entry Multiple: Ex-Cash P/E ≤ <strong>22.0x</strong></li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0c121e] border border-emerald-500/30 space-y-2.5">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase">Pillar 2B (~20% Allocation)</div>
                <h4 className="text-sm font-bold text-white">Classic &quot;Dhandho&quot; Extreme Mispricing</h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li><em>&quot;Heads I win big; tails I don&apos;t lose much&quot;</em></li>
                  <li>Deep Value Multiple: Ex-Cash P/E ≤ <strong>13.5x</strong></li>
                  <li>High Cash Yield: 3Y Avg Free Cash Flow Yield ≥ <strong>5.5%</strong></li>
                  <li>Hard Balance Sheet Floor: Debt/Equity ≤ <strong>0.15x</strong> + Net Cash cushion</li>
                  <li>10Y & 3Y Cash Conversion ≥ <strong>75%</strong> & 10Y PAT CAGR ≥ <strong>8%</strong></li>
                  <li><strong>Zero Government-Subsidy Captives</strong> (no urea/discoms)</li>
                </ul>
              </div>
            </div>

            {/* Section 4: Comparison of Our 6-Stage All-India Engine vs. World-Class Quant Funds */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/30 via-[#0c121e] to-[#0c121e] border border-cyan-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    1. How Our 6-Stage All-India (`5,865`-Stock) Engine Compares to World-Class Quant Funds
                  </h3>
                </div>
                <span className="px-3 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold">
                  AQR QMJ Factor + AI/EV Moat + Forum Scuttlebutt
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Why we rejected short-horizon intraday bots (our 144-session, 139,888-candle 5-minute backtest proved a losing <code className="text-rose-400">0.65 Profit Factor</code> after STT/slippage) and built a <strong>Hybrid Quantitative-Fundamental + Scuttlebutt Engine</strong> across all <strong>5,865 NSE + BSE companies</strong> (`5,105` verified financial dossiers):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/70 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Dimension</th>
                      <th className="py-2.5 px-3">HFT / Stat-Arb Quants (Renaissance, Citadel)</th>
                      <th className="py-2.5 px-3">Global Factor Quants (AQR QMJ, Greenblatt)</th>
                      <th className="py-2.5 px-3">Indian Quant MFs (Quant AMC, DSP Quant)</th>
                      <th className="py-2.5 px-3 text-emerald-400">Our 6-Stage All-India Hybrid Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-200 font-mono">Holding Horizon</td>
                      <td className="py-2.5 px-3 text-slate-400">Milliseconds to 3–5 Days</td>
                      <td className="py-2.5 px-3 text-slate-300">6 Months to 3 Years</td>
                      <td className="py-2.5 px-3 text-slate-300">1 Month to 12 Months</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">3 to 10+ Years (Zero-Brokerage CNC Compounding)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-200 font-mono">Primary Alpha Source</td>
                      <td className="py-2.5 px-3 text-slate-400">Order-book latency, options gamma, stat-arb</td>
                      <td className="py-2.5 px-3 text-slate-300">Multi-factor sort (`ROCE`, `EV/EBIT`, `Low Accruals`)</td>
                      <td className="py-2.5 px-3 text-slate-300">3M Price Momentum + EPS Revisions + Liquidity</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">10Y Forensics (`ROCE + ROIIC + CFO/PAT`) + AI/EV Moat + 6 Momentum Precursors</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-200 font-mono">AI & EV Disruption Awareness</td>
                      <td className="py-2.5 px-3 text-slate-400">Irrelevant (exits in minutes)</td>
                      <td className="py-2.5 px-3 text-rose-300"><strong>BLIND (Rearview Trap):</strong> Buys headcount IT & ICE auto parts on trailing 5Y ROCE</td>
                      <td className="py-2.5 px-3 text-rose-300"><strong>BLIND:</strong> Chases short-term momentum regardless of terminal risk</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold"><strong>Stage 4 Built-In:</strong> Eliminates headcount IT (`INFY`, `LTM`) & ICE exhaust (`SHARDAMOTR`)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-200 font-mono">Governance & Forum Gossip</td>
                      <td className="py-2.5 px-3 text-slate-400">None</td>
                      <td className="py-2.5 px-3 text-rose-300"><strong>BLIND:</strong> Misses related-party siphoning until write-offs years later</td>
                      <td className="py-2.5 px-3 text-rose-300"><strong>BLIND</strong></td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold"><strong>Stage 5 Built-In:</strong> Google News RSS + ValuePickr 25-post scanner (caught `BLS` Post #473)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-200 font-mono">Liquidity & Size Edge</td>
                      <td className="py-2.5 px-3 text-slate-400">Capped at $10B; liquid futures only</td>
                      <td className="py-2.5 px-3 text-slate-300">$500M+ AUM; restricted to Top 200 mega-caps</td>
                      <td className="py-2.5 px-3 text-slate-300">₹2,000+ Cr AUM; 2–4% impact cost in mid-caps</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold"><strong>Family-Office Edge:</strong> Zero impact cost in ₹3,000–₹18,000 Cr monopolies (`CAMS`, `ICRA`, `NESCO`, `SJS`)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: The 6 Momentum Precursors Engine (Parameters, Logic & Live Scorecard) */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/30 via-[#0c121e] to-[#0c121e] border border-amber-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    2. The 6 Momentum Precursors Engine — Parameters, Mathematical Logic & Live Inflection Scorecard
                  </h3>
                </div>
                <span className="px-3 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                  Leading Indicators (1–3 Quarters Before Breakout)
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Lagging Momentum</strong> buys a stock <em>after</em> it is already up +80% to +150%. <strong>Momentum Precursors</strong> are the 6 measurable balance-sheet, quarterly earnings-acceleration (PEAD), institutional stealth-accumulation, and Stage-2 base triggers that fire <strong>before or right as a multi-quarter breakout begins</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-amber-300">P1: Capex Commissioning</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">20 Pts</span>
                  </div>
                  <p className="text-slate-300">Multi-year plant expansion (`CWIP → Fixed Assets`) crosses 60% utilization; fixed depreciation is absorbed, unleashing operating leverage.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-amber-300">FA_Expansion_5Y &gt;= 1.40x &amp; D/E &lt;= 0.35x</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-emerald-300">P2: Earnings Accel (PEAD)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">20 Pts</span>
                  </div>
                  <p className="text-slate-300">Latest Quarterly YoY PAT growth accelerates above the 5-year historical CAGR; institutional analysts upgrade estimates over 3–4 quarters.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-emerald-300">Q_PAT_YoY &gt;= +20% &amp; &gt; PAT_CAGR_5Y</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-300">P3: OPM Margin Expansion</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">20 Pts</span>
                  </div>
                  <p className="text-slate-300">Quarterly Net Profit grows faster than Quarterly Sales—proving unit pricing power and expanding operating margins right now.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300">Q_PAT_YoY &gt; Q_Sales_YoY (&gt;= +15% / +10%)</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-purple-300">P4: Stealth Inst Buying</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">15 Pts</span>
                  </div>
                  <p className="text-slate-300">Mutual Funds (`DIIs`) and `FIIs` quietly absorb shares over 2–4 quarters during sideways consolidation, shrinking the retail free float.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-purple-300">1Y Inst Chg &gt;= +0.5% or DII Chg &gt;= +1.0%</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-blue-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-blue-300">P5: Cash-Flow Velocity</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">10 Pts</span>
                  </div>
                  <p className="text-slate-300">3-Year Operating Cash Conversion (`CFO/PAT`) jumps above the 10-Year average, signaling faster customer collections &amp; order advances.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-blue-300">Cash_Conv_3Y &gt;= Cash_Conv_10Y &amp; &gt;= 80%</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-teal-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-teal-300">P6: Overhead Clearance</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300">15 Pts</span>
                  </div>
                  <p className="text-slate-300">Trading above 50-DMA &amp; 200-DMA or consolidating within -2% to -22% of 52W High—meaning zero trapped bagholders waiting to sell.</p>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-teal-300">CMP &gt;= 50 &amp; 200 DMA or -22% &lt;= 52W &lt;= -2%</div>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/70 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Action Tier</th>
                      <th className="py-2.5 px-3 text-center">Precursors</th>
                      <th className="py-2.5 px-3 text-right">Ex-Cash P/E</th>
                      <th className="py-2.5 px-3 text-right">5Y Capex (P1)</th>
                      <th className="py-2.5 px-3 text-right">Latest Qtr Sales / PAT YoY (P2 &amp; P3)</th>
                      <th className="py-2.5 px-3 text-right">1Y Inst Buying (P4)</th>
                      <th className="py-2.5 px-3">Momentum Inflection Catalyst</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="bg-emerald-950/15">
                      <td className="py-2 px-3 font-bold text-emerald-400">TRAVELFOOD</td>
                      <td className="py-2 px-3 text-emerald-300">Tier 1 (Buy Now)</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">5 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300">30.7x</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">3.82x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+20.5% / +35.8%</td>
                      <td className="py-2 px-3 text-right text-purple-300">+1.99% DII</td>
                      <td className="py-2 px-3 font-sans text-slate-300">Airport lounge monopoly; 3.82x gross-block expansion driving +35.8% Qtr PAT</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2 px-3 font-bold text-emerald-400">SJS</td>
                      <td className="py-2 px-3 text-emerald-300">Core Buy Now</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">5 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300">29.2x</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">1.95x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+24.3% / +111.4%</td>
                      <td className="py-2 px-3 text-right text-purple-300 font-bold">+5.69% DII</td>
                      <td className="py-2 px-3 font-sans text-slate-300">EV-agnostic auto/appliance dials; +111.4% Qtr PAT + aggressive Mutual Fund buying</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2 px-3 font-bold text-emerald-400">CARERATING</td>
                      <td className="py-2 px-3 text-emerald-300">Tier 1 (Buy Now)</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">5 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300">26.2x</td>
                      <td className="py-2 px-3 text-right text-emerald-400">1.44x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+19.1% / +26.9%</td>
                      <td className="py-2 px-3 text-right text-purple-300">+1.82% DII</td>
                      <td className="py-2 px-3 font-sans text-slate-300">Ratings duopoly; 55% Inst held, +26.9% Qtr PAT acceleration, -13.6% off 52W High</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2 px-3 font-bold text-emerald-400">MAYURUNIQ</td>
                      <td className="py-2 px-3 text-emerald-300">Tier 1 (Buy Now)</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">4 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300 font-bold">14.6x</td>
                      <td className="py-2 px-3 text-right text-slate-400">1.03x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+24.5% / +36.6%</td>
                      <td className="py-2 px-3 text-right text-purple-300">+0.93% FII</td>
                      <td className="py-2 px-3 font-sans text-slate-300">BMW/Mercedes export ramp; broke above 50 &amp; 200 DMA (+6.8% 1M) at 14.6x Ex-Cash P/E</td>
                    </tr>
                    <tr className="bg-emerald-950/15">
                      <td className="py-2 px-3 font-bold text-emerald-400">CAMS</td>
                      <td className="py-2 px-3 text-emerald-300">Tier 1 (Buy Now)</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">4 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300">34.4x</td>
                      <td className="py-2 px-3 text-right text-emerald-400">1.74x</td>
                      <td className="py-2 px-3 text-right text-emerald-300">+11.6% / +17.6%</td>
                      <td className="py-2 px-3 text-right text-purple-300 font-bold">+6.23% DII</td>
                      <td className="py-2 px-3 font-sans text-slate-300">68% MF RTA Toll-Bridge; +6.23% DII absorption + 102% 3Y CFO conversion</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-cyan-300">VGUARD</td>
                      <td className="py-2 px-3 text-cyan-300">Watchlist Tier B</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-400">6 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300">36.1x</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">3.96x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+23.5% / +75.7%</td>
                      <td className="py-2 px-3 text-right text-purple-300">+1.09% Inst</td>
                      <td className="py-2 px-3 font-sans text-slate-300">All 6/6 precursors firing: 3.96x capex commissioning + +75.7% Qtr PAT jump</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-cyan-300">GALAXYSURF</td>
                      <td className="py-2 px-3 text-cyan-300">Watchlist Tier B</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">5 / 6</td>
                      <td className="py-2 px-3 text-right text-cyan-300 font-bold">23.8x</td>
                      <td className="py-2 px-3 text-right text-emerald-400">1.62x</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">+39.4% / +110.1%</td>
                      <td className="py-2 px-3 text-right text-purple-300">+0.33% Inst</td>
                      <td className="py-2 px-3 font-sans text-slate-300">Specialty surfactants inflection: +110.1% Qtr PAT growth within -8% of 52W High</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 0: SHOONYA ACTIVE INVESTMENTS & AUDITED CONVICTION DOSSIERS
           ===================================================================== */}
        {activeTab === "shoonya" && (
          <div className="space-y-6">
            {/* Header & Live Account Reconciliation Banner */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#0c1524] to-[#080d17] border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Shoonya Live Account (`FN237119`) & 8-Pillar Audited 5-Stock Conviction Portfolio
                    </h2>
                    <p className="text-xs text-slate-400">
                      100% CNC Delivery • Zero Mechanical Stop-Losses • Vetted across 10-Yr ROIIC, Reinvestment Runway & 8-Pillar Scuttlebutt
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab("knowledge")}
                    className="px-3 py-1.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-sans font-semibold transition flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> What do ROIIC / Ex-Cash P/E / MoS mean?
                  </button>
                </div>
              </div>

              {/* Account Cash & Equity Reconciliation Ribbon */}
              {accountSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Account Equity</div>
                    <div className="text-base font-bold text-white font-mono">
                      ₹{accountSummary.total_account_equity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Initial Capital: ₹{accountSummary.initial_capital.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Cash Pool (Incl. T+1)</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      ₹{accountSummary.total_cash_after_t1.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Usable Today: ₹{accountSummary.usable_cash_today_80pct.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Live Stock Holding (CAMS)</div>
                    <div className="text-base font-bold text-cyan-300 font-mono">
                      ₹{accountSummary.live_equity_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-rose-400 mt-0.5 font-mono">
                      Unrealized: ₹{accountSummary.unrealized_pnl_open.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Realized P&L (4 Exits)</div>
                    <div className="text-base font-bold text-amber-300 font-mono">
                      ₹{accountSummary.realized_pnl_since_inception.toFixed(2)} (-0.91%)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Cleaned 4 false-positive traps
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[11px] text-slate-400">5-Stock Portfolio Avg Metrics</div>
                    <div className="text-base font-bold text-emerald-300 font-mono">
                      33% ROCE / 57% ROIIC
                    </div>
                    <div className="text-[10px] text-teal-300 mt-0.5 font-mono">
                      Avg Ex-Cash P/E: 17.6x
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Holdings & Finalist Watchlist Table with Expandable Thesis Drawer */}
            <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Live Holding & 8-Pillar Audited Conviction Portfolio (Click any row to view full 4-Pillar Dossier)
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  1 Live Holding (`CAMS`) + 4 Audited Finalists Ready for Deployment
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Status / Qty</th>
                      <th className="py-2.5 px-3">Pillar Engine</th>
                      <th className="py-2.5 px-3 text-right">CMP (₹)</th>
                      <th className="py-2.5 px-3 text-right">Ex-Cash P/E</th>
                      <th className="py-2.5 px-3 text-right">10Y ROCE</th>
                      <th className="py-2.5 px-3 text-right">5Y ROIIC</th>
                      <th className="py-2.5 px-3 text-right">5Y Reinvest</th>
                      <th className="py-2.5 px-3 text-right">Intrinsic Value (MoS)</th>
                      <th className="py-2.5 px-3 text-center">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {portfolio.map((stock) => {
                      const isExpanded = expandedStock === stock.Symbol;
                      const isLive = (stock.Quantity || 0) > 0;
                      return (
                        <React.Fragment key={stock.Symbol}>
                          <tr 
                            onClick={() => setExpandedStock(isExpanded ? null : stock.Symbol)}
                            className={`cursor-pointer transition ${isExpanded ? "bg-slate-800/60" : "hover:bg-slate-800/40"}`}
                          >
                            <td className="py-3 px-3 font-bold text-emerald-400 flex items-center gap-1.5">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                              <div>
                                <span>{stock.Symbol}</span>
                                <div className="text-[10px] text-slate-400 font-sans font-normal">{stock.Name}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {isLive ? (
                                <div>
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    LIVE: {stock.Quantity} Qty
                                  </span>
                                  {stock.Recommended_Add_Qty ? (
                                    <div className="text-[10px] text-cyan-300 mt-0.5">+{stock.Recommended_Add_Qty} Qty Add Proposed</div>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                                  PROPOSED: {stock.Recommended_Add_Qty} Qty
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-sans ${
                                stock.Strategy.includes("Pillar 1")
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                  : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              }`}>
                                {stock.Strategy}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-white">₹{stock.CMP.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-bold text-cyan-300">{stock.Ex_Cash_PE || stock.PE}x</td>
                            <td className="py-3 px-3 text-right font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400">{stock.ROIIC_5Y_Pct || "-"}%</td>
                            <td className="py-3 px-3 text-right text-purple-300">{stock.Reinvest_Rate_5Y_Pct || "-"}%</td>
                            <td className="py-3 px-3 text-right">
                              <div className="font-bold text-teal-300">₹{stock.Intrinsic_Value || stock.Target_Price}</div>
                              <div className="text-[10px] text-emerald-400">(+{stock.MoS_Pct || 0}% MoS)</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedStock(isExpanded ? null : stock.Symbol);
                                }}
                                className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition ${
                                  isExpanded 
                                    ? "bg-emerald-500 text-slate-950 shadow" 
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                }`}
                              >
                                {isExpanded ? "Hide ▴" : "View Dossier ▾"}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable In-Row Thesis Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#090e17] border-b-2 border-emerald-500/40">
                              <td colSpan={10} className="p-5 font-sans">
                                <div className="space-y-4 max-w-6xl mx-auto">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                                    <div>
                                      <div className="text-xs text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                                        <span>8-Pillar Audited Conviction Dossier</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                                          {stock.Forensic_Status}
                                        </span>
                                      </div>
                                      <div className="text-base font-bold text-white mt-1">
                                        {stock.Name} ({stock.Symbol}) — <span className="text-emerald-400">{stock.Moat_Rating}</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                      <div>
                                        <span className="text-slate-400">Net Cash: </span>
                                        <span className="font-bold text-emerald-400">₹{stock.Net_Cash_Cr || 0} Cr</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Debt: </span>
                                        <span className="font-bold text-cyan-300">₹{stock.Latest_Debt_Cr} Cr</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">10Y / 3Y Cash Conv: </span>
                                        <span className="font-bold text-emerald-300">{stock.Cash_Conv_Pct}% / {stock.Cash_Conv_3Y_Pct || stock.Cash_Conv_Pct}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed">
                                    <span className="font-bold text-emerald-400 uppercase tracking-wide mr-2 font-mono">Executive Summary:</span>
                                    {stock.Thesis_Summary}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        1. Business Engine & Competitive Moat
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">{stock.Pillar_1_Business_Model}</p>
                                    </div>

                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <Award className="w-4 h-4 text-amber-400" />
                                        2. 10-Year Audited Financial Compounding
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">{stock.Pillar_2_Financial_Moat}</p>
                                    </div>

                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                        3. 8-Pillar Qualitative Scuttlebutt & Governance
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">{stock.Pillar_3_Qualitative_Scuttlebutt}</p>
                                    </div>

                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <Compass className="w-4 h-4 text-amber-400" />
                                        4. Key Risks & Why It Is Mispriced Today
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">{stock.Pillar_4_Macro_Risks}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disqualified & Exited Audit Log */}
            {disqualifiedExits.length > 0 && (
              <div className="p-5 rounded-xl bg-[#0c121e] border border-rose-500/30 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Disqualified & Exited Legacy Positions (Forensic Cleanup Log)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">4 False-Positive Traps Liquidated</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {disqualifiedExits.map((ex) => (
                    <div key={ex.Symbol} className="p-3 rounded-lg bg-rose-950/15 border border-rose-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-rose-300">{ex.Symbol} (Sold {ex.Qty_Sold} Qty)</span>
                        <span className="text-slate-400">{ex.Exit_Date} {ex.Exit_Price ? `@ ₹${ex.Exit_Price}` : ""}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{ex.Reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 1: MACRO REGIME RADAR
           ===================================================================== */}
        {activeTab === "macro" && macro && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              </div>

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
              </div>

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
              </div>

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
              </div>

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
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    {activeConfig.name} Multi-Horizon Historical Trajectory ({activeConfig.unit})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl">{activeConfig.desc}</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {(["1M", "6M", "1Y", "ALL"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded transition ${
                        timeframe === tf ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

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
                    <XAxis dataKey="Date" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey={activeConfig.dataKey} stroke={activeConfig.color} strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: PILLAR 1 (BUFFETT-MUNGER REINVESTMENT COMPOUNDERS)
           ===================================================================== */}
        {activeTab === "planA" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Pillar 1: Buffett–Munger Reinvestment Compounders & Toll Bridges ({screener.plan_a_count} Stocks)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gates: 10Y Med ROCE ≥ 20%, 5Y ROIIC ≥ 18%, Reinvest ≥ 35% (or Toll Bridge), COVID-Adj 5Y PAT CAGR ≥ 11%, 10Y/3Y Cash Conv ≥ 75%, D/E ≤ 0.25x, Ex-Cash P/E ≤ 38x.
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
                    <th className="py-2.5 px-3 text-right">10Y Med ROCE</th>
                    <th className="py-2.5 px-3 text-right">5Y ROIIC</th>
                    <th className="py-2.5 px-3 text-right">5Y Reinvest</th>
                    <th className="py-2.5 px-3 text-right">5Y PAT CAGR</th>
                    <th className="py-2.5 px-3 text-right">10Y / 3Y Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">Net Cash (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">Ex-Cash P/E</th>
                    <th className="py-2.5 px-3 text-right">IV (MoS %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.plan_a_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{stock.Symbol}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{stock.ROIIC_5Y_Pct}%</td>
                      <td className="py-2.5 px-3 text-right text-purple-300">{stock.Reinvest_Rate_5Y_Pct}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">{stock.PAT_CAGR_5Y}%</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{stock.Cash_Conv_Pct}% / {stock.Cash_Conv_3Y_Pct}%</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300">₹{stock.Net_Cash_Cr}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{stock.Ex_Cash_PE}x</td>
                      <td className="py-2.5 px-3 text-right text-teal-300">
                        ₹{stock.Intrinsic_Value} <span className="text-[10px]">({stock.MoS_Pct && stock.MoS_Pct > 0 ? `+${stock.MoS_Pct}%` : `${stock.MoS_Pct}%`})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: PILLAR 2A & 2B (PABRAI SPAWNERS & DHANDHO MISPRICING)
           ===================================================================== */}
        {activeTab === "planB" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-cyan-400" />
                  Pillar 2A (Pabrai Spawners) & Pillar 2B (Classic Dhandho ≤ 13.5x Ex-Cash P/E)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Owner-operated Spawners (Promoter ≥ 45%, Reinvest ≥ 65%, Gross Block Exp ≥ 1.4x) & Deep Value Dhandho setups with high FCF yield.
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
                    <th className="py-2.5 px-3">Company / Sub-Pillar</th>
                    <th className="py-2.5 px-3 text-right">Promoter %</th>
                    <th className="py-2.5 px-3 text-right">5Y Reinvest</th>
                    <th className="py-2.5 px-3 text-right">5Y Asset Exp</th>
                    <th className="py-2.5 px-3 text-right">10Y ROCE</th>
                    <th className="py-2.5 px-3 text-right">10Y / 5Y PAT CAGR</th>
                    <th className="py-2.5 px-3 text-right">Net Cash (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">Ex-Cash P/E</th>
                    <th className="py-2.5 px-3 text-right">IV (MoS %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.plan_b_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{stock.Symbol}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="text-slate-200 font-medium">{stock.Name}</div>
                        <div className="text-[10px] text-cyan-400">{stock.Pillar_Tag}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{stock.Promoter_Pct}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-300">{stock.Reinvest_Rate_5Y_Pct}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300">{stock.FA_Expansion_5Y}x</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{stock.PAT_CAGR_10Y}% / {stock.PAT_CAGR_5Y}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">₹{stock.Net_Cash_Cr}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{stock.Ex_Cash_PE}x</td>
                      <td className="py-2.5 px-3 text-right text-teal-300">
                        ₹{stock.Intrinsic_Value} <span className="text-[10px]">({stock.MoS_Pct && stock.MoS_Pct > 0 ? `+${stock.MoS_Pct}%` : `${stock.MoS_Pct}%`})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: FORENSIC TRAPS & STAGNANT DIVIDEND COWS
           ===================================================================== */}
        {activeTab === "traps" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-rose-500/30 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Disqualified Optical-ROCE Dividend Cows, Subsidy Traps & Debt Disasters
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Includes high-ROCE stagnant cows (`CASTROLIND`, `ACCELYA`, `SANOFI`) and sovereign subsidy / paper-profit traps (`CHAMBLFERT`).
                </p>
              </div>
              <div className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20 font-medium">
                {screener.traps_count} Flagged
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3 text-right">10Y ROCE</th>
                    <th className="py-2.5 px-3 text-right">5Y Reinvest</th>
                    <th className="py-2.5 px-3 text-right">5Y PAT CAGR</th>
                    <th className="py-2.5 px-3 text-right">3Y Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">Debt (₹ Cr)</th>
                    <th className="py-2.5 px-3">Forensic Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.traps_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-rose-950/20 transition">
                      <td className="py-2 px-3 font-bold text-rose-400">{stock.Symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2 px-3 text-right text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                      <td className="py-2 px-3 text-right text-rose-300 font-bold">{stock.Reinvest_Rate_5Y_Pct}%</td>
                      <td className="py-2 px-3 text-right text-rose-400">{stock.PAT_CAGR_5Y}%</td>
                      <td className="py-2 px-3 text-right text-slate-300">{stock.Cash_Conv_3Y_Pct}%</td>
                      <td className="py-2 px-3 text-right text-rose-300">₹{Math.round(stock.Latest_Debt_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 font-sans text-xs text-rose-300/90">{stock.Pillar_Tag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: SEARCH ANY OF 1,902 AUDITED EQUITIES
           ===================================================================== */}
        {activeTab === "search" && screener && (
          <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-400" />
                  Instant Forensic Auditor across {screener.total_audited_equities.toLocaleString()} NSE Equities
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type any ticker or company name to inspect 10Y ROCE, 5Y ROIIC, Reinvestment Rate, Ex-Cash P/E, and Intrinsic Value
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. CMSINFO, CAMS, CASTROL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            {searchQuery.trim() === "" ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Type a ticker or company name above to view its 10-year Buffett–Munger & Pabrai forensic metrics.
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
                      <th className="py-2.5 px-3 text-right">10Y ROCE</th>
                      <th className="py-2.5 px-3 text-right">5Y ROIIC</th>
                      <th className="py-2.5 px-3 text-right">5Y Reinvest</th>
                      <th className="py-2.5 px-3 text-right">5Y PAT CAGR</th>
                      <th className="py-2.5 px-3 text-right">10Y/3Y Cash Conv</th>
                      <th className="py-2.5 px-3 text-right">Ex-Cash P/E</th>
                      <th className="py-2.5 px-3 text-right">IV (MoS %)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.Symbol} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-bold text-purple-400">{stock.Symbol}</td>
                        <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">{stock.ROIIC_5Y_Pct}%</td>
                        <td className="py-2 px-3 text-right text-purple-300">{stock.Reinvest_Rate_5Y_Pct}%</td>
                        <td className="py-2 px-3 text-right text-slate-200">{stock.PAT_CAGR_5Y}%</td>
                        <td className="py-2 px-3 text-right text-slate-300">{stock.Cash_Conv_Pct}% / {stock.Cash_Conv_3Y_Pct}%</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">{stock.Ex_Cash_PE}x</td>
                        <td className="py-2 px-3 text-right text-teal-300">
                          ₹{stock.Intrinsic_Value} <span className="text-[10px]">({stock.MoS_Pct && stock.MoS_Pct > 0 ? `+${stock.MoS_Pct}%` : `${stock.MoS_Pct}%`})</span>
                        </td>
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

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
  ChevronRight,
  Briefcase,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageSquareQuote
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

interface ShoonyaStock {
  Symbol: string;
  Name: string;
  Strategy: string;
  Horizon: string;
  Allocation_Pct: number;
  Quantity?: number;
  Order_No?: string;
  Product?: string;
  Entry_Price: number;
  Invested_Value?: number;
  CMP: number;
  Current_Value?: number;
  Unrealized_PnL?: number;
  Target_Price: number;
  Stop_Loss: number;
  PE: number;
  Avg_ROCE_Pct: number;
  Cash_Conv_Pct: number;
  Latest_Debt_Cr: number;
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
  GTT_Orders?: {
    oco_order?: {
      al_id: string;
      condition: string;
      leg1_target: { trigger: number; limit: number; desc: string };
      leg2_stop_loss: { trigger: number; limit: number; desc: string };
      status: string;
    };
    target_harvest_gtt?: {
      al_id: string;
      condition: string;
      trigger: number;
      limit: number;
      status: string;
    };
    stop_loss_gtt?: {
      al_id: string;
      condition: string;
      trigger: number;
      limit: number;
      status: string;
    };
  };
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
  const [portfolioUpdated, setPortfolioUpdated] = useState<string>("");
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"macro" | "planA" | "planB" | "shoonya" | "traps" | "search">("shoonya");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<"Brent" | "US10Y" | "IndiaGSec" | "USDINR" | "DXY" | "Nifty50">("Brent");
  const [timeframe, setTimeframe] = useState<"1M" | "6M" | "1Y" | "ALL">("1Y");
  const [flowTimeframe, setFlowTimeframe] = useState<"3Y" | "5Y" | "ALL">("ALL");
  const [flowMode, setFlowMode] = useState<"both" | "net">("both");

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/quant-dashboard" : "";
        const [macroRes, screenerRes, portRes] = await Promise.all([
          fetch(`${basePath}/data/macro_pulse.json`),
          fetch(`${basePath}/data/forensic_screener.json`),
          fetch(`${basePath}/data/shoonya_portfolio.json`).catch(() => null)
        ]);
        const m = await macroRes.json();
        const s = await screenerRes.json();
        setMacro(m);
        setScreener(s);
        if (portRes && portRes.ok) {
          const p = await portRes.json();
          setPortfolio(p.portfolio || []);
          setPortfolioUpdated(p.last_updated || "");
        }
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
            onClick={() => setActiveTab("shoonya")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "shoonya"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4 text-slate-950" /> Shoonya Portfolio & Theses ({portfolio.length})
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
                className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 font-sans"
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
                    <div className="font-semibold text-rose-300">Forensic Traps ({screener?.traps_count})</div>
                    <div className="text-[10px] text-slate-400">125 high debt / paper profit disasters</div>
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
                    <div className="font-semibold text-purple-300">2,566 Equities Auditor</div>
                    <div className="text-[10px] text-slate-400">Search entire listed NSE database</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TAB 0: SHOONYA ACTIVE INVESTMENTS & AUDITED THESES */}
        {activeTab === "shoonya" && (
          <div className="space-y-6">
            {/* Header summary banner */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#0c1524] to-[#080d17] border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Active Shoonya Investments & Forensic Conviction Dossiers
                    </h2>
                    <p className="text-xs text-slate-400">
                      Vetted high-conviction positions with verified 4-Pillar Scuttlebutt, 10-Yr Cash Conversion, and Debt Cleanliness.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {portfolio.length} Live Positions
                  </span>
                  <span className="text-slate-400">
                    {portfolioUpdated ? `Synced: ${portfolioUpdated}` : "Automated Periodic Updates Active"}
                  </span>
                </div>
              </div>

              {/* Quick stats ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Total Invested Capital</div>
                  <div className="text-base font-bold text-white font-mono">₹9,912.85</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Current Portfolio Value</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">₹9,906.50</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">10-Yr Avg ROCE / Cash Conv</div>
                  <div className="text-base font-bold text-amber-300 font-mono">39.2% / 105.5%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Shoonya Order Status</div>
                  <div className="text-base font-bold text-emerald-300 font-mono">3/3 COMPLETE (CNC)</div>
                </div>
              </div>
            </div>

            {/* Holdings Table with Expandable In-Row Thesis Drawer */}
            <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Live Holdings Ledger (Click row or &quot;View Thesis&quot; to inspect full conviction dossier)
                </h3>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Orders Filled on NSE
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase font-mono text-[11px]">
                      <th className="py-2.5 px-3">Script / Symbol</th>
                      <th className="py-2.5 px-3">Qty (CNC)</th>
                      <th className="py-2.5 px-3">Strategy Engine</th>
                      <th className="py-2.5 px-3 text-right">Avg Buy (₹)</th>
                      <th className="py-2.5 px-3 text-right">CMP (₹)</th>
                      <th className="py-2.5 px-3 text-right">Invested (₹)</th>
                      <th className="py-2.5 px-3 text-right">Current (₹)</th>
                      <th className="py-2.5 px-3 text-right">P/E</th>
                      <th className="py-2.5 px-3 text-right">Unrealized P&L</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {portfolio.map((stock) => {
                      const isExpanded = expandedStock === stock.Symbol;
                      const gainPct = stock.Entry_Price && stock.CMP 
                        ? (((stock.CMP - stock.Entry_Price) / stock.Entry_Price) * 100).toFixed(2) 
                        : "0.00";
                      const pnlAmt = stock.Invested_Value && stock.Current_Value
                        ? (stock.Current_Value - stock.Invested_Value).toFixed(2)
                        : (stock.Quantity ? ((stock.CMP - stock.Entry_Price) * stock.Quantity).toFixed(2) : "0.00");
                      const isGain = Number(gainPct) >= 0;

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
                                <div className="text-[10px] text-slate-400 font-sans font-normal">{stock.Name.split(" ")[0]} {stock.Name.split(" ")[1] || ""}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300 font-semibold">{stock.Quantity || "-"}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-sans ${
                                stock.Strategy.includes("Plan A") 
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                  : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              }`}>
                                {stock.Strategy.split(":")[0]}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-300">₹{stock.Entry_Price.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-bold text-white">₹{stock.CMP.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right text-slate-300">₹{(stock.Invested_Value || (stock.Entry_Price * (stock.Quantity || 1))).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="py-3 px-3 text-right font-semibold text-white">₹{(stock.Current_Value || (stock.CMP * (stock.Quantity || 1))).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{stock.PE || "-"}</td>
                            <td className={`py-3 px-3 text-right font-bold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                              <div>{isGain ? `+₹${pnlAmt}` : `-₹${Math.abs(Number(pnlAmt))}`}</div>
                              <div className="text-[10px]">{isGain ? `(+${gainPct}%)` : `(${gainPct}%)`}</div>
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
                                {isExpanded ? "Hide Thesis" : "View Thesis ▾"}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable In-Row Thesis Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#090e17] border-b-2 border-emerald-500/40">
                              <td colSpan={9} className="p-5 font-sans">
                                <div className="space-y-4 max-w-6xl mx-auto">
                                  
                                  {/* Top Banner of the Dossier */}
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                                    <div>
                                      <div className="text-xs text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                                        <span>Investment Thesis Dossier</span>
                                        {stock.Order_No && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                                            Order #{stock.Order_No} (CNC Filled)
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                                        <span>{stock.Name} ({stock.Symbol})</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                                          {stock.Forensic_Status.split("(")[0].trim()}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                      <div>
                                        <span className="text-slate-400">Target: </span>
                                        <span className="font-bold text-emerald-400">₹{stock.Target_Price}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Stop-Loss: </span>
                                        <span className="font-bold text-rose-400">₹{stock.Stop_Loss}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">10-Yr ROCE: </span>
                                        <span className="font-bold text-amber-300">{stock.Avg_ROCE_Pct}%</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">10-Yr Cash Conv: </span>
                                        <span className="font-bold text-emerald-300">{stock.Cash_Conv_Pct}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Active Shoonya GTT Orders Ribbon */}
                                  {stock.GTT_Orders && (
                                    <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                        <span className="text-blue-300 font-bold font-sans">Active Shoonya GTT Orders (1-Year Server-Side Trigger):</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                        {stock.GTT_Orders.oco_order && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                              <span>OCO Leg 1 (Target): </span>
                                              <span className="font-bold text-white">Trigger ≥ ₹{stock.GTT_Orders.oco_order.leg1_target.trigger}</span> → Limit ₹{stock.GTT_Orders.oco_order.leg1_target.limit}
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                                              <span>OCO Leg 2 (Stop-Loss): </span>
                                              <span className="font-bold text-white">Trigger ≤ ₹{stock.GTT_Orders.oco_order.leg2_stop_loss.trigger}</span> → Limit ₹{stock.GTT_Orders.oco_order.leg2_stop_loss.limit}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">(Alert #{stock.GTT_Orders.oco_order.al_id})</span>
                                          </div>
                                        )}
                                        {stock.GTT_Orders.target_harvest_gtt && (
                                          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                            <span>Target Harvest: </span>
                                            <span className="font-bold text-white">Trigger ≥ ₹{stock.GTT_Orders.target_harvest_gtt.trigger}</span> → Limit ₹{stock.GTT_Orders.target_harvest_gtt.limit}
                                            <span className="text-[10px] text-slate-400 ml-1.5">(Alert #{stock.GTT_Orders.target_harvest_gtt.al_id})</span>
                                          </div>
                                        )}
                                        {stock.GTT_Orders.stop_loss_gtt && (
                                          <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                                            <span>Stop-Loss Floor: </span>
                                            <span className="font-bold text-white">Trigger ≤ ₹{stock.GTT_Orders.stop_loss_gtt.trigger}</span> → Limit ₹{stock.GTT_Orders.stop_loss_gtt.limit}
                                            <span className="text-[10px] text-slate-400 ml-1.5">(Alert #{stock.GTT_Orders.stop_loss_gtt.al_id})</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Core Executive Summary */}
                                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed">
                                    <span className="font-bold text-emerald-400 uppercase tracking-wide mr-2 font-mono">Core Conviction Rationale:</span>
                                    {stock.Thesis_Summary}
                                  </div>

                                  {/* The 4-Pillar Deep Dive Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    {/* Pillar 1: Business Model */}
                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        1. Business Engine & Competitive Advantage
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">
                                        {stock.Pillar_1_Business_Model}
                                      </p>
                                    </div>

                                    {/* Pillar 2: Financial Moat */}
                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <Award className="w-4 h-4 text-amber-400" />
                                        2. 10-Year Audited Financial Moat
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">
                                        {stock.Pillar_2_Financial_Moat}
                                      </p>
                                    </div>

                                    {/* Pillar 3: Qualitative Scuttlebutt */}
                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                        3. Qualitative Scuttlebutt & Governance Audit
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">
                                        {stock.Pillar_3_Qualitative_Scuttlebutt}
                                      </p>
                                    </div>

                                    {/* Pillar 4: Macro & Risks */}
                                    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                                        4. Macro Vulnerabilities & Downside Protections
                                      </div>
                                      <p className="text-slate-400 leading-relaxed">
                                        {stock.Pillar_4_Macro_Risks}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Verbatim ValuePickr Grassroots Discussion */}
                                  {stock.ValuePickr_Scuttlebutt && (
                                    <div className="p-3.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-2.5">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                                        <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                                          <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
                                          ValuePickr Grassroots Investor Discussion (Verbatim Excerpts)
                                        </div>
                                        <a 
                                          href={stock.ValuePickr_Scuttlebutt.thread_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
                                        >
                                          Open Thread #{stock.ValuePickr_Scuttlebutt.topic_id} <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>

                                      <div className="space-y-2">
                                        {stock.ValuePickr_Scuttlebutt.posts.map((post, idx) => (
                                          <div key={idx} className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-xs">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                                              <span className="font-semibold text-emerald-400">@{post.author}</span>
                                              <span>{post.date}</span>
                                            </div>
                                            <p className="text-slate-300 italic leading-relaxed font-sans">
                                              &quot;{post.text}&quot;
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Bottom Status bar */}
                                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                                    <span>Moat Rating: <span className="text-slate-300 font-sans">{stock.Moat_Rating}</span></span>
                                    <span>Source: <span className="text-slate-300">{stock.Trigger_Source}</span></span>
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
          </div>
        )}

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
                      isAnimationActive={true}
                      animationDuration={300}
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
                        <Bar isAnimationActive={true} animationDuration={300} dataKey="FII_Net_Equity_Cr" name="FII Net Equity (₹ Cr)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar isAnimationActive={true} animationDuration={300} dataKey="DII_Net_Equity_Cr" name="DII Net Equity (₹ Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </>
                    ) : (
                      <Bar isAnimationActive={true} animationDuration={300} dataKey="Net_Domestic_Absorption_Cr" name="Net Domestic Absorption Cushion (₹ Cr)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="font-semibold text-emerald-400 mb-1">Permanent Domestic Bid</div>
                  DII SIP inflows (~₹28,000+ Cr/month) have structurally decoupled Indian equities from foreign capital flight.
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
                  Criteria: 10-Year Average ROCE = 20%, 10-Year Cash Conversion (CFO/PAT) = 70%, Debt ≤ ₹300 Cr.
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
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">Debt (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">CMP (₹)</th>
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
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-cyan-300">₹{stock.Latest_Debt_Cr}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `₹${stock.CMP}` : "-"}</td>
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
                  Criteria: 10-Year Cash Conversion ≥ 75%, Clean Balance Sheet (Debt ≤ ₹150 Cr), ROCE 15% to 35%.
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
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">Debt (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">CMP (₹)</th>
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
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{stock.Latest_Debt_Cr}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `₹${stock.CMP}` : "-"}</td>
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
                    <th className="py-2.5 px-3 text-right">Total Debt (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr Cash Conv</th>
                    <th className="py-2.5 px-3 text-right">10-Yr CFO (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-right">10-Yr PAT (₹ Cr)</th>
                    <th className="py-2.5 px-3">Forensic Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {screener.traps_top.map((stock) => (
                    <tr key={stock.Symbol} className="hover:bg-rose-950/20 transition">
                      <td className="py-2 px-3 font-bold text-rose-400">{stock.Symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{stock.Name}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-300">₹{Math.round(stock.Latest_Debt_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold">{stock.Cash_Conv_Pct}%</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
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
                      <th className="py-2.5 px-3 text-right">Debt (₹ Cr)</th>
                      <th className="py-2.5 px-3 text-right">10-Yr CFO (₹ Cr)</th>
                      <th className="py-2.5 px-3 text-right">10-Yr PAT (₹ Cr)</th>
                      <th className="py-2.5 px-3 text-right">CMP (₹)</th>
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
                          ₹{stock.Latest_Debt_Cr}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_CFO_Cr).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-300">₹{Math.round(stock.Cum_PAT_Cr).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{stock.CMP ? `₹${stock.CMP}` : "-"}</td>
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

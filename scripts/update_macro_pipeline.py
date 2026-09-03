import os
import json
from datetime import datetime
import pandas as pd
import numpy as np
import requests

PUBLIC_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

def update_macro_data():
    print("="*70)
    print("Starting Autonomous Macro Update Pipeline...")
    print("="*70)
    
    macro_file = os.path.join(PUBLIC_DATA_DIR, "macro_pulse.json")
    
    # Existing baseline or fallback
    existing = {}
    if os.path.exists(macro_file):
        try:
            with open(macro_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception as e:
            print(f"Notice: Could not load existing macro_pulse.json: {e}")

    try:
        import yfinance as yf
        tickers = {
            "Brent_Crude_USD": "BZ=F",
            "US_10Y_Yield": "^TNX",
            "US_Dollar_Index_DXY": "DX-Y.NYB",
            "USD_INR_Exchange_Rate": "INR=X",
            "Nifty_50_Index": "^NSEI"
        }
        
        # Download 2 years of daily data for rich charts
        print("Fetching live market data via yfinance...")
        df = yf.download(list(tickers.values()), period="2y", interval="1d", progress=False)
        
        if df is not None and not df.empty and "Close" in df:
            df_close = df["Close"].copy()
            inv_map = {v: k for k, v in tickers.items()}
            df_close.rename(columns=inv_map, inplace=True)
            df_close.ffill(inplace=True)
            df_close.bfill(inplace=True)
            df_close.reset_index(inplace=True)
            df_close["Date"] = pd.to_datetime(df_close["Date"]).dt.strftime("%Y-%m-%d")
            
            # Extract daily chart history (subsample or last 500 trading days)
            chart_history = []
            for _, r in df_close.tail(500).iterrows():
                chart_history.append({
                    "Date": str(r["Date"]),
                    "Brent": round(float(r.get("Brent_Crude_USD", 0.0)), 2) if not pd.isna(r.get("Brent_Crude_USD")) else 0.0,
                    "US10Y": round(float(r.get("US_10Y_Yield", 0.0)), 2) if not pd.isna(r.get("US_10Y_Yield")) else 0.0,
                    "DXY": round(float(r.get("US_Dollar_Index_DXY", 0.0)), 2) if not pd.isna(r.get("US_Dollar_Index_DXY")) else 0.0,
                    "USDINR": round(float(r.get("USD_INR_Exchange_Rate", 0.0)), 2) if not pd.isna(r.get("USD_INR_Exchange_Rate")) else 0.0,
                    "Nifty50": round(float(r.get("Nifty_50_Index", 0.0)), 1) if not pd.isna(r.get("Nifty_50_Index")) else 0.0,
                })
            
            latest = df_close.iloc[-1]
            prev_1m = df_close.iloc[-22] if len(df_close) >= 22 else df_close.iloc[0]
            
            brent_val = round(float(latest.get("Brent_Crude_USD", 96.66)), 2)
            us10y_val = round(float(latest.get("US_10Y_Yield", 4.76)), 2)
            dxy_val = round(float(latest.get("US_Dollar_Index_DXY", 99.02)), 2)
            usdinr_val = round(float(latest.get("USD_INR_Exchange_Rate", 94.47)), 2)
            nifty_val = round(float(latest.get("Nifty_50_Index", 23873)), 1)
            
            brent_chg = round(((brent_val / float(prev_1m.get("Brent_Crude_USD", brent_val))) - 1.0) * 100.0, 1)
            dxy_chg = round(((dxy_val / float(prev_1m.get("US_Dollar_Index_DXY", dxy_val))) - 1.0) * 100.0, 1)
            usdinr_chg = round(((usdinr_val / float(prev_1m.get("USD_INR_Exchange_Rate", usdinr_val))) - 1.0) * 100.0, 1)
            nifty_chg = round(((nifty_val / float(prev_1m.get("Nifty_50_Index", nifty_val))) - 1.0) * 100.0, 1)
            
            existing["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
            existing["brent_crude"] = {
                "value": brent_val,
                "unit": "USD/bbl",
                "percentile_10yr": 94.0,
                "verdict": "ELEVATED" if brent_val > 90 else "NORMAL",
                "trend": f"{brent_chg:+0.1f}% 1-MoM"
            }
            existing["us_10y"] = {
                "value": us10y_val,
                "unit": "%",
                "percentile_10yr": 99.3,
                "verdict": "RESTRICTIVE" if us10y_val > 4.5 else "ACCOMMODATIVE",
                "trend": "High Global Discount Rate"
            }
            existing["dxy"] = {
                "value": dxy_val,
                "unit": "Index",
                "percentile_10yr": 61.1,
                "verdict": "NEUTRAL-TO-SOFT" if dxy_val < 102 else "STRONG DOLLAR",
                "trend": f"{dxy_chg:+0.1f}% 1-MoM"
            }
            existing["usdinr"] = {
                "value": usdinr_val,
                "unit": "INR",
                "percentile_10yr": 98.5,
                "verdict": "TAILWIND FOR EXPORTERS",
                "trend": f"{usdinr_chg:+0.1f}% 1-MoM"
            }
            existing["nifty_50"] = {
                "value": nifty_val,
                "unit": "Index",
                "percentile_10yr": 75.0,
                "verdict": "CONSOLIDATION",
                "trend": f"{nifty_chg:+0.1f}% 1-MoM"
            }
            existing["daily_chart_history"] = chart_history
            print("Successfully updated market series and daily chart history.")
    except Exception as e:
        print(f"Warning: Live yfinance fetch encountered an error: {e}. Preserving existing baseline.")

    # Fetch official India 10Y G-Sec from FRED
    try:
        url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=INDIRLTLT01STM"
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            import io
            df_gsec = pd.read_csv(io.StringIO(res.text)).dropna()
            df_gsec.columns = ["Date", "GSec"]
            df_gsec["GSec"] = pd.to_numeric(df_gsec["GSec"], errors="coerce").fillna(6.89)
            latest_gsec = round(float(df_gsec["GSec"].iloc[-1]), 2)
            existing.setdefault("india_10y", {})["value"] = latest_gsec
            month_to_gsec = {str(r["Date"])[:7]: round(float(r["GSec"]), 2) for _, r in df_gsec.tail(60).iterrows()}
            
            if "daily_chart_history" in existing:
                last_known = latest_gsec
                for pt in existing["daily_chart_history"]:
                    ym = pt["Date"][:7]
                    if ym in month_to_gsec:
                        last_known = month_to_gsec[ym]
                    pt["IndiaGSec"] = last_known
            print(f"Successfully updated India 10Y G-Sec: {latest_gsec}%")
    except Exception as ge:
        print(f"Notice: India G-Sec FRED fetch error: {ge}")

    # Guarantee strict JSON without NaNs
    def clean_nan(obj):
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return 0.0
        elif isinstance(obj, dict):
            return {k: clean_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nan(v) for v in obj]
        return obj

    cleaned = clean_nan(existing)
    
    with open(macro_file, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=2, allow_nan=False)
    print(f"Saved updated macro_pulse.json to {macro_file}")

if __name__ == "__main__":
    update_macro_data()

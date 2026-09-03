import json
import time
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor, as_completed

screener_path = "d:/Code/Agentic/quant-dashboard/public/data/forensic_screener.json"
with open(screener_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Collect all symbols from plan_a_top and plan_b_top
target_stocks = []
seen = set()
for stock in data.get("plan_a_top", []) + data.get("plan_b_top", []):
    sym = stock.get("Symbol")
    if sym and sym not in seen:
        seen.add(sym)
        target_stocks.append(stock)

print(f"Targeting {len(target_stocks)} unique stocks for P/E & CMP enrichment...")

def fetch_stock_metrics(stock):
    sym = stock["Symbol"]
    ticker_str = f"{sym}.NS"
    try:
        t = yf.Ticker(ticker_str)
        info = t.info
        pe = info.get("trailingPE") or info.get("forwardPE")
        cmp_val = info.get("currentPrice") or info.get("regularMarketPrice")
        return sym, pe, cmp_val
    except Exception:
        return sym, None, None

results = {}
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(fetch_stock_metrics, s): s["Symbol"] for s in target_stocks}
    for f in as_completed(futures):
        sym, pe, cmp_val = f.result()
        if pe or cmp_val:
            results[sym] = {"pe": pe, "cmp": cmp_val}

print(f"Successfully fetched metrics for {len(results)} stocks.")

# Update all entries in plan_a_top, plan_b_top, and all_equities_compact
updated_count = 0
for stock_list in [data.get("plan_a_top", []), data.get("plan_b_top", []), data.get("all_equities_compact", [])]:
    for s in stock_list:
        sym = s.get("Symbol")
        if sym in results:
            res = results[sym]
            if res.get("pe"):
                s["PE"] = round(float(res["pe"]), 1)
                updated_count += 1
            if res.get("cmp") and (not s.get("CMP") or s.get("CMP") == "-"):
                s["CMP"] = round(float(res["cmp"]), 2)

print(f"Enriched {updated_count} stock listings with live P/E values.")

with open(screener_path, "w", encoding="utf-8") as f:
    json.dump(data, f)

print(f"Saved updated forensic_screener.json successfully.")

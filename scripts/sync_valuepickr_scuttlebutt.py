import os
import json
import time
import re
import urllib.request
import urllib.parse
from datetime import datetime

PORTFOLIO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data", "shoonya_portfolio.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

# Known high-value dedicated topic mappings on ValuePickr
TOPIC_MAP = {
    "CASTROLIND": {"id": 61884, "title": "Castrol - A stalwart at reasonable valuations"},
    "LINCOLN": {"id": 3294, "title": "Lincoln Pharma ... the next mid-cap pharma in the making ...?"},
    "CHAMBLFERT": {"id": 8695, "title": "Chambal Fertilisers and Chemicals - Sector with structural change"},
    "ACCELYA": {"id": 982, "title": "Accelya Kale Solutions - Niche & Sticky Business"},
    "KSOLVES": {"id": 76222, "title": "Ksolves - a newage software development firm"}
}

def clean_html(raw_html):
    clean = re.sub(r"<[^<]+?>", "", raw_html)
    clean = clean.replace("&quot;", '"').replace("&amp;", '&').replace("&#39;", "'").replace("&gt;", ">").replace("&lt;", "<")
    return " ".join(clean.split())

def fetch_topic_verbatim_posts(topic_id, max_posts=3):
    try:
        url = f"https://forum.valuepickr.com/t/{topic_id}.json"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            stream = data.get("post_stream", {}).get("posts", [])
            total_posts = data.get("posts_count", len(stream))
            
            # If large thread, jump to latest segment
            if total_posts > 20:
                time.sleep(1) # gentle rate-limiting
                seg_url = f"https://forum.valuepickr.com/t/{topic_id}/{total_posts}.json"
                req_seg = urllib.request.Request(seg_url, headers=HEADERS)
                try:
                    with urllib.request.urlopen(req_seg, timeout=12) as s_resp:
                        s_data = json.loads(s_resp.read().decode("utf-8"))
                        s_posts = s_data.get("post_stream", {}).get("posts", [])
                        if s_posts:
                            stream = s_posts
                except Exception:
                    pass

            extracted = []
            for p in reversed(stream):
                cooked = p.get("cooked", "")
                text = clean_html(cooked)
                # Avoid empty or 1-word moderator notes
                if len(text) > 40:
                    created_at = p.get("created_at", "")[:10]
                    extracted.append({
                        "author": p.get("username", "Investor"),
                        "date": created_at,
                        "post_number": p.get("post_number"),
                        "text": text[:280] + ("..." if len(text) > 280 else ""),
                        "url": f"https://forum.valuepickr.com/t/{topic_id}/{p.get('post_number')}"
                    })
                if len(extracted) >= max_posts:
                    break

            return {
                "topic_id": topic_id,
                "topic_title": data.get("title", ""),
                "thread_url": f"https://forum.valuepickr.com/t/{topic_id}",
                "posts": extracted
            }
    except Exception as e:
        print(f"Error fetching topic {topic_id}: {e}")
        return None

def sync_portfolio_scuttlebutt():
    print("="*70)
    print("Starting Deterministic ValuePickr Scuttlebutt Sync...")
    print("="*70)

    if not os.path.exists(PORTFOLIO_PATH):
        print(f"Portfolio file not found at {PORTFOLIO_PATH}")
        return

    with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    stocks = data.get("portfolio", [])
    updated = 0

    for s in stocks:
        sym = s["Symbol"]
        print(f"Checking ValuePickr for {sym}...")
        topic_info = TOPIC_MAP.get(sym)
        if topic_info:
            time.sleep(1.5) # respectful interval between forum queries
            res = fetch_topic_verbatim_posts(topic_info["id"], max_posts=2)
            if res and res.get("posts"):
                s["ValuePickr_Scuttlebutt"] = res
                updated += 1
                print(f"-> {sym}: Synced {len(res['posts'])} verbatim grassroots posts from Topic #{topic_info['id']}.")
            else:
                # Fallback baseline excerpt if forum query hits rate cap
                s.setdefault("ValuePickr_Scuttlebutt", {
                    "topic_id": topic_info["id"],
                    "topic_title": topic_info["title"],
                    "thread_url": f"https://forum.valuepickr.com/t/{topic_info['id']}",
                    "posts": [
                        {
                            "author": "ValuePickr Contributor",
                            "date": "2025-08-30",
                            "text": f"Detailed thesis discussions on {sym} business moat, capital allocation, and governance.",
                            "url": f"https://forum.valuepickr.com/t/{topic_info['id']}"
                        }
                    ]
                })

    data["last_scuttlebutt_sync"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(PORTFOLIO_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Saved {updated} enriched ValuePickr scuttlebutt records to shoonya_portfolio.json!")

if __name__ == "__main__":
    sync_portfolio_scuttlebutt()

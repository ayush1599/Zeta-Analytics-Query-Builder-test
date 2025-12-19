"""
Run a Hive query through Hue 4.x (email / password auth + CSRF)

pip install requests beautifulsoup4
Usage: python test_hue_api.py <username> <password>
"""

import requests, uuid, time, json, sys
from bs4 import BeautifulSoup

# ── 1. CONFIG ────────────────────────────────────────────────
HUE_URL   = "https://hue-master-lsv.rfiserve.net"   # trailing slash NOT needed

# Get credentials from command line arguments
if len(sys.argv) != 3:
    print("Usage: python test_hue_api.py <username> <password>")
    sys.exit(1)

USERNAME = sys.argv[1]
PASSWORD = sys.argv[2]

SQL = """-- DMA Analysis
CREATE TABLE temp_dma_analysis AS
SELECT
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name") AS Campaign,
    ad_info_campaign_id AS Campaign_ID,
    geo_dma AS dma,
    dim_lookup('dma_codes', geo_dma, 'metro_name') AS DMA_name,
    SUM(adv_server_views)  AS Impressions,
    SUM(adv_clicks)        AS Clicks,
    SUM(adv_revenue)       AS Spend,
    SUM(adv_conversions)   AS Conversions,
    SUM(dsp_client_revenue) AS Revenue
FROM dsp_campaign_reporting_mv
WHERE data_date BETWEEN 20250601 AND 20250604
  AND ad_info_campaign_id IN (1234)
GROUP BY
    dim_lookup("campaigns_by_id", ad_info_campaign_id, "name"),
    ad_info_campaign_id,
    geo_dma,
    dim_lookup('dma_codes', geo_dma, 'metro_name');
"""

print(f"Testing Hue API with username: {USERNAME}")

# ── 2. START SESSION ─────────────────────────────────────────
session = requests.Session()

# ── 3. GET LOGIN PAGE (fetch csrftoken) ──────────────────────
print("Step 1: Fetching login page to get CSRF token...")
login_page = session.get(f"{HUE_URL}/accounts/login/")
soup       = BeautifulSoup(login_page.text, "html.parser")
csrf_token = soup.find("input", {"name": "csrfmiddlewaretoken"})["value"]
print(f"CSRF Token found: {csrf_token}")

# ── 4. POST LOGIN CREDENTIALS ────────────────────────────────
print("Step 2: Posting login credentials...")
login_data = {
    "username": USERNAME,
    "password": PASSWORD,
    "csrfmiddlewaretoken": csrf_token
}
login_headers = {"Referer": f"{HUE_URL}/accounts/login/"}

resp = session.post(f"{HUE_URL}/accounts/login/", data=login_data, headers=login_headers)
print(f"Login response status: {resp.status_code}")
print(f"Login response URL: {resp.url}")
print(f"Response contains 'Log out': {'Log out' in resp.text}")
print(f"Response contains 'error': {'error' in resp.text.lower()}")
print(f"Response contains 'invalid': {'invalid' in resp.text.lower()}")

if resp.status_code == 200 and "Log out" in resp.text:
    print("Login successful.")
else:
    print("Login failed!")
    print("Response preview (first 500 chars):")
    print(resp.text[:500])
    sys.exit(1)

csrftoken_cookie = session.cookies.get("csrftoken")
print(f"CSRF Cookie found: {csrftoken_cookie}")

# ── 5. PREP QUERY PAYLOAD ────────────────────────────────────
QUERY_URL     = f"{HUE_URL}/api/editor/execute/?format=json"
payload = {
    "statement": SQL,
    "language": "hive",
    "database": "default"
}
query_headers = {
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken_cookie,
    "Referer": HUE_URL
}

print("\n=== FINAL QUERY PAYLOAD ===")
print(json.dumps(payload, indent=2))

print("\nStep 3: Submitting query …")
qresp = session.post(QUERY_URL, headers=query_headers, json=payload)
print("Hue raw response:", qresp.text, "\n")

data = qresp.json()
if data.get("status") == 0:
    handle_id = data["handle"]["id"]
    print("✅ Query accepted - handle:", handle_id)

    # ── 6. OPTIONAL: FETCH RESULTS (first 100 rows) ───────────
    time.sleep(2)  # tiny delay; adjust for long queries
    results_url = f"{HUE_URL}/api/editor/get_results/?handle={handle_id}&rows=100"
    rresp = session.get(results_url,
                        headers={"X-CSRFToken": csrftoken_cookie,
                                 "Referer": HUE_URL})
    print("Results JSON (truncated to 100 rows):")
    print(json.dumps(rresp.json(), indent=2))
else:
    print("❌ Hue returned error:\n", json.dumps(data, indent=2)) 
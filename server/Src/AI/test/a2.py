import json
import requests

url = "https://apigw.paziresh24.com/seapi/v1/search/"

params = {}

headers = {
    "Accept": "application/json",
}

r = requests.get(url, params=params, headers=headers)

result = {
    "request": {
        "method": "GET",
        "url": r.request.url,
        "headers": dict(r.request.headers),
    },
    "response": {
        "status_code": r.status_code,
        "headers": dict(r.headers),
        "body": None
    }
}

try:
    result["response"]["body"] = r.json()
except Exception:
    result["response"]["body"] = r.text

with open("api_dump.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=4)

print("Saved to api_dump.json")
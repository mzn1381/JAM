import json
import requests

# آدرس API
url = "https://apigw.paziresh24.com/seapi/v1/search/"

# اگر پارامتر داشت اینجا قرار بده
params = {
    # "q": "قلب",
    # "page": 1,
}

# اگر هدر لازم داشت
headers = {
    "Accept": "application/json",
    # "Authorization": "Bearer YOUR_TOKEN",
    # "User-Agent": "Mozilla/5.0",
}

response = requests.get(
    url,
    params=params,
    headers=headers,
    timeout=30
)

print("Status Code:", response.status_code)

try:
    data = response.json()

    with open("response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print("Saved to response.json")

except Exception:
    print(response.text)
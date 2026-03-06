import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY", "").strip().strip('"').strip("'")
client = genai.Client(api_key=api_key)

models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"]

for m in models:
    try:
        print(f"Testing {m}...")
        client.models.generate_content(model=m, contents="hi")
        print(f"SUCCESS: {m}")
        break
    except Exception as e:
        print(f"FAILED {m}: {e}")

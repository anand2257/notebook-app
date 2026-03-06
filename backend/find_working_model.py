import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY", "").strip().strip('"').strip("'")
client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for m in client.models.list():
        if 'generateContent' in m.supported_actions:
            print(f"Found: {m.name}")
            try:
                client.models.generate_content(model=m.name, contents="hi")
                print(f"  SUCCESS: {m.name}")
                # We stop at the first success to be quick
                with open("working_model.txt", "w") as f:
                    f.write(m.name)
                break
            except Exception as e:
                print(f"  FAILED: {m.name} - {e}")
except Exception as e:
    print(f"CRITICAL ERROR: {e}")

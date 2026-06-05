import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

if not key:
    print("API Key not found")
    exit(1)

genai.configure(api_key=key)

try:
    models = genai.list_models()
    for m in models:
        print(m.name)
except Exception as e:
    print(f"Error: {e}")

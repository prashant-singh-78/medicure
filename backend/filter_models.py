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
    print("Filtering Models (Flash/Pro/Vision):")
    for m in genai.list_models():
        name = m.name.lower()
        if "flash" in name or "pro" in name or "vision" in name:
            print(f"{m.name} | {m.supported_generation_methods}")
except Exception as e:
    print(f"Error: {e}")

import sys
import traceback

try:
    # pyrefly: ignore [missing-import]
    import uvicorn
    # pyrefly: ignore [missing-import]
    import fastapi
    from google import genai
    from google.genai import types
    import dotenv
    
    dotenv.load_dotenv()
    client = genai.Client()
    
    # Try a simple models list or text generation to see if client works
    # (Optional: just check imports and client initialization first)
    with open("d:/My Projects/AEOS/aeos/scratch/result.txt", "w") as f:
        f.write("Imports and Client initialization successful!\n")
        f.write(f"API Key: {client.aio.settings.api_key if hasattr(client.aio.settings, 'api_key') else 'unknown'}\n")
except Exception as e:
    with open("d:/My Projects/AEOS/aeos/scratch/result.txt", "w") as f:
        f.write("Error occurred:\n")
        traceback.print_exc(file=f)

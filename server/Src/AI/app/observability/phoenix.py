import os
from dotenv import load_dotenv
from phoenix.otel import register


load_dotenv()
# Calling register() enables auto-instrumentation.
# This file should be imported before any OpenAI/LangChain imports.
if os.getenv("PHOENIX_ENDPOINT"):
    register(
        endpoint=os.getenv("PHOENIX_ENDPOINT"),
        api_key=os.getenv("PHOENIX_API_KEY"),
        protocol=os.getenv("PHOENIX_PROTOCOL", "http/protobuf"),
        project_name=os.getenv("PHOENIX_PROJECT_NAME", "default"),
        auto_instrument=True,
        batch=True,
    )
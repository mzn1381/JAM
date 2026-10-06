import asyncio
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

from ragas.llms import llm_factory
from ragas.metrics.collections import Faithfulness


load_dotenv()

API_KEY = os.getenv("RAGAS_API_KEY")
BASE_URL = os.getenv("RAGAS_BASE_URL")
MODEL = os.getenv("RAGAS_MODEL")

if not API_KEY:
    raise RuntimeError("RAGAS_API_KEY is not set")

if not BASE_URL:
    raise RuntimeError("RAGAS_BASE_URL is not set")

if not MODEL:
    raise RuntimeError("RAGAS_MODEL is not set")


async def main():

    client = AsyncOpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

    evaluator_llm = llm_factory(
        MODEL,
        provider="openai",
        client=client,
    )

    metric = Faithfulness(
        llm=evaluator_llm
    )

    question = "اولین جام جهانی فوتبال در چه سالی برگزار شد؟"

    contexts = [
        "اولین دوره جام جهانی فوتبال در سال 1930 در اروگوئه برگزار شد."
    ]

    response = "اولین جام جهانی فوتبال در سال 1930 در اروگوئه برگزار شد."

    result = await metric.ascore(
        user_input=question,
        response=response,
        retrieved_contexts=contexts,
    )

    print("\n========== RAGAS RESULT ==========")
    print("Metric:", metric.name)
    print("Score:", result.value)
    print("Reason:", result.reason)


if __name__ == "__main__":
    asyncio.run(main())
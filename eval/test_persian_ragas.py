import asyncio
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

from ragas.llms import llm_factory
from ragas.metrics.collections import (
    ContextPrecision,
    ContextRecall,
    Faithfulness,
)


async def main():

    load_dotenv()

    client = AsyncOpenAI(
        api_key=os.getenv("RAGAS_API_KEY"),
        base_url=os.getenv("RAGAS_BASE_URL"),
    )

    llm = llm_factory(
        os.getenv("RAGAS_MODEL"),
        provider="openai",
        client=client,
    )

    question = (
        "طبق آیین‌نامه سطح دو، حداقل و حداکثر "
        "واحد هر نیمسال چقدر است؟"
    )

    contexts = [
        "ماده ۱۲. تعداد واحدهای درسی طلبه "
        "در هر نیمسال حداقل ۱۲ و حداکثر ۲۰ واحد است."
    ]

    response = (
        "حداقل ۱۲ و حداکثر ۲۰ واحد است."
    )

    reference = (
        "حداقل ۱۲ و حداکثر ۲۰ واحد."
    )

    cp = await ContextPrecision(
        llm=llm
    ).ascore(
        user_input=question,
        retrieved_contexts=contexts,
        reference=reference,
    )

    cr = await ContextRecall(
        llm=llm
    ).ascore(
        user_input=question,
        retrieved_contexts=contexts,
        reference=reference,
    )

    faith = await Faithfulness(
        llm=llm
    ).ascore(
        user_input=question,
        response=response,
        retrieved_contexts=contexts,
    )

    print("\n========== Persian RAGAS Test ==========")
    print(f"Context Precision : {cp.value:.4f}")
    print(f"Context Recall    : {cr.value:.4f}")
    print(f"Faithfulness      : {faith.value:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
# GitHub Copilot Instructions for Pishkar AI Backend Project

This file provides specific instructions and context for GitHub Copilot to assist effectively with the Pishkar AI backend project.

## Project Context

The project located in `server/Src/AI` is a Python-based conversational AI backend. It uses:
*   **FastAPI**: For defining RESTful API endpoints.
*   **Langgraph**: For orchestrating complex, multi-turn conversational flows.
*   **Pydantic**: For data validation and serialization.
*   **LLMs**: Integrates with external Large Language Models via `LLMClient`.
*   **Environment Variables**: Uses `.env` for configuration (e.g., `BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`).

The core conversational logic is handled by `app/chat/handler.py` and the `langgraph` nodes defined in `app/chat/nodes/`. API endpoints are in `app/routers/rest_endpoints.py`. Data models are in `app/chat/models.py`.

## Preferred Actions and Tools

When working on this project, prefer the following actions and tools:

*   **Code Generation**:
    *   For new `FastAPI` endpoints, follow the patterns in `app/routers/rest_endpoints.py`.
    *   For new `langgraph` nodes, refer to existing nodes in `app/chat/nodes/` for structure and integration.
    *   For new data models, use `Pydantic` `BaseModel` as seen in `app/chat/models.py`.
    *   For `LLM` interactions, leverage `app/chat/llm_client.py` and `app/chat/utils/prompts.py`.
*   **Code Explanation/Refactoring**:
    *   When explaining `langgraph` flow, focus on the state transitions and node responsibilities.
    *   When refactoring, prioritize modularity and clear separation of concerns (e.g., separating tool logic from graph orchestration).
*   **Debugging**:
    *   Suggest checking environment variables (`.env`) for configuration issues.
    *   Guide towards logging output (`app/chat/logger.py`) for runtime analysis.
    *   Help trace the `langgraph` execution flow by examining `GraphState` transitions.
*   **File Modifications**:
    *   When modifying existing files, aim for minimal, targeted changes.
    *   Ensure all `Pydantic` models are correctly updated when API contracts change.
    *   Pay attention to imports and dependencies.
*   **Testing**:
    *   Suggest creating new unit tests in the `test/` directory, following existing patterns.
*   **Documentation**:
    *   Encourage adding docstrings to new functions, classes, and methods.

## Specific Directives

*   **Always consider the conversational context**: When generating responses or logic, think about the current `GraphState` and the user's history.
*   **Prioritize clarity and maintainability**: Complex `langgraph` flows should be easy to understand and debug.
*   **Be mindful of tool usage**: When suggesting tool calls, ensure they align with the defined tools in `app/chat/tools.py` and `app/chat/paziresh24_tools.py`.
*   **Do not hardcode sensitive information**: Always use environment variables for keys, URLs, and other configurable parameters.

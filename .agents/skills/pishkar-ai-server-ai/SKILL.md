# Pishkar AI Backend Project

This skill provides comprehensive knowledge about the Pishkar AI backend project, a `langgraph`-based conversational AI with `FastAPI` endpoints.

## Overview

The Pishkar AI project is a Python-based backend service that leverages `FastAPI` for its API endpoints and `langgraph` for managing complex conversational flows. It integrates with a Language Model (LLM) to process user input, classify intents, fill slots, and generate responses, including tool-specific actions.

## Key Components and Architecture

- **FastAPI Application (`main.py`)**:
  - Initializes the FastAPI application.
  - Configures CORS middleware.
  - Includes API routers from `app.routers`.
- **Chat API Endpoints (`app/routers/rest_endpoints.py`)**:
  - Defines the `/api/v2/Chat` POST endpoint for handling conversational requests.
  - Utilizes the `ChatHandler` to process incoming chat messages.
  - Integrates with the usage billing lifecycle when enabled:
    - `authorize` before chat execution
    - `finalize` after successful chat
    - `mark_failed` on exceptions
  - Environment variables (`BASE_URL`, `METIS_API_KEY`, `LLM_MODEL`) are used for configuration.
- **Usage API Endpoints (`app/routers/usage_endpoints.py`)**:
  - Exposes usage and wallet APIs under `/api/v1/usage`.
  - Endpoints:
    - `POST /authorize`
    - `POST /finalize`
    - `GET /wallet/{account_id}`
    - `POST /payments/credit`
  - Maps domain usage errors to HTTP errors consistently.
- **Usage Module (`app/usage`)**:
  - Dedicated module for usage billing and credit purchase workflows.
  - Organized by layers:
    - `domain/`: enums, errors, repository protocols
    - `infrastructure/`: Mongo settings, repositories, transaction retry helper
    - `services/`: pricing, usage lifecycle, payment top-up logic
    - `models.py`: request/response DTOs and Mongo document models
  - Uses MongoDB transactions with retry (`run_transaction_with_retry`) for multi-write consistency.
- **Usage Service (`app/usage/services/usage_service.py`)**:
  - Manages usage authorization/finalization and credit deduction behavior.
  - Maintains idempotency using `(account_id, idempotency_key)` for usage requests.
  - Keeps usage history in `usage_log` and wallet balances in `credit_wallets`.
- **Payment Service (`app/usage/services/payment_service.py`)**:
  - Handles credit top-up purchases via `credit_account(request)`.
  - Uses a dedicated `payment_info` collection for payment history (separate from `usage_log`).
  - Enforces idempotency for payment callbacks via unique `(account_id, idempotency_key)`.
  - Transaction flow:
    - insert payment record as `PENDING`
    - increment `credit_wallets` balance (`available_messages` or `available_sessions`)
    - mark payment as `SUCCEEDED`
  - Handles `DuplicateKeyError` safely for replayed provider callbacks.
- **Chat Handler (`app/chat/handler.py`)**:
  - The core logic orchestrating the conversational flow.
  - Initializes an `LLMClient` for interacting with the Language Model.
  - Builds and manages a `langgraph` graph using `app.chat.graphs.builder.build_graph`.
  - Manages user sessions.
  - Processes user input through the `langgraph` or specific handlers (e.g., `paziresh24_tools.py`).
- **Langgraph Components (`app/chat/graphs`, `app/chat/nodes`)**:
  - The `langgraph` framework is used to define states, nodes, and edges for the conversational AI.
  - `app/chat/graphs/builder.py`: Responsible for constructing the `langgraph` graph.
  - `app/chat/nodes/`: Contains various nodes for different stages of the conversation (e.g., `intent_classifier.py`, `chitchat_node.py`, `appointment.py`, `inquiry.py`, `greeting_node.py`, `normalizer.py`, `android.py`).
- **LLM Client (`app/chat/llm_client.py`)**:
  - Handles communication with the external Language Model.
- **Data Models (`app/chat/models.py`)**:
  - Defines essential data structures for communication and state management:
    - `ChatRequest`, `ChatResponse`, `ChatData`, `TaskItem`
    - `ResponseType` (TEXT, OTP, ON_DEVICE, CONFIRMATION, LIST_OPTION, CARD_VIEW) and their corresponding payloads.
    - `ToolResult` for tool execution outcomes.
    - `IntentCategory`, `IntentResult` for intent classification.
    - `SlotFillerResult`, `FilledSlot` for slot filling.
    - `GraphState` for maintaining the state of the conversational flow within `langgraph`.
- **Tools Integration (`app/chat/tools.py`, `app/chat/paziresh24_tools.py`, `app/chat/android_tools.py`)**:
  - Defines the functions that the AI can "call" as part of its reasoning process.
  - `paziresh24_tools.py`: Contains tools specific to `Paziresh24` integration, such as `get_doctor_profile`.
  - `android_tools.py`: Contains tools related to Android device interactions.
- **Utilities (`app/chat/utils`)**:
  - `api_selector.py`, `conversation.py`, `inquiry_resolver.py`, `prompts.py`, `slot_filler.py`, `text_normalizer.py`.
- **Core Configuration (`app/core/config.py`, `app/core/security.py`)**:
  - Manages application settings and security-related functionalities.
- **Services (`app/services/panel_service.py`)**:
  - Contains business logic that might be consumed by routers or other parts of the application.

## Usage Collections and Indexes

- **Accounts (`accounts`)**:
  - Stores account-level billing configuration (e.g., `billing_model`, session limits).
- **Wallets (`credit_wallets`)**:
  - Stores available message/session credits per account.
  - Indexed by unique `account_id`.
- **Usage Log (`usage_log`)**:
  - Stores usage request lifecycle events (`RECEIVED`, `SUCCEEDED`, `FAILED`).
  - Includes idempotency and query indexes for account/status/time access patterns.
- **Payment Info (`payment_info`)**:
  - Dedicated payment purchase/audit collection.
  - Stores external payment reference, idempotency key, resource type, purchased units, amount/currency, status, metadata, timestamps.
  - Required indexes:
    - unique `(account_id, idempotency_key)`
    - `(account_id, created_at)` for account payment history queries

## Development Guidelines

- **FastAPI**: Follow standard `FastAPI` conventions for defining routes, request/response models, and dependency injection.
- **Langgraph**: Adhere to `langgraph`'s principles for state management, node creation, and graph construction. Each node should have a single, well-defined responsibility.
- **LLM Interactions**: Ensure `LLMClient` is correctly configured with environment variables. Prompts should be carefully crafted for effective intent classification and slot filling.
- **Error Handling**: Implement robust error handling in API endpoints and `langgraph` nodes.
- **Usage/Payment Consistency**:
  - Keep usage history (`usage_log`) separate from purchase history (`payment_info`).
  - Use Mongo transactions for multi-step write workflows affecting credits.
  - Preserve idempotency for both usage requests and payment callbacks.
  - Keep backward compatibility for existing wallet/account documents by relying on defaults and upserts.
- **Logging**: Use the `app.chat.logger.get_logger` for consistent logging across the application.
- **Environment Variables**: Manage sensitive information and configuration through environment variables (e.g., `.env` file).

## Common Tasks

- Adding new API endpoints.
- Extending usage billing flows (`authorize`, `finalize`, `mark_failed`) without breaking chat behavior.
- Adding new payment callback/top-up behaviors in `PaymentService` with idempotent transaction semantics.
- Updating Mongo indexes for usage/payment query patterns.
- Extending conversational flows with new `langgraph` nodes.
- Integrating new external tools.
- Modifying `LLM` prompts.
- Updating data models.
- Debugging conversational flow issues.

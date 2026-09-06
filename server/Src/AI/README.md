# AI Langchain Project

This project contains the AI components for the Pishkar application, built using Langchain. 

## Project Structure

- `app/`: Contains the core application logic, including chat handlers, LLM client, and various nodes for intent classification, inquiry resolution, etc.
- `routers/`: Defines the API endpoints for interacting with the AI.
- `services/`: Provides services for external interactions.
- `test/`: Contains test files and data.

## Setup

1.  **Environment Variables**: Create a `.env` file based on `.env.example` and fill in the necessary values.
2.  **Install Dependencies**: Run `pip install -r requirements.txt` to install all required Python packages.

## Virtual Environment Setup

It is recommended to use a virtual environment to manage dependencies.

1.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    ```
2.  **Activate the virtual environment**:
    *   **Windows**:
        ```bash
        .\venv\Scripts\activate
        ```
    *   **macOS/Linux**:
        ```bash
        source venv/bin/activate
        ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

To start the AI service, run the following command from the `AI` directory:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

This will start the FastAPI application, making the AI endpoints available at `http://127.0.0.1:8000`.

Use more workders for better performance:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
```
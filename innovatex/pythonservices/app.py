import huggingface_hub

# Monkeypatch for Hugging Face Hub >=0.26 deprecation of HfFolder
if not hasattr(huggingface_hub, "HfFolder"):
    class MockHfFolder:
        @staticmethod
        def get_token():
            import os
            return os.environ.get("HF_TOKEN")
        @staticmethod
        def save_token(token):
            pass
        @staticmethod
        def delete_token():
            pass
    huggingface_hub.HfFolder = MockHfFolder

import gradio as gr
from main import app as fastapi_app

with gr.Blocks(title="Joblio AI Microservice") as demo:
    gr.Markdown("# 🚀 Joblio Developer Intelligence & AI Microservice")
    gr.Markdown("Real-time telemetry, LangGraph multi-agent workflows, and Facebook Prophet / Auto-ARIMA forecasting.")
    with gr.Row():
        status = gr.Textbox(value="🟢 System Healthy & Active", label="Microservice Status", interactive=False)
        ram_info = gr.Textbox(value="16 GB RAM • High Throughput", label="Compute Tier", interactive=False)

# Mount FastAPI app onto Gradio so all endpoints (/analyze, /forecast, etc.) are available directly
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

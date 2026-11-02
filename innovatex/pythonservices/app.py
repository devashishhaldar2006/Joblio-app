import gradio as gr
from main import app as fastapi_app

# Mount the entire Joblio FastAPI AI application inside Gradio
# This preserves all REST endpoints (/analyze, /forecast, /jobs, etc.) directly at root
# while providing a sleek visual status dashboard on the Hugging Face Space page.

with gr.Blocks(title="Joblio AI Microservice") as demo:
    gr.Markdown("# 🚀 Joblio Developer Intelligence & AI Microservice")
    gr.Markdown("Real-time telemetry, LangGraph multi-agent workflows, and Facebook Prophet / Auto-ARIMA forecasting.")
    with gr.Row():
        status = gr.Textbox(value="🟢 System Healthy & Active", label="Microservice Status", interactive=False)
        ram_info = gr.Textbox(value="16 GB RAM • High Throughput", label="Compute Tier", interactive=False)

# Mount FastAPI app onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

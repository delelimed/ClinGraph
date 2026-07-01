import modal

app = modal.App("clingraph")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi", "uvicorn", "neo4j", "python-dotenv", "pydantic", "pyyaml",
        "python-multipart", "streamlit", "requests", "networkx", "plotly",
    )
    .workdir("/app")
    .add_local_dir("backend", "/app/backend", copy=True)
    .add_local_dir("data", "/app/data", copy=True)
    .add_local_dir("frontend/dist", "/app/frontend/dist", copy=True)
    .add_local_file("streamlit_app.py", "/app/streamlit_app.py", copy=True)
)

volume = modal.Volume.from_name("clingraph-data", create_if_missing=True)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("clingraph-neo4j")],
    volumes={"/vol": volume},
    min_containers=1,
)
@modal.asgi_app()
def fastapi_app():
    import shutil
    import os
    import sys

    os.environ.setdefault("PYTHONPATH", "/app")
    sys.path.insert(0, "/app")

    vol_dir = "/vol"
    app_data_dir = "/app/backend/data"

    if not os.path.exists(os.path.join(vol_dir, "admin_users.json")):
        if os.path.isdir(app_data_dir):
            for item in os.listdir(app_data_dir):
                src = os.path.join(app_data_dir, item)
                dst = os.path.join(vol_dir, item)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
                elif os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
        volume.commit()

    if os.path.islink(app_data_dir):
        os.unlink(app_data_dir)
    elif os.path.isdir(app_data_dir):
        shutil.rmtree(app_data_dir)
    os.symlink(vol_dir, app_data_dir)

    from backend.app.main import app as fastapi

    return fastapi


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("clingraph-neo4j")],
    min_containers=1,
)
@modal.web_server(port=8501)
def streamlit_ui():
    import subprocess
    import os

    backend_url = os.environ.get("BACKEND_URL", "")
    os.environ["BACKEND_URL"] = backend_url

    subprocess.Popen([
        "streamlit", "run", "/app/streamlit_app.py",
        "--server.port=8501",
        "--server.address=0.0.0.0",
        "--server.headless=true",
        "--browser.gatherUsageStats=false",
    ])

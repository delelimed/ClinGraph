from fastapi import FastAPI
from backend.app.api.diagnosi import router as diagnosi_router
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = FastAPI(title="Clingraph")

app.include_router(diagnosi_router)
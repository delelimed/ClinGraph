# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router as diagnosi_router  # Import relativo protetto per la produzione

app = FastAPI(title="ClinGraph CDSS API")

# Abilitiamo le origini CORS in modo che il frontend su Render possa comunicare liberamente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione puoi inserire l'URL specifico del tuo frontend Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnosi_router)

@app.get("/")
def home():
    return {"status": "online", "message": "ClinGraph Backend funzionante su Render"}
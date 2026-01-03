import os
import joblib
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

# Chemin du modèle (modifiable via variable d'environnement)
MODEL_PATH = os.getenv("MODEL_PATH", "models/best_gradient_boost_model.joblib")

# Clé API stockée côté serveur (variable d'environnement)
API_KEY = os.getenv("API_KEY")  # ex: "mon-secret"

app = FastAPI(title="Medical Cost Prediction API")

# Chargement du modèle au démarrage
@app.on_event("startup")
def _load_model():
    global model
    model = joblib.load(MODEL_PATH)

class PatientFeatures(BaseModel):
    age: int = Field(..., ge=0, le=120)
    sex: str
    bmi: float
    children: int = Field(..., ge=0, le=20)
    smoker: str
    region: str


#Ajout du middleware CORS pour permettre les requêtes depuis n'importe quelle origine
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(payload: PatientFeatures, x_api_key: str | None = Header(default=None, alias="X-API-Key")):
    # Vérification de la clé API (si API_KEY est défini)
    if API_KEY is not None and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    X = pd.DataFrame([payload.model_dump()])
    pred = model.predict(X)[0]
    return {"predicted_cost": float(pred)}

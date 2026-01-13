import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

# Chemin du modèle (modifiable via variable d'environnement)
MODEL_PATH = os.getenv("MODEL_PATH", "models/best_gradient_boost_model.joblib")

# Clé API stockée côté serveur (variable d'environnement)
API_KEY = os.getenv("API_KEY") #mon-secret

app = FastAPI(title="Medical Cost Prediction API")

model = None  # évite les NameError

@app.on_event("startup")
def _load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        # On laisse l'API démarrer mais /predict échouera proprement
        model = None
        print(f"[ERROR] Failed to load model from {MODEL_PATH}: {e}")

class PatientFeatures(BaseModel):
    age: int = Field(..., ge=0, le=120)
    sex: str
    bmi: float
    children: int = Field(..., ge=0, le=20)
    smoker: str
    region: str

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

@app.post("/predict")
def predict(
    payload: PatientFeatures,
    x_api_key: str | None = Header(default=None, alias="X-API-Key")
):
    # Vérification de la clé API (si API_KEY est défini)
    if API_KEY is not None and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if model is None:
        raise HTTPException(status_code=500, detail=f"Model not loaded: {MODEL_PATH}")

    X = pd.DataFrame([payload.model_dump()])

    # ✅ Reproduire exactement la logique du notebook
    X["is_obese"] = np.where(X["bmi"] >= 30, "yes", "no")

    pred = model.predict(X)[0]
    return {"predicted_cost": float(pred)}

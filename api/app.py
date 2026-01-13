# =========================
# Imports / dépendances
# =========================
import os                      # lire les variables d’environnement (MODEL_PATH, API_KEY)
import joblib                  # charger le modèle ML sauvegardé (pipeline sklearn, etc.)
import numpy as np             # créer is_obese via np.where
import pandas as pd            # construire un DataFrame compatible avec le modèle
from fastapi import FastAPI, Header, HTTPException  # API + gestion headers + erreurs HTTP propres
from pydantic import BaseModel, Field               # validation du JSON d’entrée (types + contraintes)
from fastapi.middleware.cors import CORSMiddleware  # autoriser appels depuis un front web (CORS)

# =========================
# Configuration (via env)
# =========================

# Chemin du modèle (modifiable via variable d'environnement)
# - Si la variable d'env MODEL_PATH existe -> on l'utilise
# - Sinon -> valeur par défaut : "models/best_gradient_boost_model.joblib"
MODEL_PATH = os.getenv("../models/best_gradient_boost_model.joblib")

# Clé API stockée côté serveur (variable d'environnement)
# Si API_KEY n’est pas définie dans l’environnement -> API ouverte sans authentification
API_KEY = os.getenv("API_KEY")  # ex: "mon-secret"

# Création de l’application FastAPI (nom affiché dans /docs)
app = FastAPI(title="Medical Cost Prediction API")

# Variable globale pour stocker le modèle chargé au démarrage
# (évite NameError si le chargement échoue)
model = None

# =========================
# Chargement du modèle au démarrage
# =========================
@app.on_event("startup")
def _load_model():
    """
    Au démarrage du serveur, on tente de charger le modèle depuis MODEL_PATH.
    - Si OK : model contient le pipeline et /predict fonctionne
    - Si échec : model reste None, mais l'API démarre quand même
               (et /predict renverra une erreur explicite).
    """
    global model
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        # On laisse l'API démarrer mais /predict échouera proprement
        model = None
        print(f"[ERROR] Failed to load model from {MODEL_PATH}: {e}")

# =========================
# Schéma des données d’entrée (JSON)
# =========================
class PatientFeatures(BaseModel):
    """
    Décrit et valide automatiquement le payload JSON attendu par /predict.
    Pydantic vérifie les types + contraintes.
    """
    age: int = Field(..., ge=0, le=120)       # age obligatoire, entre 0 et 120
    sex: str                                 # ex: "male" / "female"
    bmi: float                               # BMI numérique
    children: int = Field(..., ge=0, le=20)   # enfants obligatoires, entre 0 et 20
    smoker: str                              # ex: "yes" / "no"
    region: str                              # ex: "southwest", etc.

# =========================
# CORS (autoriser appels depuis un site / front)
# =========================
# Ici on autorise TOUTES les origines, méthodes et headers.
# Pratique pour dev / demo, mais en prod on peut restreindre allow_origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # toutes les origines (fronts autorisés)
    allow_credentials=True,      # autorise cookies/credentials si nécessaires
    allow_methods=["*"],         # toutes les méthodes (GET/POST/...)
    allow_headers=["*"],         # tous les headers (dont X-API-Key)
)

# =========================
# Route de santé (healthcheck)
# =========================
@app.get("/health")
def health():
    """
    Endpoint simple pour vérifier que l’API tourne.
    Renvoie aussi :
    - model_loaded : est-ce que le modèle est bien chargé ?
    - model_path   : chemin du modèle utilisé (utile en debug).
    """
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

# =========================
# Route de prédiction
# =========================
@app.post("/predict")
def predict(
    payload: PatientFeatures,
    x_api_key: str | None = Header(default=None, alias="X-API-Key")
):
    """
    Reçoit les features en JSON, vérifie l'API key (si activée),
    reconstruit les features attendues par le modèle puis renvoie une prédiction.
    """

    # 1) Auth : Vérification de la clé API (si API_KEY est défini côté serveur)
    # - Si API_KEY est None => pas de protection
    # - Sinon => le client doit envoyer X-API-Key avec la bonne valeur
    if API_KEY is not None and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # 2) Vérifie que le modèle est chargé (sinon on renvoie une erreur claire)
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model not loaded: {MODEL_PATH}")

    # 3) Conversion du payload validé en DataFrame 1 ligne
    # model_dump() -> dict Python ; [dict] -> une ligne
    X = pd.DataFrame([payload.model_dump()])

    # 4) Feature engineering : reproduire la logique du notebook
    # Création de la variable is_obese à partir du bmi
    # - bmi >= 30 => "yes"
    # - bmi < 30  => "no"
    X["is_obese"] = np.where(X["bmi"] >= 30, "yes", "no")

    # 5) Prédiction (on récupère la première valeur car 1 seule ligne)
    pred = model.predict(X)[0]

    # 6) Réponse JSON (float pour être sérialisable)
    return {"predicted_cost": float(pred)}

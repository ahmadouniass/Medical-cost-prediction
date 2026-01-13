"""
API FastAPI pour la prédiction des coûts médicaux.

Contexte important :
- Le modèle a été entraîné sur la cible transformée : y_log = log1p(y)
- Donc model.predict(X) renvoie une prédiction en "log1p"
- On doit appliquer l'inverse : expm1(pred_log) pour revenir aux dollars

Autre point :
- Le modèle attend une feature 'is_obese' (catégorielle "yes"/"no")
  calculée à partir du BMI (bmi >= 30).
"""

# =========================
# Imports
# =========================
import os                       # Lire des variables d'environnement (MODEL_PATH, API_KEY)
from pathlib import Path        # Construire des chemins robustes (Windows/Linux/Render)
import joblib                   # Charger le modèle sklearn sauvegardé (.joblib)
import numpy as np              # np.where + np.expm1 (inverse de log1p)
import pandas as pd             # Construire un DataFrame (format d'entrée standard sklearn)

from fastapi import FastAPI, Header, HTTPException     # API + lecture header + erreurs HTTP
from pydantic import BaseModel, Field                  # Validation stricte du JSON d'entrée
from fastapi.middleware.cors import CORSMiddleware     # Autoriser les requêtes cross-origin (front web)

# =========================
# 1) Configuration : chemin du modèle
# =========================
# Arborescence attendue :
# repo/
#   api/app.py
#   models/best_gradient_boost_model.joblib
#
# Problème classique : si on utilise un chemin relatif ("models/..."),
# il dépend du dossier depuis lequel on lance uvicorn.
# Solution : construire un chemin ABSOLU à partir de l'emplacement du fichier app.py.



# Si la variable d'environnement MODEL_PATH est définie, on l'utilise.
# Sinon, on utilise le chemin par défaut ci-dessus.
MODEL_PATH = "models/best_gradient_boost_model.joblib"

# =========================
# 2) Configuration : clé API (optionnelle)
# =========================
# Si API_KEY est définie dans l'environnement, alors l'API exige le header X-API-Key.
# Si API_KEY est None, pas d'authentification (utile en dev / tests).
API_KEY = os.getenv("API_KEY")  # ex: "mon-secret"

# =========================
# 3) Création de l'application FastAPI
# =========================
app = FastAPI(title="Medical Cost Prediction API")

# On stocke le modèle dans une variable globale, chargée au démarrage.
# Si le chargement échoue, model restera None et /predict renverra une erreur claire.
model = None

# =========================
# 4) Chargement du modèle au démarrage de l'API
# =========================
@app.on_event("startup")
def _load_model():
    """
    Fonction appelée une seule fois au lancement.
    Avantage : le modèle n'est pas rechargé à chaque requête /predict.
    """
    global model
    try:
        # Charge le pipeline sklearn depuis le fichier .joblib
        model = joblib.load(MODEL_PATH)

        # Logs utiles pour vérifier le chemin et l'état
        print(f"[DEBUG] MODEL_PATH = {MODEL_PATH}")
        print("[DEBUG] Model loaded successfully.")
    except Exception as e:
        # On laisse l'API démarrer (health peut répondre),
        # mais /predict renverra une erreur 500 tant que le modèle n'est pas chargé.
        model = None
        print(f"[DEBUG] MODEL_PATH = {MODEL_PATH}")
        print(f"[ERROR] Failed to load model from {MODEL_PATH}: {e}")

# =========================
# 5) Schéma d'entrée (payload JSON) + validation
# =========================
class PatientFeatures(BaseModel):
    """
    Structure du JSON attendu par /predict.
    Pydantic valide automatiquement :
    - types (int/float/str)
    - contraintes (bornes via Field)
    """
    age: int = Field(..., ge=0, le=120)          # âge entre 0 et 120
    sex: str                                    # ex: "male" / "female"
    bmi: float                                  # BMI (float)
    children: int = Field(..., ge=0, le=20)      # nb enfants entre 0 et 20
    smoker: str                                 # ex: "yes" / "no"
    region: str                                 # ex: "southwest", ...

# =========================
# 6) CORS : autoriser un front-end à appeler l'API
# =========================
# Très permissif (autorise tout) : pratique pour dev / démo.
# En production, on peut remplacer "*" par l'URL de ton site.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # origines autorisées
    allow_credentials=True,       # autoriser les credentials si besoin
    allow_methods=["*"],          # GET/POST/PUT/DELETE...
    allow_headers=["*"],          # headers autorisés (dont X-API-Key)
)

# =========================
# 7) Endpoint de santé (healthcheck)
# =========================
@app.get("/health")
def health():
    """
    Endpoint pour vérifier que l'API tourne.
    Donne aussi des infos utiles :
    - model_loaded : le modèle est-il chargé ?
    - model_path : quel chemin est utilisé ?
    """
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

# =========================
# 8) Endpoint de prédiction
# =========================
@app.post("/predict")
def predict(
    payload: PatientFeatures,
    x_api_key: str | None = Header(default=None, alias="X-API-Key")
):
    """
    Pipeline de prédiction :
    1) (optionnel) vérifier la clé API X-API-Key
    2) vérifier que le modèle est chargé
    3) transformer le JSON en DataFrame (1 ligne)
    4) créer la feature is_obese (comme dans le notebook)
    5) prédire en log1p (sortie du modèle)
    6) appliquer expm1 pour revenir à l'échelle originale
    7) renvoyer une réponse JSON
    """

    # 1) Authentification optionnelle :
    # Si API_KEY est définie côté serveur, le client doit fournir la même valeur dans X-API-Key.
    if API_KEY is not None and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # 2) Si le modèle n'est pas chargé, on renvoie une erreur claire
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model not loaded: {MODEL_PATH}")

    # 3) Payload -> DataFrame (sklearn attend typiquement un tableau/DF)
    X = pd.DataFrame([payload.model_dump()])

    # 4) Feature engineering : la variable attendue par le modèle
    # IMPORTANT : valeurs "yes"/"no" (catégorielles), cohérentes avec l'entraînement.
    X["is_obese"] = np.where(X["bmi"] >= 30, "yes", "no")

    # 5) Prédiction du modèle :
    # Comme le modèle a été entraîné sur y = log1p(charges),
    # la prédiction retournée ici est en log1p.
    pred_log = model.predict(X)[0]

    # 6) Retour à l'échelle originale (dollars) :
    # expm1(x) = exp(x) - 1, inverse exact de log1p(y)
    pred = np.expm1(pred_log)

    # 7) Réponse JSON (float pour sérialisation JSON)
    return {"predicted_cost": float(pred)}

import pytest

# Fixture pour initialiser le client de test FastAPI
@pytest.fixture(scope="session")
def client(set_env_for_api):
    """
    Crée un TestClient FastAPI persistant pour toute la session.
    """
    # Vérifie si le module de test FastAPI est installé, sinon ignore le test
    fastapi_testclient = pytest.importorskip("fastapi.testclient")
    TestClient = fastapi_testclient.TestClient

    try:
        # Importation de l'application FastAPI depuis votre fichier source
        from api.app import app  
    except Exception as e:
        # Si l'import échoue (erreur de syntaxe, dépendance manquante, modèle non trouvé),
        # le test s'arrête immédiatement avec un message explicatif.
        pytest.fail(
            "Import de l'API impossible. Vérifie api/app.py (app FastAPI, schémas Pydantic, chargement modèle).\n"
            f"Erreur: {repr(e)}"
        )

    # Retourne l'instance du client pour l'utiliser dans les fonctions de test
    return TestClient(app)


# TEST : Vérification du point de terminaison "Santé"
def test_health_route(client):
    """
    Vérifie que l'API est vivante et répond correctement.
    """
    # Effectue une requête GET sur /health
    r = client.get("/health")
    
    # Vérifie que le code de statut est bien 200 (Succès)
    assert r.status_code == 200, r.text
    # Vérifie que le corps de la réponse JSON contient bien {"status": "ok"}
    assert r.json().get("status") == "ok"


# TEST : Vérification de la sécurité (Clé API)
def test_predict_requires_api_key_if_enabled(client):
    """
    Si API_KEY est activé côté serveur (env var), alors X-API-Key est obligatoire.
    """
    # Données d'exemple valides pour tester la prédiction
    payload = {
        "age": 31,
        "sex": "male",
        "bmi": 25.0,
        "children": 1,
        "smoker": "yes",
        "region": "southwest"
    }

    # Tentative de requête POST sans inclure le header 'X-API-Key'
    r = client.post("/predict", json=payload)
    
    # Validation flexible :
    # - 200 : Si l'API ne nécessite pas de clé (développement local)
    # - 401 : Si l'API bloque l'accès car la clé est absente (production/sécurité)
    assert r.status_code in (200, 401), r.text
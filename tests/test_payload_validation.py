import pytest

# Définition d'une fixture Pytest pour créer un client de test
# scope="session" : le client est créé une seule fois pour toute la session de tests (gain de performance)
@pytest.fixture(scope="session")
def client(set_env_for_api):
    # Tente d'importer le client de test de FastAPI. 
    # Si fastapi n'est pas installé, le test sera ignoré (skip) au lieu de planter.
    fastapi_testclient = pytest.importorskip("fastapi.testclient")
    TestClient = fastapi_testclient.TestClient
    
    # Import local de l'application FastAPI pour s'assurer que les variables 
    # d'environnement (set_env_for_api) sont chargées avant l'app.
    from api.app import app
    
    # Retourne une instance de TestClient qui permet de simuler des requêtes HTTP
    return TestClient(app)


# TEST 1 : Vérifie que l'API rejette une requête si des champs obligatoires manquent
def test_predict_rejects_missing_fields(client):
    # Envoi d'un corps de requête (JSON) vide {} à l'endpoint /predict
    # On inclut une clé API dans les headers pour passer la sécurité
    r = client.post("/predict", json={}, headers={"X-API-Key": "mon-secret"})
    
    # Validation :
    # 422 (Unprocessable Entity) : Code renvoyé par FastAPI/Pydantic si les données manquent
    # 401 (Unauthorized) : Code renvoyé si la clé API est refusée
    # r.text affiche le message d'erreur détaillé en cas d'échec de l'assertion
    assert r.status_code in (422, 401), r.text


# TEST 2 : Vérifie que l'API rejette des données ayant un mauvais type (ex: texte au lieu de nombre)
def test_predict_rejects_wrong_types(client):
    # Préparation d'un payload invalide : 
    # 'age' et 'bmi' reçoivent des strings ("trente", "beaucoup") au lieu de float/int
    payload = {
        "age": "trente",
        "sex": "male",
        "bmi": "beaucoup",
        "children": "un",
        "smoker": "yes",
        "region": "southwest"
    }
    
    # Envoi de la requête POST avec les données mal formées
    r = client.post("/predict", json=payload, headers={"X-API-Key": "mon-secret"})
    
    # Validation : on attend encore une erreur de validation (422)
    assert r.status_code in (422, 401), r.text
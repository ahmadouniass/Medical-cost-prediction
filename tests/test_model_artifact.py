import pytest

# TEST 1 : Vérifie physiquement la présence du fichier sur le disque
def test_model_file_exists(model_path):
    # model_path est probablement un objet Path (pathlib) injecté via une fixture
    # .exists() renvoie True si le fichier .joblib ou .pkl est bien au bon endroit
    assert model_path.exists(), f"Modèle introuvable: {model_path}"


# TEST 2 : Vérifie la compatibilité technique du modèle (Chargement)
def test_model_can_be_loaded(model_path):
    """
    Test critique: le modèle doit pouvoir se charger via joblib.
    S'il échoue (versions sklearn/numpy), tu le sauras immédiatement.
    """
    # Importation sécurisée de joblib : si absent, le test est sauté (skip)
    joblib = pytest.importorskip("joblib")

    try:
        # Tentative de désérialisation du modèle en mémoire
        # On utilise '_' car on n'a pas besoin de stocker l'objet, juste de vérifier qu'il ne crashe pas
        _ = joblib.load(model_path)
        
    except Exception as e:
        # En cas d'erreur (ex: AttributeError, ModuleNotFoundError), on force l'échec du test
        # avec un message pédagogique expliquant la cause probable
        pytest.fail(
            "Impossible de charger le modèle avec joblib.\n"
            "Ca indique souvent un mismatch de versions (numpy/sklearn) entre entraînement et exécution.\n"
            f"Erreur: {repr(e)}"
        )
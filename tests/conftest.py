import os
import sys
from pathlib import Path

import pytest

# FIXTURE : Identifie dynamiquement la racine du projet
@pytest.fixture(scope="session")
def project_root() -> Path:
    """
    Détermine la racine du projet (le dossier parent du dossier de tests).
    Généralement, c'est le dossier qui contient 'requirements.txt' ou 'api/'.
    """
    # Path(__file__) est le chemin de ce fichier de test
    # .parents[1] remonte de deux niveaux pour atteindre la racine
    root = Path(__file__).resolve().parents[1]
    return root


# FIXTURE : Ajoute le projet au PATH de Python
# autouse=True : s'exécute automatiquement sans avoir besoin de l'appeler
@pytest.fixture(scope="session", autouse=True)
def add_project_to_syspath(project_root: Path):
    """
    Permet à Python de trouver le dossier 'api' ou 'models' même si 
    on lance pytest depuis l'extérieur du projet.
    """
    sys.path.insert(0, str(project_root))


# FIXTURE : Localise le fichier du modèle entraîné
@pytest.fixture(scope="session")
def model_path(project_root: Path) -> Path:
    """
    Retourne le chemin absolu vers le fichier .joblib du modèle.
    """
    return (project_root / "models" / "best_gradient_boost_model.joblib").resolve()


# FIXTURE : Gère le répertoire de travail (Working Directory)
@pytest.fixture(scope="session", autouse=True)
def force_cwd_project_root(project_root: Path):
    """
    IMPORTANT : Force le dossier de travail sur la racine du projet.
    Cela permet aux chemins relatifs comme 'models/mon_modele.joblib' 
    de fonctionner correctement pendant les tests.
    """
    old = Path.cwd() # Sauvegarde l'ancien dossier
    os.chdir(project_root) # Se déplace à la racine
    yield
    os.chdir(old) # Revient à l'ancien dossier après la fin des tests


# FIXTURE : Configure les variables d'environnement
@pytest.fixture(scope="session", autouse=True)
def set_env_for_api(model_path: Path):
    """
    Définit les variables d'environnement nécessaires à l'API 
    AVANT que 'api.app' ne soit importé.
    """
    # Force le chemin du modèle pour que l'API sache où charger le .joblib
    os.environ["MODEL_PATH"] = str(model_path)
    
    # Définit une clé API par défaut pour les tests de sécurité
    os.environ.setdefault("API_KEY", "test-secret")
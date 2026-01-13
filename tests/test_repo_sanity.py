from pathlib import Path

# TEST : Vérification de l'arborescence du projet
def test_expected_structure(project_root: Path):
    """
    Vérifie que tous les fichiers et dossiers vitaux sont présents à la racine.
    Cela évite les erreurs de déploiement (ex: oubli du fichier requirements).
    """
    
    # Liste des éléments (fichiers ou dossiers) dont la présence est obligatoire
    expected = [
        project_root / "requirements.txt", # Indispensable pour l'installation des dépendances
        project_root / "models",           # Contient les artefacts (.joblib) du modèle ML
        project_root / "api",              # Dossier contenant le code FastAPI
        project_root / "web",              # Dossier contenant l'interface (Streamlit ou autre)
        project_root / "tests",            # Dossier contenant les tests unitaires/intégration
    ]
    
    # Parcours la liste et récupère uniquement les chemins qui n'existent pas sur le disque
    missing = [p for p in expected if not p.exists()]
    
    # Si la liste 'missing' n'est pas vide, le test échoue et affiche les éléments manquants
    # L'assertion 'not missing' est vraie si la liste est vide.
    assert not missing, f"Éléments manquants dans l'arborescence : {missing}"
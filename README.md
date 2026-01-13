# 💊 Medical Cost Prediction

Projet de **Machine Learning** visant à prédire les **coûts médicaux individuels** à partir de caractéristiques socio-démographiques et comportementales (âge, sexe, IMC, tabagisme, région, etc.).

Le projet couvre **l'ensemble du cycle Data Science** : exploration des données, préparation, modélisation, évaluation, tests de robustesse et déploiement via une **API FastAPI** consommée par une **interface web**.

---

## 🎯 Objectifs du projet
- Construire un modèle de prédiction fiable des coûts médicaux  
- Comparer plusieurs algorithmes de régression
- Assurer la **reproductibilité** (pipelines, tests, artefacts)
- Déployer le modèle via une **API REST**
- Proposer une interface web simple pour l'utilisation du modèle

---

## 🧠 Modélisation
- Prétraitement via **Pipeline & ColumnTransformer**
- Modèles testés :  
  - Régression linéaire
  - Régressions pénalisées  
  - Random Forest  
  - Gradient Boosting / XGBoost / LightGBM  
- Sélection du meilleur modèle selon **RMSE**
- Sauvegarde du pipeline du meilleur modèle (`best_gradient_boost_model.joblib`)

---

## 🚀 Déploiement
- **API** : FastAPI  
- **Hébergement API** : Render  
- **Interface web** : HTML / CSS / JavaScript (Netlify)  
---

## 🌐 Liens importants
- 📄 **[Note technique (Canva)](https://www.canva.com/design/DAG9k7kWhFY/ZVeeoX8dsdsC_pgFgFbFBA/edit)**

- 📊 **[Slides de présentation (Canva)](https://www.canva.com/design/DAG8tUKBnOY/e2V6SIHGZczz6SZgxg1djg/edit)**

- 🔌 **[API FastAPI](https://medical-cost-prediction-gh3u.onrender.com)**

- 🖥️ **[Interface Web](https://medical-cost-api.netlify.app/)**
---

## 📁 Organisation du répertoire

```
Medical-cost-prediction/
│
├── api/                            # API FastAPI pour l'inférence
│   ├── app.py                      # Point d'entrée de l'API
│
├── models/                         # Artefacts du Machine Learning
│   ├── best_gradient_boost_model.joblib           # Pipeline complet avec le meilleur modèle
│
├── notebooks/                      # Développement et expérimentation
│   ├── EDA_full_codes.ipynb        # Analyse exploratoire complète des données
│   ├── Modélisation.ipynb          # Entraînement, comparaison et sélection du modèle
│
├── documentation/                  #Documentation du projet
│   ├── HealthCostsPrediction._presentation.pdf   
│    ├── Health Costs Note technique.pdf 
│    ├── lien_vers_note_technique.txt
│    ├── lien_vers_le_canva.txt           
├── tests/                          # Tests automatisés (pytest)
│   ├── conftest.py                 # Config globale et test sur la base
│   ├── test_api_contract.py        # Tests des endpoints de l'API
│   ├── test_categories_domain.py   # Validation des modalités catégorielles
│   ├── test_data_quality.py        # Tests de qualité des données
│   ├── test_eda_findings.py        # Vérification des constats issus de l'EDA
│   ├── test_model_artifact.py      # Tests de chargement du modèle
│   ├── test_payload_validation.py  # Validation des données d'entrée de l'API
│   ├── test_repo_sanity.py         # Tests de cohérence globale du dépôt
│   ├── test_schema_and_types.py    # Vérification des types et des schémas
│   
│
├── web/                            # Interface web cliente
│   ├── index.html                  # Page principale
│   ├── styles.css                  # Styles de l'interface
│   ├── script.js                   # Appels à l'API et logique front-end
│
├── requirements.txt                # Dépendances d'exécution
├── requirements-dev.txt            # Dépendances de développement et de tests
├── README.md                       # Documentation du projet
├── .gitignore                      # Fichiers ignorés par Git
```

---

## 👥 Équipe projet
Projet réalisé par un groupe de **5 membres** :

- **[Mamady I BERETE](https://github.com/Kefimba)**
- **[Gandwende Judicaël Oscar KAFANDO](https://github.com/Oscar-AS)**
- **[Samba Sow](https://github.com/Samba99Sow)**
- **[Khadidiatou Coulibaly](https://github.com/Khadidiatou1010)**
- **[Ahmadou Niass](https://github.com/ahmadouniass)**
---

## 🧪 Tests & Qualité
- Validation du schéma d'entrée
- Vérification des catégories et domaines
- Tests de chargement du modèle
- Tests de cohérence des prédictions
- Tests de santé de l'API (`/health`)

---

## 📌 Remarques
Ce projet met l'accent sur :
- la **rigueur méthodologique**
- la **traçabilité des transformations**
- la **séparation claire entraînement / inférence**
- les bonnes pratiques de **déploiement ML**

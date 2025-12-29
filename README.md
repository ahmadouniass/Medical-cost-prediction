## Charte Git (obligatoire)

1. **Interdiction de push direct sur `main`**  
   → tout passe par **branche + Pull Request (PR)**.

2. **1 branche = 1 tâche**  
   Nommage standard :
   - `feature/eda`
   - `feature/modeling`
   - `feature/api`
   - `chore/tests-ci-docs`
   - `fix/xxx`

3. **1 PR = 1 sujet**  
   Pas de mélange EDA / API / Tests / CI dans une même PR.

4. **PR petites et fréquentes**  
   Plus une PR est petite, plus elle est facile à relire et à merger.

5. **CI verte obligatoire avant merge**  
   Les étapes **ruff + pytest** doivent passer.

6. **Au moins 1 review obligatoire**  
   Le lead ou un membre concerné valide la PR.

7. **Messages de commit clairs**  
   Formats recommandés :
   - `Add ...`
   - `Fix ...`
   - `Docs ...`
   - `Refactor ...`

8. **Toujours se mettre à jour avant de commencer**  
   On travaille sur un `main` à jour.

9. **Les conflits sont corrigés par l’auteur de la PR**  
   Celui qui ouvre la PR est responsable de la résolution.

10. **Aucune donnée ou modèle lourd dans Git**  
    Les dossiers `data/` et `models/` restent ignorés.

---

## Workflow Git — Commandes officielles

### 0) Première fois (cloner le dépôt)
```bash
git https://github.com/ahmadouniass/Medical-cost-prediction.git
cd Medical-cost-prediction
````

### 1) Avant de commencer une tâche (obligatoire)

```bash
git checkout main
git pull --rebase
```

### 2) Créer une branche (1 tâche = 1 branche)

```bash
git checkout -b feature/eda
# ou feature/modeling
# ou feature/api
# ou chore/tests-ci-docs
# ou fix/xxx
```

### 3) Vérification locale (recommandée)

```bash
ruff check .
pytest -q
```

### 4) Commit

```bash
git add .
git commit -m "Add EDA notebook"
```

### 5) Push de la branche

```bash
git push -u origin feature/eda
```

### 6) Pull Request (sur GitHub)

* Base : `main`
* Attendre **CI verte**
* Demander **au moins 1 review**
* Merge uniquement si la CI est verte

### 7) Mettre à jour sa branche si `main` avance

```bash
git pull --rebase origin main
git push
```

### 8) Après merge (se resynchroniser)

```bash
git checkout main
git pull --rebase
```

### 9) Nettoyage local (optionnel)

```bash
git branch -d feature/eda
```


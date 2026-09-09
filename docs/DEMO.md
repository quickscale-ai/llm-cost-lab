# Déroulé de la démo — Masterclass IMPACT IA 2026

Vendredi 11 septembre 2026, 10h30–11h30 · Latrille Events, Abidjan
30 min de présentation + 30 min d'échange.

---

## 1. Le texte de l'issue à créer en direct

À dicter à Claude Desktop (via le MCP GitHub) ou à coller tel quel.
**Titre :** `Ajouter un mode « estimation agentic »`

```markdown
## Besoin

Le simulateur actuel raisonne en volume brut de tokens. Ce n'est pas la façon
dont on budgète un déploiement d'agents : on raisonne en nombre de tâches, et
chaque tâche consomme plusieurs appels au modèle.

## Comportement attendu

Ajouter un second mode de simulation, accessible par un onglet à côté du mode
« volume » actuel, avec quatre champs :

| Champ | Valeur par défaut |
|---|---|
| Nombre de tâches | 50 |
| Itérations (appels) par tâche | 10 |
| Tokens en entrée par appel | 8 000 |
| Tokens en sortie par appel | 1 500 |

Le mode affiche le nombre total d'appels (tâches × itérations) et, pour chaque
modèle, le coût total projeté ainsi que le coût par tâche. Le classement, le
filtre par fournisseur et la bascule USD/FCFA existants continuent de
s'appliquer.

## Périmètre

Hors périmètre : la mise en cache des prompts, les paliers de contexte long, et
toute persistance des paramètres.

## Critères d'acceptation

- [ ] Un onglet permet de basculer entre « Volume » et « Estimation agentic »
- [ ] Le nombre total d'appels est affiché en clair
- [ ] Chaque modèle affiche son coût total et son coût par tâche
- [ ] Le classement reste du moins cher au plus cher

@claude prends en charge cette issue et ouvre une Pull Request.
```

**Note volontaire :** l'issue ne dit rien du comportement à zéro tâche ni du
champ vidé. `REVIEW.md` l'exige (section 3). C'est ce qui rend une demande de
correction probable — et c'est précisément le propos : les guidelines rattrapent
ce que la spécification a oublié.

---

## 2. Minutage

| Minute | Action | Ce qui tourne en fond |
|---|---|---|
| 0–2 | Intro. QR code affiché, la salle ouvre l'app sur son téléphone | — |
| 2–4 | **Création de l'issue en direct**, mention `@claude` | l'exécuteur démarre |
| 4–16 | Exposé : `REVIEW.md` à l'écran, schéma exécuteur/reviewer, gouvernance | implémentation, CI, revue |
| 16–22 | Retour sur GitHub : la PR, les commentaires inline du reviewer, l'itération | — |
| 22–25 | Merge → déploiement → **la salle rafraîchit son téléphone** | déploiement Pages |
| 25–30 | Conclusion : ce qui rend ça déployable en entreprise | — |

## 3. Temps de traitement mesurés

À remplir lors des répétitions du 10 septembre. Estimation initiale à confronter
au réel :

| Étape | Estimé | Répétition 1 | Répétition 2 |
|---|---|---|---|
| Déclenchement de l'exécuteur | 15–45 s | | |
| Implémentation + ouverture de la PR | 3–6 min | | |
| CI | 60–90 s | | |
| Revue | 1–3 min | | |
| Itération complète | 4–7 min | | |
| Merge + déploiement Pages | 40–60 s | | |
| **Total** | **10–18 min** | | |

Si le total dépasse 18 min : retirer le « coût par tâche » des critères
d'acceptation et re-répéter.

## 4. Filets de sécurité

1. **Vidéo pré-enregistrée** — la deuxième répétition est capturée de bout en
   bout (issue → PR → revue → itération → merge → app rafraîchie) et montée en
   2–3 min. Sur le portable **et** sur une clé USB.
2. **PR pré-générée non mergée** — si l'exécuteur échoue en direct mais que le
   réseau tient, merger celle-là : la salle voit quand même la mise en
   production réelle.
3. **URL de repli** — si le certificat HTTPS du domaine custom pose problème,
   `https://quickscale-ai.github.io/llm-cost-lab/` fonctionne. Générer le QR
   code seulement après avoir figé l'URL (`npm run qr -- <url>`).

## 5. Points à vérifier la veille

- [ ] Le secret `CLAUDE_CODE_OAUTH_TOKEN` est présent dans le dépôt
- [ ] La GitHub App Claude est installée sur l'organisation
- [ ] GitHub Pages est activé, source « GitHub Actions »
- [ ] `https://impact-ia.quickscale.ai/` répond en HTTPS
- [ ] Le QR code pointe vers l'URL définitive et a été scanné avec un vrai téléphone
- [ ] Les deux répétitions complètes sont faites et chronométrées
- [ ] La vidéo de secours est sur la clé USB

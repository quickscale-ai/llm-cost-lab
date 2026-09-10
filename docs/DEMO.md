# Déroulé de la démo — Masterclass IMPACT IA 2026

Vendredi 11 septembre 2026, 10h30–11h30 · Latrille Events, Abidjan
30 min de présentation + 30 min d'échange.

Fil rouge : **le cycle de vie change, la responsabilité ne change pas.**
L'agent écrit le code et se fait relire ; un humain décide de déléguer, vérifie
de ses yeux et met en production.

---

## 1. Le pipeline utilisé sur scène

Le harnais local [`dev-automation`](https://github.com/quickscale-ai/dev-automation)
(`quickscale-exp`) surveille les issues qui portent le label `claude-ready` :

```
label claude-ready ─▶ exécuteur (worktree isolé) ─▶ PR draft
  ─▶ garde-fou : npm run typecheck && npm run test && npm run build
  ─▶ relecteur en lecture seule (grille REVIEW.md) ─▶ VERDICT
       ├─ REQUEST_CHANGES ─▶ retour à l'exécuteur (3 rondes au maximum)
       └─ APPROVE ─▶ PR prête ─▶ test local ─▶ merge humain ─▶ GitHub Pages
```

À lancer avant de monter sur scène, dans un terminal **non projeté** :

```bash
cd ~/Developer/dev-automation
./.venv/bin/quickscale-exp preflight
GH_TOKEN=$(gh auth token -u <votre-compte-github>) ./.venv/bin/quickscale-exp -v watch \
  --repo quickscale-ai/llm-cost-lab --base main --poll 15 --keep-worktrees
```

- Le tableau de bord s'ouvre sur `http://127.0.0.1:8765/` : c'est lui qu'on projette.
- `--keep-worktrees` garde le code de la PR sur le disque, dépendances
  installées, pour le test local.
- `GH_TOKEN` fixe le compte GitHub utilisé, quel que soit le compte actif de `gh`.

Les workflows GitHub Actions `Agent exécuteur` et `Agent reviewer` ne servent
pas à la démo : le secret `CLAUDE_CODE_OAUTH_TOKEN` n'est pas configuré. Deux
conséquences : **ne jamais écrire `@claude` dans l'issue**, et la check
« Agent reviewer » apparaît en échec sur les PR. Elle n'est pas requise pour
merger ; seule la CI « Types, tests et build » l'est.

## 2. La carte du cycle

| # | Étape | Qui | Garde-fou | Ce que voit la salle |
|---|---|---|---|---|
| 1 | Spécifier | humain, aidé par l'IA | gabarit d'issue : Besoin, Comportement, Périmètre, Critères | « l'issue *est* le prompt » |
| 2 | **Déléguer** | **humain** | label `claude-ready` | **décision n°1** |
| 3 | Implémenter | agent exécuteur | worktree isolé ; hook qui refuse toute écriture dans `.github/workflows/` ; `CLAUDE.md` | le flux d'outils défile sur le tableau de bord |
| 4 | Vérifier | machine | typecheck, tests, build — 2 tentatives | le nœud « Garde-fou » passe au vert |
| 5 | Relire | agent relecteur, en lecture seule | grille `REVIEW.md`, sévérités | commentaire `VERDICT:` sur la PR |
| 6 | **Tester** | **humain** | `npm run dev` dans le worktree | **décision n°2** : on vide un champ en direct |
| 7 | **Merger** | **humain** | CI obligatoire sur `main` | **décision n°3** |
| 8 | Déployer | CI | `deploy.yml` | la salle rafraîchit son téléphone |
| 9 | Mesurer | tableau de bord | coût, durée, rondes | « cette feature a coûté X $ » |

La méthode partagée tient en trois fichiers versionnés, lus par l'humain comme
par l'agent : le gabarit d'issue, [`CLAUDE.md`](../CLAUDE.md) (conventions) et
[`REVIEW.md`](../REVIEW.md) (grille de revue).

## 3. Le texte de l'issue à créer en direct

À coller tel quel, ou à dicter à Claude Desktop via le MCP GitHub.
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
```

Puis **poser le label `claude-ready`** devant la salle : c'est la décision n°1.

**Note volontaire :** l'issue ne dit rien du comportement à zéro tâche ni du
champ vidé, alors que `REVIEW.md` l'exige (section 3). Deux issues possibles,
qui racontent la même chose :

- **REQUEST_CHANGES** : la grille rattrape ce que la spécification a oublié, et
  la boucle de correction est visible sur le tableau de bord.
- **APPROVE du premier coup** : l'exécuteur a lu la même grille (via
  `CLAUDE.md`) et a traité le cas de lui-même. On le vérifie au test local.

Ne pas annoncer à l'avance laquelle des deux va se produire.

## 4. Minutage

**Disposition :** écran projeté = tableau de bord, GitHub et l'app dans des
onglets déjà ouverts. Le terminal reste privé : c'est la source de vérité si
quelque chose casse.

| Minute | Geste | En fond |
|---|---|---|
| 0–3 | Intro, QR code : la salle ouvre l'app sur son téléphone | `watch` tourne, tableau de bord vierge |
| 3–6 | Créer l'issue, puis **poser `claude-ready`** | le veilleur la prend en charge |
| 6–16 | Exposé : carte du cycle, `CLAUDE.md` et `REVIEW.md` à l'écran, garde-fous. Retour au tableau de bord toutes les 3 min | exécuteur → PR draft → garde-fou → relecteur |
| 16–20 | La PR : diff, sortie des tests, commentaire `VERDICT` | éventuelle itération |
| 20–23 | **Test local** : la commande du bloc « À vous de jouer », puis saisir 0 et vider un champ | — |
| 23–26 | **Merge** → onglet Actions → la salle rafraîchit | déploiement Pages |
| 26–30 | Tuiles coût / durée / rondes, conclusion | — |

**Bonus s'il reste du temps :** commenter la PR pour demander un changement,
puis relancer `quickscale-exp solve --repo quickscale-ai/llm-cost-lab --issue <N> --base main`.
Le harnais reprend la PR en donnant la priorité au commentaire humain.

**À dire plutôt que laisser découvrir :** le relecteur tourne sous le même
compte GitHub que l'exécuteur. C'est un pré-filtre, pas une revue indépendante —
c'est précisément pour ça que le merge reste humain. Aucun plafond de coût n'est
appliqué : seuls le nombre de tours, le délai et le nombre de rondes bornent un run.

## 5. Temps de traitement

| Étape | Estimé | Mesuré le 10/09 | Répétition 1 | Répétition 2 |
|---|---|---|---|---|
| Prise en charge par le veilleur | ≤ 15 s | | | |
| Implémentation + PR draft | 3–6 min | 4 min 43 s (#11 → #12) | | |
| Garde-fou (npm ci, typecheck, tests, build) | 1–2 min | | | |
| Revue | 1–3 min | | | |
| Itération complète, si demandée | 4–7 min | | | |
| CI sur la PR | 15–20 s | 12–18 s | | |
| Merge + déploiement Pages | ~30 s | 27 s | | |
| **Total** | **8–12 min** sans itération | | | |

Si l'implémentation dépasse 10 min en répétition : retirer le « coût par
tâche » des critères d'acceptation et re-répéter.

## 6. Filets de sécurité

1. **Vidéo pré-enregistrée** — la deuxième répétition, capturée de bout en bout
   et montée en 2–3 min. Sur le portable **et** sur une clé USB.
2. **PR pré-générée non mergée** — celle de la première répétition. Si
   l'exécuteur échoue en direct mais que le réseau tient, merger celle-là : la
   salle voit quand même une vraie mise en production.
3. **Run interrompu** — `quickscale-exp solve --issue <N>` reprend là où le run
   s'est arrêté (relecteur si le dernier évènement est un commit, exécuteur si
   c'est un verdict ou un commentaire).
4. **Réseau** — partage de connexion 4G prêt ; `caffeinate -d` pour éviter la
   mise en veille ; notifications coupées.

## 7. Points à vérifier la veille

- [ ] `quickscale-exp preflight` entièrement OK sur le portable de démo
- [ ] Les labels `claude-ready`, `claude-in-progress`, `claude-approved` et
      `claude-generated` existent sur le dépôt
- [ ] La branche `main` exige la check « Types, tests et build »
- [ ] `https://quickscale-ai.github.io/llm-cost-lab/` répond en HTTPS
- [ ] Le QR code (`docs/qr-code.png`) a été scanné avec un vrai téléphone
- [ ] Les deux répétitions sont faites et chronométrées (tableau §5)
- [ ] La PR de la répétition 1 est ouverte, non mergée
- [ ] La vidéo de secours est sur la clé USB
- [ ] `watch` relancé juste avant la session : tableau de bord vierge

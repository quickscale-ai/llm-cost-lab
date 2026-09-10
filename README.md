# LLM Cost Lab

**Comparateur de coût par token pour les modèles de langage.**
Comparez les tarifs des principaux fournisseurs et estimez ce que coûterait
réellement votre usage — en dollars ou en francs CFA.

🔗 **[quickscale-ai.github.io/llm-cost-lab](https://quickscale-ai.github.io/llm-cost-lab/)**

---

## Pourquoi ce projet

Quand une organisation passe d'un prototype d'IA à un déploiement d'agents à
l'échelle, la question qui arrive systématiquement est : *combien ça coûte pour
de vrai ?* Le prix affiché par million de tokens ne répond pas à cette question.
Cet outil traduit des tarifs en budget.

Ce dépôt sert aussi de support à une démonstration d'**agentic coding** : une
issue est prise en charge par un agent exécuteur qui ouvre une Pull Request,
laquelle est revue par un agent reviewer appliquant les critères écrits dans
[REVIEW.md](./REVIEW.md), avec itération avant merge.

## Fonctionnalités

- Tableau comparatif triable de 16 modèles chez 7 fournisseurs
- Simulateur de coût par volume de tokens, classé du moins cher au plus cher
- Affichage en **USD** ou en **FCFA** (franc CFA)
- Filtre par fournisseur
- Chaque tarif renvoie vers la page tarifaire officielle dont il est issu, et
  l'ensemble porte sa date de vérification

## Le workflow agentique

```
   Issue GitHub                  Pull Request                    Production
        │                             │                               │
        │  label claude-ready         │  guidelines REVIEW.md         │
        ▼                             ▼                               │
  ┌───────────────┐            ┌───────────────┐                      │
  │    Agent      │  ── PR ──▶ │    Agent      │                      │
  │   exécuteur   │            │   reviewer    │                      │
  └───────────────┘            └───────┬───────┘                      │
        ▲                              │                              │
        └──── correction demandée ─────┘                              │
                                       │                              │
                                  approbation ──▶ merge ──▶ CI ───────┘
```

La CI (types, tests, budget de poids) s'exécute sur chaque PR, y compris celles
ouvertes par l'agent : une PR qui casse le build ne peut pas être mergée.

## Développement

```bash
npm install --legacy-peer-deps
npm run dev
```

> `--legacy-peer-deps` est nécessaire : npm 10.9 échoue sur la résolution des
> peer dependencies de Vitest 5 (bug arborist `edgesOut`).

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run typecheck` | Vérification des types |
| `npm run build` | Build de production, affiche la taille gzip |
| `npm run qr` | Régénère le QR code dans `docs/` |

## Architecture

```
src/
├── data/models.ts     Tarifs, sources, date de vérification, taux de change
├── lib/pricing.ts     Calculs de coût — fonctions pures, testées
├── lib/format.ts      Formatage monnaie / tokens / dates — helpers partagés
└── components/        Affichage uniquement, aucun calcul
```

La séparation est stricte : `pricing.ts` ne connaît pas React, les composants ne
font pas d'arithmétique. C'est ce qui rend la logique testable et les
modifications prévisibles — y compris pour un agent.

## Les tarifs

Les prix sont **saisis à la main et datés**, pas récupérés en temps réel.
Chaque entrée de `src/data/models.ts` porte l'URL de la page tarifaire officielle
du fournisseur. Certains fournisseurs pratiquent des paliers (contexte long,
heures pleines/creuses) : le tarif retenu est celui du palier standard, et la
condition est indiquée en infobulle dans l'interface.

Vérifiez `PRICING_VERIFIED_AT` avant toute décision d'achat.

## Contribuer

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) et [REVIEW.md](./REVIEW.md).

## Licence

MIT

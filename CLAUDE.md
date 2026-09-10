# Contexte projet — llm-cost-lab

Comparateur de coût par token pour modèles de langage. Application statique,
sans backend, sans base de données, sans appel réseau à l'exécution.

## Ce qu'il faut savoir avant de modifier quoi que ce soit

- **`src/lib/pricing.ts`** contient toute la logique de calcul, en fonctions
  pures. C'est le seul endroit où un coût se calcule.
- **`src/lib/format.ts`** contient tous les helpers d'affichage
  (`formatCurrency`, `formatTokens`, `parseNumericInput`…). Ne dupliquez pas ces
  fonctions dans un composant.
- **`src/data/models.ts`** contient les tarifs. Chaque entrée porte sa `source`
  et l'ensemble porte `PRICING_VERIFIED_AT`.
- **`src/components/`** ne contient que de l'affichage.

## Conventions

- TypeScript strict. Pas de `any`.
- Interface **en français** (libellés, messages, commentaires).
- Tailwind CSS v4 pour les styles. Pas de fichier CSS par composant.
- Thème clair et sombre : toute couleur ajoutée a sa variante `dark:`.
- Tests avec Vitest, dans `src/lib/__tests__/`.

## Commandes

```bash
npm install --legacy-peer-deps   # npm 10.9 plante sinon sur les peers de vitest
npm run dev          # serveur de développement
npm run test         # tests unitaires
npm run typecheck    # vérification des types
npm run build        # build de production (affiche la taille gzip)
```

## Avant d'ouvrir une PR

`npm run typecheck && npm run test && npm run build` doivent passer, et la PR
doit respecter [REVIEW.md](./REVIEW.md) — c'est ce que l'agent reviewer vérifie.

## Revue d'une Pull Request

Que la PR vienne d'un humain ou d'un agent, **[REVIEW.md](./REVIEW.md) est la
grille de revue**. Lisez-la en entier avant de rendre un verdict, et appliquez
sa table de sévérité : un point classé « Bloquant » ou « Important » justifie
une demande de correction ; un « nit » ne bloque jamais.

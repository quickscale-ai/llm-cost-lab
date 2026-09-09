# Contribuer

## Mise en route

```bash
npm install --legacy-peer-deps
npm run dev
```

`--legacy-peer-deps` est nécessaire : npm 10.9 échoue sur la résolution des peer
dependencies de Vitest 5 (bug arborist `edgesOut`).

## Cycle de contribution

1. Une **issue** décrit le besoin.
2. Une **branche** puis une **Pull Request** portent la modification.
3. La **CI** vérifie les types, les tests et le build.
4. L'**agent reviewer** applique [REVIEW.md](./REVIEW.md) et commente la PR.
5. Après correction éventuelle et approbation, la PR est **mergée** et
   déployée automatiquement.

## Avant de pousser

```bash
npm run typecheck && npm run test && npm run build
```

Lisez [REVIEW.md](./REVIEW.md) : c'est la grille exacte sur laquelle votre PR
sera évaluée. Les conventions de code sont dans [CLAUDE.md](./CLAUDE.md).

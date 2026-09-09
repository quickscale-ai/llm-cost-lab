# Guidelines de revue

Ce fichier est lu par l'agent reviewer avant chaque Pull Request. Il définit ce
qu'il vérifie et sur quoi il demande une correction. Il vaut aussi pour les
contributions humaines.

## 1. Exactitude du calcul

- Toute fonction qui calcule un coût vit dans `src/lib/pricing.ts`, est **pure**
  (mêmes entrées → mêmes sorties, aucun effet de bord, aucune dépendance à React).
- **Toute nouvelle fonction de coût est accompagnée d'un test Vitest.** Une PR qui
  ajoute un calcul sans test est renvoyée en correction.
- Aucune arithmétique monétaire dans les composants. Un composant affiche ; il ne
  calcule pas.
- Un tarif ajouté dans `src/data/models.ts` porte obligatoirement son champ
  `source` (URL de la page tarifaire officielle du fournisseur). Un prix sans
  source est refusé.

## 2. Réutilisation

- Tout montant affiché passe par `formatCurrency` (`src/lib/format.ts`).
  Tout nombre de tokens passe par `formatTokens`. Pas de `toFixed()` ni de
  `Intl.NumberFormat` en dur dans un composant.
- Toute saisie numérique venant de l'utilisateur passe par `parseNumericInput`.
- Avant d'écrire un helper, vérifier qu'il n'existe pas déjà dans `src/lib/`.

## 3. Cas limites

Chaque champ de saisie doit se comporter correctement quand il vaut :

- **zéro**, ou est **vidé** par l'utilisateur ;
- une valeur **négative** ;
- une valeur **non numérique** ;
- un nombre **très grand** (pas de `Infinity`, pas de `NaN` à l'écran).

Un `NaN` visible dans l'interface est un blocage, pas une remarque.

## 4. Accessibilité

- Tout champ de saisie a un `<label>` associé par `htmlFor` / `id`.
- Tout groupe de boutons a un `role` et un nom accessible.
- Les états sélectionnés utilisent `aria-pressed` ou `aria-sort`.
- Tout élément interactif est atteignable au clavier et a un focus visible.

## 5. Mobile

- Aucun scroll horizontal à **360 px** de large. C'est vérifiable :
  `document.documentElement.scrollWidth` doit égaler `window.innerWidth`.
- Un tableau de plus de trois colonnes a une vue en cartes sur petit écran.

## 6. Sécurité et dépendances

- Aucun secret, aucune clé d'API, aucun jeton dans le dépôt.
- Aucun nouvel appel réseau à l'exécution : l'application doit rester utilisable
  hors ligne une fois chargée.
- **Aucune nouvelle dépendance npm** sans justification explicite dans la
  description de la PR. Le poids de page est une fonctionnalité.

## 7. Budget

- Le bundle JavaScript reste sous **100 Ko gzip**. `npm run build` affiche la
  taille : si elle dépasse, la PR est renvoyée.

## Sévérité

| Niveau | Exemples | Effet sur la PR |
|---|---|---|
| **Bloquant** | calcul faux, `NaN` affiché, prix sans source, secret commité, scroll horizontal mobile, test manquant sur une fonction de coût | correction demandée |
| **Important** | helper dupliqué, `<label>` manquant, cas limite non couvert | correction demandée |
| **Nit** | nommage, ordre des imports, formulation d'un commentaire | signalé, non bloquant |

Maximum 5 remarques « nit » par revue : au-delà, elles noient les vrais problèmes.

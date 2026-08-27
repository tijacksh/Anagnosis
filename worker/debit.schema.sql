-- Compte-tours par IP et par portée (« codes » ou « audio »), partagé entre les deux
-- Workers dans la même base D1 que `codes`. `fenetre` identifie une tranche de temps
-- fixe (epoch en secondes divisé par la période) ; `compte` ne progresse que par
-- l'UPSERT atomique de `debit.js`, jamais écrit à la main. Voir `debit.js` pour le
-- raisonnement complet, notamment pourquoi ce n'est pas le binding `Rate Limit` natif.
CREATE TABLE IF NOT EXISTS debit (
  cle TEXT PRIMARY KEY,
  fenetre INTEGER NOT NULL,
  compte INTEGER NOT NULL
);

-- Un code par ligne. `utilises` ne progresse que par l'UPDATE atomique du Worker
-- (`codes.js`) — jamais écrit à la main, sous peine de désynchroniser le compteur
-- du nombre réel d'échanges déjà accordés.
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,
  max INTEGER NOT NULL,
  utilises INTEGER NOT NULL DEFAULT 0,
  jours INTEGER NOT NULL DEFAULT 30,
  cree_le TEXT NOT NULL DEFAULT (datetime('now'))
);

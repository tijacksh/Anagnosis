-- Liste d'attente du lancement. Posée une fois, dans la base `anagnosis-codes` :
--   npx wrangler d1 execute anagnosis-codes --remote --file worker/inscriptions.schema.sql
CREATE TABLE IF NOT EXISTS inscriptions (
  courriel TEXT PRIMARY KEY,
  source   TEXT NOT NULL DEFAULT 'direct',
  cree_le  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS inscriptions_cree_le ON inscriptions (cree_le);

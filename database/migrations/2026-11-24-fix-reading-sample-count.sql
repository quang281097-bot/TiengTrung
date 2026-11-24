BEGIN;

DELETE FROM bai_doc
WHERE slug IN ('hsk5-hop-tac-lien-the-he', 'hsk5-nghien-cuu-giao-duc');

COMMIT;
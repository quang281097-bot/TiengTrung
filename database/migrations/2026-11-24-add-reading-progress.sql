BEGIN;

CREATE TABLE IF NOT EXISTS tien_do_bai_doc (
  user_id           uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  reading_id        integer NOT NULL REFERENCES bai_doc (id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  PRIMARY KEY (user_id, reading_id)
);

CREATE INDEX IF NOT EXISTS tien_do_bai_doc_user_idx
  ON tien_do_bai_doc (user_id, completed_at, last_activity_at DESC);

COMMIT;

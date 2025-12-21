alter table "public"."messages" add column if not exists "reply_to_id" uuid;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_to_id_fkey') THEN
        alter table "public"."messages" add constraint "messages_reply_to_id_fkey" FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;
    END IF;
END $$;

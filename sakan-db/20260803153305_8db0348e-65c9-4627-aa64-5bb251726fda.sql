ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_body_len;
ALTER TABLE public.messages ADD CONSTRAINT messages_body_len CHECK (char_length(body) <= 4000);
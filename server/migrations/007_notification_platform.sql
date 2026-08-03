-- Notification platform.
--
-- Outbox pattern. A trigger on orders writes a row to notification_events;
-- a second trigger hands that row to pg_net, which posts it to the API from a
-- background worker. Neither step runs inside the caller's transaction path in
-- a way that can fail or slow an order, and both swallow their own errors.
--
-- The event model is recipient_type + recipient_id + notification_type +
-- payload, so customer events later need a new type and a new trigger, not a
-- new pipeline.
--
-- Runs as one atomic transaction and is safely re-runnable.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------- config ---

CREATE TABLE IF NOT EXISTS public.notification_config (
  id boolean PRIMARY KEY DEFAULT true,
  dispatch_url text,
  dispatch_secret text,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_config_singleton CHECK (id)
);

INSERT INTO public.notification_config (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.notification_config ENABLE ROW LEVEL SECURITY;
-- No policies: service role only. The dispatch secret never reaches a client.

-- --------------------------------------------------------- subscriptions ---

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  failure_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_own_select ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own_select
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_subscriptions_own_delete ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own_delete
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Writes go through the API on the service role, which validates the keys.

-- ---------------------------------------------------------------- events ---

CREATE TABLE IF NOT EXISTS public.notification_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_type text NOT NULL,
  recipient_id uuid,
  notification_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT notification_events_recipient_type CHECK (recipient_type IN ('admin', 'customer')),
  CONSTRAINT notification_events_status CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS notification_events_pending_idx
  ON public.notification_events (status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

-- -------------------------------------------------------------- dispatch ---

CREATE OR REPLACE FUNCTION public.dispatch_notification_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  config public.notification_config%ROWTYPE;
BEGIN
  SELECT * INTO config FROM public.notification_config WHERE id LIMIT 1;

  IF config IS NULL OR NOT config.enabled
     OR config.dispatch_url IS NULL OR config.dispatch_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := config.dispatch_url,
    body := jsonb_build_object('eventId', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-secret', config.dispatch_secret
    ),
    timeout_milliseconds := 8000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notification dispatch failed for event %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_events_dispatch ON public.notification_events;
CREATE TRIGGER notification_events_dispatch
  AFTER INSERT ON public.notification_events
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification_event();

-- ------------------------------------------------------------ order hook ---

CREATE OR REPLACE FUNCTION public.enqueue_new_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count integer;
BEGIN
  BEGIN
    item_count := COALESCE(jsonb_array_length(NEW.items), 0);
  EXCEPTION WHEN OTHERS THEN
    item_count := 0;
  END;

  BEGIN
    INSERT INTO public.notification_events (recipient_type, notification_type, payload)
    VALUES (
      'admin',
      'NEW_ORDER',
      jsonb_build_object(
        'orderId', NEW.id,
        'total', NEW.total_amount,
        'orderType', NEW.order_type,
        'itemCount', item_count,
        'createdAt', NEW.created_at
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'could not enqueue NEW_ORDER notification for order %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_notify_admins ON public.orders;
CREATE TRIGGER orders_notify_admins
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_new_order_notification();

COMMIT;

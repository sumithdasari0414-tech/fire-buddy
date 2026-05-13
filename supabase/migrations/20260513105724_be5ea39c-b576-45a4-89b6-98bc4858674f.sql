
CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_name text,
  caller_phone text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  address text,
  city text,
  emergency_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  language text DEFAULT 'en',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create SOS alerts"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view SOS alerts"
  ON public.sos_alerts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update SOS alerts"
  ON public.sos_alerts FOR UPDATE
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sos_alerts_updated_at
  BEFORE UPDATE ON public.sos_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sos_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

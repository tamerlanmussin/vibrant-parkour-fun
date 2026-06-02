-- Cap score values at a reasonable maximum to prevent arbitrary score injection
ALTER TABLE public.scores
  ADD CONSTRAINT scores_range_check CHECK (score >= 0 AND score <= 100000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_best_score_range_check CHECK (best_score >= 0 AND best_score <= 100000);

-- Trigger: ensure profile.best_score can only be increased, and only to a value
-- that the user has actually submitted into the scores table.
CREATE OR REPLACE FUNCTION public.validate_best_score_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.best_score <> OLD.best_score THEN
    -- Only allow increases
    IF NEW.best_score < OLD.best_score THEN
      RAISE EXCEPTION 'best_score cannot decrease';
    END IF;

    -- Must match an existing recorded score for this user
    IF NOT EXISTS (
      SELECT 1 FROM public.scores
      WHERE user_id = NEW.user_id AND score >= NEW.best_score
    ) THEN
      RAISE EXCEPTION 'best_score must be backed by a submitted score';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_best_score_update_trigger ON public.profiles;
CREATE TRIGGER validate_best_score_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_best_score_update();
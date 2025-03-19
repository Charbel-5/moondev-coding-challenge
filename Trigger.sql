-- Install the standard HTTP extension (pre-installed in Supabase)
CREATE EXTENSION IF NOT EXISTS "http";

-- Function to call the edge function using standard HTTP extension
CREATE OR REPLACE FUNCTION notify_submission_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Make a request to our Edge Function using the built-in http extension
  PERFORM http.post(
    url := 'https://palmzqwthakytlbpqeip.supabase.co/functions/v1/send-notification-email',
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME, 
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )::jsonb,
    headers := '{"Content-Type": "application/json"}'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that calls the function on submission update
DROP TRIGGER IF EXISTS on_submission_update ON submissions;
CREATE TRIGGER on_submission_update
  AFTER UPDATE ON submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.feedback IS DISTINCT FROM NEW.feedback)
  EXECUTE FUNCTION notify_submission_update();
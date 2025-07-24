-- Enable replica identity for real-time updates
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.campaigns REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;

-- Create a function to update campaign stats when leads change
CREATE OR REPLACE FUNCTION public.update_campaign_stats_for_lead()
RETURNS TRIGGER AS $$
DECLARE
  campaign_id_to_update uuid;
BEGIN
  -- Get campaign_id from the lead (either NEW or OLD depending on operation)
  IF TG_OP = 'DELETE' THEN
    -- For DELETE, get campaign_id from campaign_leads using OLD.id
    SELECT cl.campaign_id INTO campaign_id_to_update
    FROM campaign_leads cl
    WHERE cl.lead_id = OLD.id
    LIMIT 1;
  ELSE
    -- For INSERT/UPDATE, get campaign_id from campaign_leads using NEW.id
    SELECT cl.campaign_id INTO campaign_id_to_update
    FROM campaign_leads cl
    WHERE cl.lead_id = NEW.id
    LIMIT 1;
  END IF;

  -- If we found a campaign, update its stats
  IF campaign_id_to_update IS NOT NULL THEN
    UPDATE campaigns
    SET 
      completed = (
        SELECT COUNT(*)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
        AND l.status = 'Completed'
      ),
      in_progress = (
        SELECT COUNT(*)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
        AND l.status = 'In Progress'
      ),
      remaining = (
        SELECT COUNT(*)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
        AND l.status = 'Pending'
      ),
      failed = (
        SELECT COUNT(*)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
        AND l.status = 'Failed'
      ),
      duration = (
        SELECT COALESCE(SUM(l.duration), 0)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
      ),
      cost = (
        SELECT COALESCE(SUM(l.cost), 0)
        FROM leads l
        JOIN campaign_leads cl ON l.id = cl.lead_id
        WHERE cl.campaign_id = campaign_id_to_update
      )
    WHERE id = campaign_id_to_update;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update campaign stats when leads change
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON leads;
CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats_for_lead();
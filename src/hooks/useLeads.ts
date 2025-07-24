import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateCampaignStats } from "@/services/campaignService";

interface Lead {
  id: string;
  name: string;
  phone_number: string;
  phone_id: string | null;
  status: string;
  disposition: string | null;
  duration: number;
  cost: number;
  campaign_id?: string;
  recording_url?: string | null;
  initiated_at?: string | null;
}

interface LeadStats {
  completed: number;
  inProgress: number;
  remaining: number;
  failed: number;
  totalDuration: number;
  totalCost: number;
}

export const useLeads = (
  isViewingCampaign: boolean,
  isDashboardInitialized: boolean,
  campaignId: any
) => {
  const [stats, setStats] = useState<LeadStats>({
    completed: 0,
    inProgress: 0,
    remaining: 0,
    failed: 0,
    totalDuration: 0,
    totalCost: 0,
  });

  // Fetch initial campaign stats
  useEffect(() => {
    if (campaignId) {
      fetchCampaignStats();
    }
  }, [campaignId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!campaignId) return;

    console.log("Setting up real-time subscriptions for campaign:", campaignId);

    // Subscribe to campaign stats changes
    const campaignChannel = supabase
      .channel("campaign-stats-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("Campaign stats updated:", payload.new);
          const newCampaign = payload.new as any;
          setStats({
            completed: newCampaign.completed,
            inProgress: newCampaign.in_progress,
            remaining: newCampaign.remaining,
            failed: newCampaign.failed,
            totalDuration: newCampaign.duration,
            totalCost: newCampaign.cost,
          });
        }
      )
      .subscribe();

    // Subscribe to leads changes that affect this campaign
    const leadsChannel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "leads",
        },
        (payload) => {
          console.log("Lead changed:", payload);
          // The database trigger will update campaign stats automatically
          // We just log this for debugging purposes
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [campaignId]);

  const fetchCampaignStats = async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("completed, in_progress, remaining, failed, duration, cost")
        .eq("id", campaignId)
        .single();

      if (error) {
        console.error("Error fetching campaign stats:", error);
        return;
      }

      if (data) {
        setStats({
          completed: data.completed,
          inProgress: data.in_progress,
          remaining: data.remaining,
          failed: data.failed,
          totalDuration: data.duration,
          totalCost: data.cost,
        });
      }
    } catch (error) {
      console.error("Error in fetchCampaignStats:", error);
    }
  };

  const resetDashboardData = () => {
    setStats({
      completed: 0,
      inProgress: 0,
      remaining: 0,
      failed: 0,
      totalDuration: 0,
      totalCost: 0,
    });
  };

  return {
    stats,
    setStats,
    resetDashboardData,
  };
};

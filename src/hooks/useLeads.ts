import { useState, useEffect } from "react";
import { useFetchCampaignStatsLazyQuery } from "@/generated/graphql";

export interface Lead {
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

export interface LeadStats {
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
  campaignId: string | null | undefined
) => {
  const [loadStats, { data, error }] = useFetchCampaignStatsLazyQuery();
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

  const fetchCampaignStats = async () => {
    if (!campaignId) return;

    try {
      const response = await loadStats({ variables: { campaignId } });

      const userError = response.data?.fetchCampaignStats?.userError;
      const stats = response.data?.fetchCampaignStats?.data;

      if (userError) {
        console.error("User error:", userError.message);
        return;
      }

      if (stats) {
        setStats({
          completed: stats.completed ?? 0,
          inProgress: stats.inProgress ?? 0,
          remaining: stats.remaining ?? 0,
          failed: stats.failed ?? 0,
          totalDuration: stats.totalDuration ?? 0,
          totalCost: stats.totalCost ?? 0,
        });
      }
    } catch (err) {
      console.error("GraphQL error in fetchCampaignStats:", err);
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

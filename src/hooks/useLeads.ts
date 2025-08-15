import { useState, useEffect } from "react";
import { useFetchCampaignStatsLazyQuery, useFetchDashboardStatsLazyQuery } from "@/generated/graphql";

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
  campaignId: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  userId: string | undefined

) => {
  const [loadStats, { data, error }] = useFetchCampaignStatsLazyQuery();
  const [loadDashboardStats] = useFetchDashboardStatsLazyQuery();
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
 
  // Fetch stats when date range changes
  useEffect(() => {
    if (startDate && endDate && !isViewingCampaign) {
      console.log("Date range changed in useLeads, calling resetDashboardStats");
      resetDashboardStats();
    }
  }, [startDate, endDate , isViewingCampaign]);

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

  const resetDashboardStats = async () => {


    try {
      const response = await loadDashboardStats({
        variables: {
          userId: userId ?? "",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }, fetchPolicy: "network-only"
      });

      const userError = response.data?.fetchDashboardStats?.userError;
      const statsData = response.data?.fetchDashboardStats?.data;

      if (userError) {
        console.error("User error:", userError.message);
        return;
      }

      if (statsData) {
        setStats({
          completed: statsData.completed ?? 0,
          inProgress: statsData.inProgress ?? 0,
          remaining: statsData.remaining ?? 0,
          failed: statsData.failed ?? 0,
          totalDuration: statsData.totalDuration ?? 0,
          totalCost: statsData.totalCost ?? 0,
        });
      }
    } catch (err) {
      console.error("GraphQL error in resetDashboardStats:", err);
    }

  };
  return {
    stats,
    setStats,
    resetDashboardData,
    resetDashboardStats
  };
};

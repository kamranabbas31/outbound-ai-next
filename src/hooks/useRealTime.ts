import {
  useFetchCampaignByIdLazyQuery,
  useFetchLeadsForCampaignLazyQuery,
} from "@/generated/graphql";
import { getSocket } from "@/lib/socket";
import debounce from "lodash/debounce";
import { useEffect } from "react";
import { Lead, LeadStats } from "./useLeads";
import { stopExecution } from "@/store/executionSlice";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { Campaign } from "@/components/pages/dashboard";

export function useRealTime(
  campaignId: string,
  startIndex: number,
  endIndex: number,

  setLeads: (leads: Lead[]) => void,
  setStats: (stats: LeadStats) => void
) {
  //Queries
  const [fetchLeadsForCampaignQuery] = useFetchLeadsForCampaignLazyQuery();
  const [fetchCampaignByIdQuery] = useFetchCampaignByIdLazyQuery();
  const dispatch = useDispatch();
  useEffect(() => {
    if (!campaignId) return;
    const socket = getSocket();

    // Debounced fetchLeads
    const debouncedFetchLeads = debounce(async () => {
      try {
        const { data } = await fetchLeadsForCampaignQuery({
          variables: {
            campaignId,
            skip: startIndex,
            take: endIndex - startIndex,
          },
          fetchPolicy: "network-only",
        });

        setLeads((data?.fetchLeadsForCampaign.data as Lead[]) ?? []);
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    }, 0); // Delay: 1 second

    const onLeadChange = (lead: Lead) => {
      if (lead.campaign_id === campaignId) {
        debouncedFetchLeads();
      }
    };

    const onCampaignChange = async (campaign: Campaign) => {
      if (campaign.id === campaignId) {
        if (campaign.status === "idle") {
          dispatch(stopExecution(campaignId));
          toast.info(`Campaign ${campaignId} completed`);
        }
        try {
          const { data } = await fetchCampaignByIdQuery({
            variables: { campaignId },
            fetchPolicy: "network-only",
          });
          const fresh = data?.fetchCampaignById?.data;
          if (fresh) {
            setStats({
              completed: fresh.completed || 0,
              inProgress: fresh.in_progress || 0,
              remaining: fresh.remaining || 0,
              failed: fresh.failed || 0,
              totalDuration: fresh.duration || 0,
              totalCost: fresh.cost || 0,
            });
          }
        } catch (err) {
          console.error("Error fetching campaign stats:", err);
        }
      }
    };

    socket.on("leads-changed", onLeadChange);
    socket.on("campaigns-changed", onCampaignChange);

    return () => {
      socket.off("leads-changed", onLeadChange);
      socket.off("campaigns-changed", onCampaignChange);
      debouncedFetchLeads.cancel();
    };
  }, [
    campaignId,
    startIndex,
    endIndex,
    fetchLeadsForCampaignQuery,
    fetchCampaignByIdQuery,
  ]);
}

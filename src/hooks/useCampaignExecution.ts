import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  updateCampaignStats,
  fetchLeadsForCampaign,
} from "@/services/campaignService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  startExecution as markExecutionStarted,
  stopExecution as markExecutionStopped,
} from "@/store/executionSlice";
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

export const useCampaignExecution = (stats: any, campaignId: any) => {
  // const [isExecuting, setIsExecuting] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [selectedPacing, setSelectedPacing] = useState("1");
  const executionStopped = useRef(false);
  const dispatch = useDispatch();
  const isExecuting = useSelector(
    (state: RootState) => state.execution[campaignId] || false
  );
  const triggerCall = async (leadId: string) => {
    try {
      setIsCallInProgress(true);

      // Check lead status from database directly
      const { data: leadData, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (fetchError || !leadData) {
        toast.error("Failed to fetch lead data");
        setIsCallInProgress(false);
        return;
      }

      if (leadData.status !== "Pending") {
        toast.error(
          `Cannot call lead: ${leadData.name}. Lead status is ${leadData.status}`
        );
        setIsCallInProgress(false);
        return;
      }

      const response = await supabase.functions.invoke("trigger-call", {
        body: { leadId },
      });

      if (response.error) {
        toast.error(`Failed to initiate call: ${response.error.message}`);
        console.error("Error initiating call:", response.error);
      } else if (response.data.success) {
        toast.success("Call initiated successfully");

        const { error: updateError } = await supabase
          .from("leads")
          .update({
            status: "In Progress",
            disposition: "Call initiated",
          })
          .eq("id", leadId);

        if (updateError) {
          console.error("Error updating lead status:", updateError);
        }
      } else {
        toast.error(response.data.message || "Failed to initiate call");
      }
    } catch (err) {
      console.error("Error triggering call:", err);
      toast.error("Failed to initiate call");
    } finally {
      setIsCallInProgress(false);
    }
  };

  const startExecution = async () => {
    console.log("start execution clicked", campaignId);
    if (!campaignId) {
      toast.error("No campaign selected for execution");
      return;
    }

    try {
      // Fetch ALL campaign leads, not just paginated ones
      const allLeads = await fetchLeadsForCampaign(campaignId, 0, 100000);

      const pendingLeads = allLeads.filter((lead) => {
        const isPending = lead.status === "Pending";
        const hasPhoneId = lead.phone_id !== null;
        return isPending && hasPhoneId;
      });

      if (pendingLeads.length === 0) {
        toast.error("No pending leads with phone IDs available to process");
        dispatch(markExecutionStopped(campaignId));
        return;
      }

      executionStopped.current = false;
      // setIsExecuting(true);
      dispatch(markExecutionStarted(campaignId));
      toast.success(`Started processing ${pendingLeads.length} pending leads`);

      const pacingInterval = (1 / parseInt(selectedPacing, 10)) * 1000;
      let currentIndex = 0;

      const processLead = async () => {
        if (executionStopped.current) {
          console.log("Execution stopped manually.");
          // setIsExecuting(false);
          dispatch(markExecutionStopped(campaignId));
          return;
        }

        if (currentIndex >= pendingLeads.length) {
          console.log(`Finished processing all ${pendingLeads.length} leads`);
          dispatch(markExecutionStopped(campaignId));
          toast.success("Campaign execution completed");
          return;
        }

        const currentLead = pendingLeads[currentIndex];

        if (!isCallInProgress) {
          try {
            await triggerCall(currentLead.id);
          } catch (error) {
            console.error(`Error processing lead ${currentLead.name}:`, error);
          }
        }

        currentIndex++;
        setTimeout(processLead, pacingInterval); // Schedule next
      };

      processLead();
    } catch (error) {
      console.error("Error fetching campaign leads for execution:", error);
      toast.error("Failed to fetch campaign leads for execution");
    }
  };

  const stopExecution = () => {
    executionStopped.current = true;
    dispatch(markExecutionStopped(campaignId));
    toast.info("Stopped execution");
  };

  const toggleExecution = () => {
    if (!isExecuting) {
      startExecution();
    } else {
      stopExecution();
    }
  };

  const triggerSingleCall = async (leadId: string) => {
    if (isCallInProgress) {
      toast.info("A call is already in progress, please wait");
      return;
    }

    await triggerCall(leadId);
  };

  // Campaign completion monitoring will be handled via real-time updates to stats

  return {
    isExecuting,
    isCallInProgress,
    selectedPacing,
    setSelectedPacing,
    toggleExecution,
    triggerSingleCall,
    stopExecution,
  };
};

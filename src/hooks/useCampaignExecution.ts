import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  startExecution as markExecutionStarted,
  stopExecution as markExecutionStopped,
} from "@/store/executionSlice";

import {
  useEnqueueCampaignJobMutation,
  useStopCampaignJobMutation,
} from "@/generated/graphql";

export const useCampaignExecution = (campaignId: string | null) => {
  // mutation
  if (!campaignId) {
    throw new Error("Campaign ID is required for execution");
  }
  const [enqueueCampaignJob] = useEnqueueCampaignJobMutation();
  const [stopCampaignJob] = useStopCampaignJobMutation();

  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [selectedPacing, setSelectedPacing] = useState("1");

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
    try {
      const { data } = await enqueueCampaignJob({
        variables: {
          campaignId,
          pacingPerSecond: Number(selectedPacing) || 1,
        },
      });

      if (data?.enqueueCampaignJob.success) {
        toast.success("Campaign execution started");
        dispatch(markExecutionStarted(campaignId));
      } else {
        toast.error(
          data?.enqueueCampaignJob.userError?.message ||
            "Failed to start execution"
        );
      }
    } catch (err) {
      console.error("Error starting execution:", err);
      toast.error("Failed to start execution");
    }
  };

  const stopExecution = async () => {
    try {
      const { data } = await stopCampaignJob({
        variables: {
          campaignId,
        },
      });

      if (data?.stopCampaignJob.success) {
        toast.info("Campaign execution stopped");
        dispatch(markExecutionStopped(campaignId));
      } else {
        toast.error(
          data?.stopCampaignJob.userError?.message || "Failed to stop execution"
        );
      }
    } catch (err) {
      console.error("Error stopping execution:", err);
      toast.error("Failed to stop execution");
    }
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

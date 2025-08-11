import { useState } from "react";
import { toast } from "sonner";

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
    campaignId = "";
  }

  const [enqueueCampaignJob] = useEnqueueCampaignJobMutation();
  const [stopCampaignJob] = useStopCampaignJobMutation();

  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [selectedPacing, setSelectedPacing] = useState("1");

  const dispatch = useDispatch();
  const isExecuting = useSelector(
    (state: RootState) => state.execution[campaignId] || false
  );

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



  // Campaign completion monitoring will be handled via real-time updates to stats

  return {
    isExecuting,
    isCallInProgress,
    selectedPacing,
    setSelectedPacing,
    toggleExecution,

    stopExecution,
  };
};

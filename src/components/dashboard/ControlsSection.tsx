import { FC } from "react";
import { FileUp, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Campaign } from "../pages/dashboard";

interface ControlsSectionProps {
  isViewingCampaign: boolean;
  isDashboardInitialized: boolean;
  isExecuting: boolean;
  isCallInProgress: boolean;
  isUploading: boolean;
  selectedPacing: string;
  setSelectedPacing: (value: string) => void;
  toggleExecution: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeCampaign?: Campaign | null;
  setCurrentCampaignId: (id: string) => void;
  setShowUploadDialog: (show: boolean) => void;
}

const ControlsSection: FC<ControlsSectionProps> = ({
  isViewingCampaign,
  isDashboardInitialized,
  isExecuting,
  isCallInProgress,
  isUploading,
  selectedPacing,
  setSelectedPacing,
  toggleExecution,
  handleFileUpload,
  activeCampaign,
  setCurrentCampaignId,
  setShowUploadDialog,
}) => {
  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";

    const timestamp = Number(dateString);
    if (isNaN(timestamp)) return "-";

    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Debug logging for date comparison
  if (
    activeCampaign?.cadence_template?.id &&
    activeCampaign?.cadence_start_date
  ) {
    const startDate = new Date(activeCampaign.cadence_start_date);
    const currentDate = new Date();
    const startDateNoTime = startDate.setHours(0, 0, 0, 0);
    const currentDateNoTime = currentDate.setHours(0, 0, 0, 0);

    console.log("Debug Date Comparison:", {
      originalStartDate: activeCampaign.cadence_start_date,
      parsedStartDate: startDate,
      startDateNoTime: startDateNoTime,
      currentDate: currentDate,
      currentDateNoTime: currentDateNoTime,
      isDisabled: startDateNoTime <= currentDateNoTime,
    });
  }
  if (isViewingCampaign) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white shadow-sm rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Campaign Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage this campaign
          </p>
          <div className="flex flex-col space-y-4">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className="flex items-center space-x-2 w-full"
                      variant="outline"
                      onClick={() => {
                        if (activeCampaign) {
                          setCurrentCampaignId(activeCampaign.id);
                        }
                        setShowUploadDialog(true);
                      }}
                      disabled={
                        !!(
                          activeCampaign?.cadence_template?.id &&
                          activeCampaign?.cadence_start_date &&
                          new Date(activeCampaign.cadence_start_date).setHours(
                            0,
                            0,
                            0,
                            0
                          ) <= new Date().setHours(0, 0, 0, 0)
                        )
                      }
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      Add More Leads
                    </Button>
                  </div>
                </TooltipTrigger>
                {!!(
                  activeCampaign?.cadence_template?.id &&
                  activeCampaign?.cadence_start_date &&
                  new Date(activeCampaign.cadence_start_date).setHours(
                    0,
                    0,
                    0,
                    0
                  ) <= new Date().setHours(0, 0, 0, 0)
                ) && (
                  <TooltipContent>
                    <p>Cannot add leads after cadence has started</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className={`${
                        isExecuting
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      } w-full`}
                      onClick={toggleExecution}
                      disabled={
                        isCallInProgress ||
                        !!activeCampaign?.cadence_template?.id
                      }
                    >
                      {isExecuting ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Stop Campaign
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {activeCampaign?.cadence_template?.id && (
                  <TooltipContent>
                    <p>Cadence will automatically execute the campaign</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="p-6 bg-white shadow-sm rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Pacing Controls</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set the rate of outbound calls
          </p>
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Call Pacing (calls/sec)
              </label>
              <Select
                value={selectedPacing}
                onValueChange={setSelectedPacing}
                disabled={isExecuting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select pacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 call/sec</SelectItem>
                  <SelectItem value="2">2 calls/sec</SelectItem>
                  <SelectItem value="3">3 calls/sec</SelectItem>
                  <SelectItem value="5">5 calls/sec</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white shadow-sm rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Campaign Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Current campaign details
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {activeCampaign?.status || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {formatDateTime(activeCampaign?.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Leads:</span>
              <span className="font-medium">
                {activeCampaign?.leads_count || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion Rate:</span>
              <span className="font-medium">
                {activeCampaign?.leads_count && activeCampaign.completed != null
                  ? `${Math.round(
                      (activeCampaign.completed / activeCampaign.leads_count) *
                        100
                    )}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // return (
  //   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  //     <div className="p-6 bg-white shadow-sm rounded-lg border">
  //       <h3 className="text-lg font-semibold mb-2">File Upload</h3>
  //       <p className="text-sm text-muted-foreground mb-4">
  //         Create a campaign first to upload leads
  //       </p>
  //       <div className="flex flex-col space-y-4">
  //         <div className="cursor-not-allowed">
  //           <Button
  //             className="flex items-center space-x-2 w-full pointer-events-none opacity-50"
  //             variant="outline"
  //             disabled={true}
  //           >
  //             <FileUp className="h-4 w-4" />
  //             <span>Upload CSV</span>
  //           </Button>
  //         </div>
  //         <input
  //           id="file-upload"
  //           type="file"
  //           accept=".csv"
  //           className="hidden"
  //           onChange={handleFileUpload}
  //           disabled={true}
  //         />
  //         <p className="text-xs text-muted-foreground">
  //           Use &quot;+ New Campaign&quot; button above to create a campaign
  //           first
  //         </p>
  //       </div>
  //     </div>

  //     <div className="p-6 bg-white shadow-sm rounded-lg border">
  //       <h3 className="text-lg font-semibold mb-2">Pacing Controls</h3>
  //       <p className="text-sm text-muted-foreground mb-4">
  //         Set the rate of outbound calls
  //       </p>
  //       <div className="flex flex-col space-y-4">
  //         <div className="space-y-2">
  //           <label className="text-sm font-medium">
  //             Call Pacing (calls/sec)
  //           </label>
  //           <Select
  //             value={selectedPacing}
  //             onValueChange={setSelectedPacing}
  //             disabled={isExecuting}
  //           >
  //             <SelectTrigger className="w-full">
  //               <SelectValue placeholder="Select pacing" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               <SelectItem value="1">1 call/sec</SelectItem>
  //               <SelectItem value="2">2 calls/sec</SelectItem>
  //               <SelectItem value="3">3 calls/sec</SelectItem>
  //               <SelectItem value="5">5 calls/sec</SelectItem>
  //             </SelectContent>
  //           </Select>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="p-6 bg-white shadow-sm rounded-lg border">
  //       <h3 className="text-lg font-semibold mb-2">Call Execution</h3>
  //       <p className="text-sm text-muted-foreground mb-4">
  //         Control the calling queue
  //       </p>
  //       <div className="flex flex-col space-y-4">
  //         <Button
  //           className={`${
  //             isExecuting
  //               ? "bg-red-500 hover:bg-red-600"
  //               : "bg-green-500 hover:bg-green-600"
  //           } w-full`}
  //           onClick={toggleExecution}
  //           disabled={isCallInProgress || !isDashboardInitialized}
  //         >
  //           {isExecuting ? (
  //             <>
  //               <Pause className="h-4 w-4 mr-2" />
  //               Stop Execution
  //             </>
  //           ) : (
  //             <>
  //               <Play className="h-4 w-4 mr-2" />
  //               Start Execution
  //             </>
  //           )}
  //         </Button>
  //         <p className="text-xs text-muted-foreground">
  //           Create a campaign and upload leads to begin calling
  //         </p>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default ControlsSection;

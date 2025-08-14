import { FC, useState } from "react";
import { Info, Phone, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  ActivityType,
  useLeadActivityLogsLazyQuery,
} from "@/generated/graphql";

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
  recordingUrl?: string | null;
  initiated_at?: string | null;
}

interface LeadsTableProps {
  leads: Lead[];
  isDashboardInitialized: boolean;
  isSearchActive: boolean;
  searchTerm: string;
  isViewingCampaign: boolean;
  isCallInProgress: boolean;
  paginatedLeads: Lead[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  handlePageChange: (page: number) => void;
  totalLeads: number;
  startIndex?: number;
  endIndex?: number;
  ITEMS_PER_PAGE?: number;
}
interface CallAttempt {
  id: string;
  lead_id: string;
  campaign_id: string;
  activity_type: ActivityType;
  from_disposition?: string | null;
  to_disposition?: string | null;
  disposition_at?: string | null;
  duration?: number | null;
  cost?: number | null;
  created_at: string;
}
const LeadsTable: FC<LeadsTableProps> = ({
  leads,
  isDashboardInitialized,
  isSearchActive,
  searchTerm,
  isViewingCampaign,
  paginatedLeads,
  totalPages,
  currentPage,
  handlePageChange,
  totalLeads,
  startIndex,
  endIndex,
}) => {
  const [playingLeadId, setPlayingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [callAttempts, setCallAttempts] = useState<CallAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [loadActivityLogs, { data, loading, error }] =
    useLeadActivityLogsLazyQuery();
  // Calculate pagination values

  // Reset to page 1 when leads change (e.g., after search)

  const handlePlayRecording = (leadId: string) => {
    setPlayingLeadId(playingLeadId === leadId ? null : leadId);
  };
  const fetchCallAttempts = async (leadId: string) => {
    setLoadingAttempts(true);
    try {
      const { data, error } = await loadActivityLogs({
        variables: {
          filter: {
            lead_id: leadId,
            activity_type: ActivityType.CallAttempt, // Filter only call attempts
          },
        },
        fetchPolicy: "network-only",
      });

      if (error || data?.leadActivityLogs.userError) {
        console.error(
          "Error fetching call attempts:",
          error || data?.leadActivityLogs.userError?.message
        );
        toast.error("Failed to load call attempts");
        return;
      }

      setCallAttempts(data?.leadActivityLogs?.data || []);
    } catch (error) {
      console.error("Error fetching call attempts:", error);
      toast.error("Failed to load call attempts");
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleShowLeadDetails = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
    await fetchCallAttempts(lead.id);
  };
  const formatDuration = (durationInMinutes: number) => {
    if (!durationInMinutes || durationInMinutes === 0) return "0s";

    const totalSeconds = Math.round(durationInMinutes * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    } else if (seconds === 0) {
      return `${minutes}min`;
    } else {
      return `${minutes}min ${seconds}s`;
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if needed
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };
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
  return (
    <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
      <div className="p-4">
        {/* Table Header with Pagination Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">

            Showing {leads.length > 0 ? (startIndex ?? 0) + 1 : 0} to{" "}
            {Math.min(endIndex ? endIndex : 0, leads.length)} of {totalLeads}{" "}
            leads
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr No</TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDashboardInitialized && paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead, index) => {


                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        {(currentPage - 1) * 50 + index + 1}
                      </TableCell>

                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.phone_number}</TableCell>
                      <TableCell>{lead.status}</TableCell>
                      <TableCell>{lead.disposition || "-"}</TableCell>
                      <TableCell>{formatDuration(lead.duration)}</TableCell>
                      <TableCell>${lead.cost?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        {lead.recordingUrl ? (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayRecording(lead.id)}
                              className="flex items-center gap-2"
                            >
                              <Volume2 className="h-4 w-4" />
                              {playingLeadId === lead.id
                                ? "Hide Player"
                                : "Play Recording"}
                            </Button>
                            {playingLeadId === lead.id && (
                              <div className="mt-2">
                                <audio
                                  controls
                                  className="w-full max-w-xs"
                                  src={lead.recordingUrl}
                                  onError={() => {
                                    toast.error("Failed to load recording");
                                  }}
                                >
                                  Your browser does not support the audio
                                  element.
                                </audio>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No recording
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(lead?.initiated_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShowLeadDetails(lead)}
                          className="h-8 w-8 p-0"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="h-[100px]">
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground"
                  >
                    {searchTerm && isSearchActive
                      ? "No matching leads found."
                      : isViewingCampaign
                        ? "No leads found for this campaign."
                        : isDashboardInitialized
                          ? "No leads found. Upload a CSV file to get started."
                          : "Create a new campaign to get started."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {leads.length > 0 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Basic Lead Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Name
                    </label>
                    <p className="text-sm font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-sm">{selectedLead.phone_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Current Status
                    </label>
                    <p className="text-sm">{selectedLead.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Latest Disposition
                    </label>
                    <p className="text-sm">{selectedLead.disposition || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Call Date
                    </label>
                    <p className="text-sm">
                      {formatDateTime(selectedLead.initiated_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">
                  Call Attempts History
                </h3>
                {loadingAttempts ? (
                  <p className="text-sm text-muted-foreground">
                    Loading call attempts...
                  </p>
                ) : callAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {callAttempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">
                            Attempt #{callAttempts.length - index}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(attempt.created_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Disposition
                            </label>
                            <p className="text-sm">
                              {attempt.to_disposition || "-"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Duration
                            </label>
                            <p className="text-sm">
                              {formatDuration(attempt.duration || 0)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Cost
                            </label>
                            <p className="text-sm">
                              ${attempt.cost?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No call attempts found for this lead.
                  </p>
                )}
              </div>

              {selectedLead.recordingUrl && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Latest Recording</h3>
                  <audio
                    controls
                    className="w-full"
                    src={selectedLead.recordingUrl}
                    onError={() => {
                      toast.error("Failed to load recording");
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsTable;

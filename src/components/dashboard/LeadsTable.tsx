import { FC, useState, useMemo } from "react";
import { Phone, Volume2 } from "lucide-react";
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
  triggerSingleCall: (leadId: string) => void;
  paginatedLeads: Lead[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  handlePageChange: (page: number) => void;
  totalLeads: number;
  startIndex?: number;
  endIndex?: number;
}

const LeadsTable: FC<LeadsTableProps> = ({
  leads,
  isDashboardInitialized,
  isSearchActive,
  searchTerm,
  isViewingCampaign,
  isCallInProgress,
  triggerSingleCall,
  paginatedLeads,
  totalPages,
  currentPage,
  setCurrentPage,
  handlePageChange,
  totalLeads,
  startIndex,
  endIndex,
}) => {
  const [playingLeadId, setPlayingLeadId] = useState<string | null>(null);

  // Calculate pagination values

  // Reset to page 1 when leads change (e.g., after search)

  const handlePlayRecording = (leadId: string) => {
    setPlayingLeadId(playingLeadId === leadId ? null : leadId);
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
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "America/New_York", // optional: forces Eastern Time
      year: "numeric",
      month: "long",
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
            Showing {startIndex ? startIndex + 1 : 0} to{" "}
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
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Call Initiated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDashboardInitialized && paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
                  <TableRow key={lead.id}>
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
                                Your browser does not support the audio element.
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
                      {lead.status === "Pending" && lead.phone_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerSingleCall(lead.id)}
                          disabled={isCallInProgress}
                        >
                          <Phone className="h-4 w-4 mr-1" /> Call
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {" "}
                      {lead.initiated_at
                        ? formatDateTime(lead.initiated_at)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-[100px]">
                  <TableCell
                    colSpan={8}
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
    </div>
  );
};

export default LeadsTable;

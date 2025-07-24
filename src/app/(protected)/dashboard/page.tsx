"use client";
import { FC, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseCSV } from "@/utils/csvParser";
import { supabase } from "@/integrations/supabase/client";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  fetchCampaignById,
  createEmptyCampaign,
  addLeadsToCampaign,
  fetchLeadsForCampaign,
  resetLeads,
  getTotalPagesForCampaign,
} from "@/services/campaignService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeads } from "@/hooks/useLeads";
import { useCampaignExecution } from "@/hooks/useCampaignExecution";
import StatsGrid from "@/components/dashboard/StatsGrid";
import ControlsSection from "@/components/dashboard/ControlsSection";
import LeadsTable from "@/components/dashboard/LeadsTable";
import SearchBar from "@/components/dashboard/SearchBar";

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
}

export const Dashboard: FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;

  const [isUploading, setIsUploading] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [isViewingCampaign, setIsViewingCampaign] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  );
  const [isDashboardInitialized, setIsDashboardInitialized] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const startIndex = useMemo(() => {
    return (currentPage - 1) * ITEMS_PER_PAGE;
  }, [currentPage, ITEMS_PER_PAGE]);

  const endIndex = useMemo(() => {
    return startIndex + ITEMS_PER_PAGE;
  }, [startIndex, ITEMS_PER_PAGE]);

  useEffect(() => {
    const fetchPaginatedLeads = async () => {
      try {
        const campaignIdToUse = campaignId || currentCampaignId;
        if (!campaignIdToUse) return;

        const leads = await fetchLeadsForCampaign(
          campaignIdToUse,
          startIndex,
          endIndex
        );
        setFilteredLeads(leads);
      } catch (error) {
        console.error("Error fetching paginated leads:", error);
      } finally {
      }
    };

    fetchPaginatedLeads();
  }, [currentPage]);

  useEffect(() => {
    const fetchTotalPages = async () => {
      const campaignIdToUse = campaignId || currentCampaignId;
      if (!campaignIdToUse) return;

      const { totalPages, totalLeads } = await getTotalPagesForCampaign(
        campaignIdToUse,
        ITEMS_PER_PAGE
      );

      setTotalPages(totalPages);
      setTotalLeads(totalLeads);
    };

    fetchTotalPages();
    fetchTotalPages();
  }, [campaignId, currentCampaignId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { stats, setStats, resetDashboardData } = useLeads(
    isViewingCampaign,
    isDashboardInitialized,
    currentCampaignId ? currentCampaignId : campaignId ? campaignId : null
  );

  const {
    isExecuting,
    isCallInProgress,
    selectedPacing,
    setSelectedPacing,
    toggleExecution,
    triggerSingleCall,
  } = useCampaignExecution(
    stats,
    isViewingCampaign ? campaignId : currentCampaignId
  );

  // Load campaign data if campaignId is present in URL
  useEffect(() => {
    if (campaignId) {
      loadCampaignData(campaignId);
      setIsDashboardInitialized(true);
    } else {
      setIsViewingCampaign(false);
      setIsDashboardInitialized(false);
      resetDashboardData();
    }
  }, [campaignId]);

  // Real-time subscriptions for leads and campaigns
  useEffect(() => {
    const campaignIdToUse = campaignId || currentCampaignId;
    if (!campaignIdToUse) return;

    // Subscribe to real-time changes for leads
    const leadsChannel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        async (payload) => {
          console.log("Real-time lead change:", payload);

          // Refresh the leads table
          try {
            const leads = await fetchLeadsForCampaign(
              campaignIdToUse,
              startIndex,
              endIndex
            );
            setFilteredLeads(leads);
          } catch (error) {
            console.error("Error refreshing leads:", error);
          }
        }
      )
      .subscribe();

    // Subscribe to real-time changes for campaigns
    const campaignsChannel = supabase
      .channel("campaigns-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignIdToUse}`,
        },
        (payload) => {
          console.log("Real-time campaign change:", payload);

          // Update campaign stats from the real-time payload
          if (payload.new) {
            setStats({
              completed: payload.new.completed || 0,
              inProgress: payload.new.in_progress || 0,
              remaining: payload.new.remaining || 0,
              failed: payload.new.failed || 0,
              totalDuration: payload.new.duration || 0,
              totalCost: payload.new.cost || 0,
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(campaignsChannel);
    };
  }, []);
  //  [campaignId, currentCampaignId, startIndex, endIndex]);
  // Search functionality will be handled server-side

  const loadCampaignData = async (id: string) => {
    try {
      setIsViewingCampaign(true);
      setIsDashboardInitialized(true);

      const campaign = await fetchCampaignById(id);
      setActiveCampaign(campaign);

      setStats({
        completed: campaign.completed || 0,
        inProgress: campaign.in_progress || 0,
        remaining: campaign.remaining || 0,
        failed: campaign.failed || 0,
        totalDuration: campaign.duration || 0,
        totalCost: campaign.cost || 0,
      });

      const leads = await fetchLeadsForCampaign(id, startIndex, endIndex);
      setFilteredLeads(leads);
      setCampaignName(campaign.name || "");
      document.title = `${campaign.name || "Campaign"} - Call Manager`;

      toast.success(`Loaded campaign: ${campaign.name}`);
    } catch (error) {
      console.error("Error loading campaign data:", error);
      toast.error("Failed to load campaign data");
      clearCampaignView();
    }
  };

  const clearCampaignView = () => {
    router.push("/dashboard");
    setIsViewingCampaign(false);
    setActiveCampaign(null);
    document.title = "Dashboard - Call Manager";
    resetDashboardData();
    setIsDashboardInitialized(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalLeads(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsedLeads = parseCSV(content);

          if (parsedLeads.length === 0) {
            toast.error("No valid leads found in the CSV");
            setIsUploading(false);
            return;
          }

          const { data: phoneIds, error } = await (supabase.rpc as any)(
            "get_multiple_available_phone_ids",
            { count: parsedLeads.length }
          );

          if (error) {
            console.error("Error getting phone IDs:", error);
            toast.error("Failed to fetch available phone IDs");
            setIsUploading(false);
            return;
          }

          const formattedLeads = parsedLeads.map((lead, index) => {
            const phoneId = phoneIds?.[index % phoneIds.length] || null;
            return {
              name: lead.name,
              phone_number: lead.phoneNumber,
              phone_id: phoneId,
              status: phoneId ? "Pending" : "Failed",
              disposition: phoneId ? null : "No available phone ID",
            };
          });

          if (currentCampaignId) {
            const updatedCampaign = await addLeadsToCampaign(
              currentCampaignId,
              formattedLeads
            );

            if (updatedCampaign) {
              toast.success(
                `Uploaded ${formattedLeads.length} leads to campaign`
              );
              await loadCampaignData(currentCampaignId);
              setCurrentCampaignId(null);
              setShowUploadDialog(false);
              setIsDashboardInitialized(true);
            }
          } else {
            setIsDashboardInitialized(true);
            await resetLeads();
            resetDashboardData();

            const { error } = await supabase
              .from("leads")
              .insert(formattedLeads);

            if (error) {
              console.error("Error inserting leads:", error);
              toast.error("Failed to insert leads");
            } else {
              toast.success(
                `Successfully uploaded ${formattedLeads.length} leads`
              );
            }

            fetchLeadsForCampaign(
              currentCampaignId
                ? currentCampaignId
                : campaignId
                ? campaignId
                : "",
              startIndex,
              endIndex
            );
          }
        } catch (err) {
          console.error("Error parsing CSV:", err);
          toast.error(
            "Failed to parse CSV. Must include Name and Phone columns."
          );
        }

        setIsUploading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      console.error("File read error:", err);
      toast.error("Failed to read file");
      setIsUploading(false);
    }

    e.target.value = "";
  };

  const handleNewCampaign = () => {
    setShowNewCampaignDialog(true);
    setCampaignName(`Campaign ${new Date().toLocaleDateString()}`);
  };

  const handleCreateNewCampaign = async () => {
    try {
      if (!campaignName.trim()) {
        toast.error("Please enter a valid campaign name");
        return;
      }

      resetDashboardData();
      if (!userId) {
        console.error("User ID is missing");
        return;
      }
      const campaign = await createEmptyCampaign(campaignName, userId);

      if (campaign) {
        toast.success(`Campaign "${campaignName}" created successfully`);
        setShowNewCampaignDialog(false);

        setCurrentCampaignId(campaign.id);
        setShowUploadDialog(true);
        setIsDashboardInitialized(true);

        router.push(`/?campaignId=${campaign.id}`);
      } else {
        toast.error("Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("An error occurred while creating the campaign");
    }
  };

  const handleSearch = async () => {
    const hasSearchTerm = !!searchTerm.trim();
    setIsSearchActive(hasSearchTerm);

    const campaignIdToUse = campaignId || currentCampaignId;
    if (!campaignIdToUse) {
      toast.error("No campaign selected for search");
      return;
    }

    try {
      const searchResults = await fetchLeadsForCampaign(
        campaignIdToUse,
        startIndex,
        endIndex,
        hasSearchTerm ? searchTerm : undefined
      );

      setFilteredLeads(searchResults);
      setCurrentPage(1); // Reset to first page for search results

      if (hasSearchTerm) {
        toast.success(`Found ${searchResults.length} matching leads`);
      } else {
        toast.info("Showing all leads");
      }
    } catch (error) {
      console.error("Error searching leads:", error);
      toast.error("Failed to search leads");
    }
  };

  const clearSearch = async () => {
    setSearchTerm("");
    setIsSearchActive(false);
    setCurrentPage(1);

    const campaignIdToUse = campaignId || currentCampaignId;
    if (campaignIdToUse) {
      try {
        const allLeads = await fetchLeadsForCampaign(
          campaignIdToUse,
          0,
          ITEMS_PER_PAGE
        );
        setFilteredLeads(allLeads);
      } catch (error) {
        console.error("Error clearing search:", error);
      }
    }

    toast.info("Search cleared");
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Call Manager</h1>
            {isViewingCampaign && activeCampaign ? (
              <>
                <div className="flex items-center mt-4 space-x-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Campaign: {activeCampaign.name}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCampaignView}
                  >
                    Back to Dashboard
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Campaign created on{" "}
                  {new Date(activeCampaign.created_at).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                  Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Manage and monitor your AI outbound calling campaigns.
                </p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isViewingCampaign ? (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentCampaignId(activeCampaign.id);
                  setShowUploadDialog(true);
                }}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Add Leads
              </Button>
            ) : (
              <>
                {isDashboardInitialized && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Data
                  </Button>
                )}
                <Button className="bg-primary" onClick={handleNewCampaign}>
                  + New Campaign
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <StatsGrid stats={stats} />

      <ControlsSection
        isViewingCampaign={isViewingCampaign}
        isDashboardInitialized={isDashboardInitialized}
        isExecuting={isExecuting}
        isCallInProgress={isCallInProgress}
        isUploading={isUploading}
        selectedPacing={selectedPacing}
        setSelectedPacing={setSelectedPacing}
        toggleExecution={toggleExecution}
        handleFileUpload={handleFileUpload}
        activeCampaign={activeCampaign}
        setCurrentCampaignId={setCurrentCampaignId}
        setShowUploadDialog={setShowUploadDialog}
      />

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isViewingCampaign ? "Campaign Leads" : "Call Log"}
            </h3>
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
              clearSearch={clearSearch}
              isSearchActive={isSearchActive}
            />
          </div>
        </div>

        <LeadsTable
          leads={filteredLeads}
          paginatedLeads={filteredLeads}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          isDashboardInitialized={isDashboardInitialized}
          isSearchActive={isSearchActive}
          searchTerm={searchTerm}
          isViewingCampaign={isViewingCampaign}
          isCallInProgress={isCallInProgress}
          triggerSingleCall={triggerSingleCall}
          handlePageChange={handlePageChange}
          totalLeads={totalLeads}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>

      {/* New Campaign Dialog */}
      <Dialog
        open={showNewCampaignDialog}
        onOpenChange={setShowNewCampaignDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                autoFocus
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will create a new empty campaign. You'll be prompted to
              upload leads afterward.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCampaignDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNewCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Leads Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              Upload a CSV file with leads for your{" "}
              {currentCampaignId ? "campaign" : "dashboard"}.
            </p>
            <Button
              className="flex items-center space-x-2 w-full"
              variant="outline"
              onClick={() =>
                document.getElementById("campaign-file-upload")?.click()
              }
              disabled={isUploading}
            >
              <FileUp className="h-4 w-4" />
              <span>{isUploading ? "Uploading..." : "Select CSV File"}</span>
            </Button>
            <input
              id="campaign-file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              CSV must include columns for Lead Name and Phone Number
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setCurrentCampaignId(null);
              }}
            >
              Skip Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

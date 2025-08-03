"use client";
import { FC, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseCSV } from "@/utils/csvParser";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

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
import {
  useAddLeadsToCampaignMutation,
  useCreateCampaignMutation,
  useFetchCampaignByIdLazyQuery,
  useFetchLeadsForCampaignLazyQuery,
  useGetMultipleAvailablePhoneIdsLazyQuery,
  useGetTotalPagesForCampaignLazyQuery,
} from "@/generated/graphql";
import { useRealTime } from "@/hooks/useRealTime";

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
  //Mutations
  const [createCampaignMutation, { data, loading, error }] =
    useCreateCampaignMutation();
  const [addLeadsToCampaignMutation] = useAddLeadsToCampaignMutation();
  //Queries
  const [fetchLeadsForCampaignQuery] = useFetchLeadsForCampaignLazyQuery();
  const [fetchCampaignByIdQuery] = useFetchCampaignByIdLazyQuery();
  const [fetchPhoneIds] = useGetMultipleAvailablePhoneIdsLazyQuery();
  const [fetchTotalPagesQuery] = useGetTotalPagesForCampaignLazyQuery();
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  //states
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
        const { data } = await fetchLeadsForCampaignQuery({
          variables: {
            campaignId: campaignIdToUse,
            skip: startIndex,
            take: endIndex - startIndex,
          },
        });
        const leads = (data?.fetchLeadsForCampaign?.data as Lead[]) ?? [];
        setFilteredLeads(leads);
      } catch (error) {
        console.error("Error fetching paginated leads:", error);
      } finally {
      }
    };

    fetchPaginatedLeads();
  }, [currentPage]);
  const fetchTotalPages = async () => {
    console.log("called on upload");
    const campaignIdToUse = campaignId || currentCampaignId;
    if (!campaignIdToUse) return;
    console.log({ campaignIdToUse });
    const { data } = await fetchTotalPagesQuery({
      variables: {
        campaignId: campaignIdToUse,
        itemsPerPage: ITEMS_PER_PAGE,
      },
      fetchPolicy: "network-only",
    });

    if (data?.getTotalPagesForCampaign) {
      const totalLeads = data.getTotalPagesForCampaign?.totalLeads || 0;
      const totalPages = data.getTotalPagesForCampaign?.totalPages || 1;
      setTotalPages(totalPages);
      setTotalLeads(totalLeads);
    }
  };

  useEffect(() => {
    fetchTotalPages(); // only once now
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

  useRealTime(campaignId, startIndex, endIndex, setFilteredLeads, setStats);
  // Real-time subscriptions for leads and campaigns

  const loadCampaignData = async (id: string) => {
    try {
      setIsViewingCampaign(true);
      setIsDashboardInitialized(true);

      const { data: campaignRes } = await fetchCampaignByIdQuery({
        variables: { campaignId: id },
        fetchPolicy: "network-only",
      });
      const campaign = campaignRes?.fetchCampaignById?.data;
      console.log({ campaign });
      if (!campaign) throw new Error("No campaign found");
      setActiveCampaign(campaign);

      setStats({
        completed: campaign.completed || 0,
        inProgress: campaign.in_progress || 0,
        remaining: campaign.remaining || 0,
        failed: campaign.failed || 0,
        totalDuration: campaign.duration || 0,
        totalCost: campaign.cost || 0,
      });

      const { data } = await fetchLeadsForCampaignQuery({
        variables: {
          campaignId: id,
          skip: startIndex,
          take: endIndex - startIndex,
        },
      });
      const leads = (data?.fetchLeadsForCampaign?.data as Lead[]) ?? [];
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

          const { data, error: fetchError } = await fetchPhoneIds({
            variables: {
              count: parsedLeads.length,
            },
          });

          if (fetchError || !data?.getMultipleAvailablePhoneIds) {
            console.error("Error fetching phone IDs:", fetchError);
            toast.error("Failed to fetch available phone IDs");
            setIsUploading(false);
            return;
          }

          const phoneIds = data.getMultipleAvailablePhoneIds;

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
            const { data, errors } = await addLeadsToCampaignMutation({
              variables: {
                campaignId: currentCampaignId,
                leads: formattedLeads,
              },
            });

            if (errors) {
              toast.error("Failed to add leads to campaign");
              return;
            }

            const updatedCampaign = data?.addLeadsToCampaign?.data;

            if (updatedCampaign) {
              toast.success(
                `Uploaded ${formattedLeads.length} leads to campaign`
              );
              await loadCampaignData(currentCampaignId);
              await fetchTotalPages();
              setCurrentCampaignId(null);
              setShowUploadDialog(false);
              setIsDashboardInitialized(true);
            }
          }
        } catch (err) {
          console.error("Error parsing CSV:", err);
          toast.error(
            "Failed to parse CSV. Must include Name and Phone columns."
          );
        }

        setIsUploading(false);
      };
      fetchTotalPages();
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
      const result = await createCampaignMutation({
        variables: {
          campaignName,
          userId,
        },
      });
      if (result?.data?.createCampaign?.userError === null) {
        toast.success(`Campaign "${campaignName}" created successfully`);
        // setShowNewCampaignDialog(false);

        setCurrentCampaignId(result?.data?.createCampaign?.data?.id ?? "");
        // setShowUploadDialog(true);
        // setIsDashboardInitialized(true);

        router.push(`/campaigns/${result?.data?.createCampaign?.data?.id}`);
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
    console.log("Searching leads with term:", searchTerm);
    try {
      const { data: leadsData, error: fetchError } =
        await fetchLeadsForCampaignQuery({
          variables: {
            campaignId: currentCampaignId ?? campaignId ?? "",
            skip: 0,
            take: ITEMS_PER_PAGE,
            searchTerm: hasSearchTerm ? searchTerm : undefined,
          },
        });

      if (fetchError) {
        console.error(fetchError);
        toast.error("Failed to fetch leads");
        return;
      }

      const searchResults =
        (leadsData?.fetchLeadsForCampaign?.data as Lead[]) ?? [];

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
        console.log("cleared called with campaignId:", campaignIdToUse);
        const { data: leadsData, error: fetchError } =
          await fetchLeadsForCampaignQuery({
            variables: {
              campaignId: campaignIdToUse,
              skip: 0,
              take: ITEMS_PER_PAGE,
            },
          });

        if (fetchError) {
          console.error(fetchError);
          toast.error("Failed to fetch leads");
          return;
        }

        const allLeads =
          (leadsData?.fetchLeadsForCampaign?.data as Lead[]) ?? [];
        setCurrentPage(1);
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
          ITEMS_PER_PAGE={ITEMS_PER_PAGE!}
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

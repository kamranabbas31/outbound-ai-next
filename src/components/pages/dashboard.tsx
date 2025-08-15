"use client";
import { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CalendarIcon,
  FileUp,
  Play,
  Settings,
  Square,
  Unlink,
} from "lucide-react";
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
  useAttachCadenceToCampaignMutation,
  useCadenceTemplatesLazyQuery,
  useCreateCampaignMutation,
  useCreatePhoneIdsMutation,
  useFetchCampaignByIdLazyQuery,
  useFetchLeadsForCampaignLazyQuery,
  useGetMultipleAvailablePhoneIdsLazyQuery,
  useGetTotalPagesForCampaignLazyQuery,
  useStopCadenceMutation,
  useUpdateCampaignMutation,
} from "@/generated/graphql";
import { useRealTime } from "@/hooks/useRealTime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
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

export interface Campaign {
  id: string;
  name: string;
  file_name?: string | null;
  status?: string | null;
  execution_status?: string | null;
  leads_count?: number | null;
  completed?: number | null;
  in_progress?: number | null;
  remaining?: number | null;
  failed?: number | null;
  duration?: number | null;
  cost?: number | null;
  user_id?: string | null;
  created_at?: string | null;
  cadence_template?: {
    id: string;
    name: string;
  } | null;
  cadence_stopped?: boolean;
  cadence_start_date?: string | null;
}

export const Dashboard: FC = () => {
  //Mutations
  const [createCampaignMutation] = useCreateCampaignMutation();
  const [addLeadsToCampaignMutation] = useAddLeadsToCampaignMutation();
  const [attachCadenceToCampaignMutation] =
    useAttachCadenceToCampaignMutation();
  const [stopCadenceMutation] = useStopCadenceMutation();
  const [updateCampaignMutation] = useUpdateCampaignMutation();
  const [createPhoneIds, { loading }] = useCreatePhoneIdsMutation();

  //Queries
  const [fetchLeadsForCampaignQuery] = useFetchLeadsForCampaignLazyQuery();
  const [fetchCampaignByIdQuery] = useFetchCampaignByIdLazyQuery();
  const [fetchPhoneIds] = useGetMultipleAvailablePhoneIdsLazyQuery();
  const [fetchTotalPagesQuery] = useGetTotalPagesForCampaignLazyQuery();
  const [fetchCadenceTemplatesQuery] = useCadenceTemplatesLazyQuery();

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
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isViewingCampaign, setIsViewingCampaign] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  );
  const [isDashboardInitialized, setIsDashboardInitialized] = useState(false);
  // Cadence selection state
  const [cadences, setCadences] = useState<any[]>([]);
  const [selectedCadence, setSelectedCadence] = useState<string>("");
  const [cadenceStartDate, setCadenceStartDate] = useState<Date>();

  // Cadence management state
  const [showCadenceDialog, setShowCadenceDialog] = useState(false);
  const [managingCadenceFor, setManagingCadenceFor] = useState<string | null>(
    null
  );
  const [showDelinkConfirmation, setShowDelinkConfirmation] = useState(false);
  const [cadenceToDelink, setCadenceToDelink] = useState<{
    campaignId: string;
    cadenceId: string;
  } | null>(null);
  
  // Calendar popover states
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isUploadDatePopoverOpen, setIsUploadDatePopoverOpen] = useState(false);
  const [isManageDatePopoverOpen, setIsManageDatePopoverOpen] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  // Date range states
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Initialize default date range to last 30 days
  useEffect(() => {
    // Only set default dates if they haven't been set yet
    if (!startDate && !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      const defaultStart = start.toISOString().split('T')[0];
      const defaultEnd = end.toISOString().split('T')[0];
      
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
    }
  }, []); // Empty dependency array - only run once on mount

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const username = useSelector((state: RootState) => state.auth.user?.username);
  const startIndex = useMemo(() => {
    return (currentPage - 1) * ITEMS_PER_PAGE;
  }, [currentPage, ITEMS_PER_PAGE]);

  const endIndex = useMemo(() => {
    return startIndex + ITEMS_PER_PAGE;
  }, [startIndex, ITEMS_PER_PAGE]);

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
        fetchPolicy: "network-only",
      });

      const leads = (data?.fetchLeadsForCampaign?.data as Lead[]) ?? [];

      setFilteredLeads(leads);
    } catch (error) {
      console.error("Error fetching paginated leads:", error);
    } finally {
    }
  };
  useEffect(() => {
    fetchPaginatedLeads();
  }, [currentPage]);
  const fetchTotalPages = async () => {

    const campaignIdToUse = campaignId || currentCampaignId;
    if (!campaignIdToUse) return;

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
  
  const fetchCadences = useCallback(async () => {
    try {
      const { data, error } = await fetchCadenceTemplatesQuery({
        fetchPolicy: "network-only",
      });

      if (error || data?.cadenceTemplates?.userError?.message) {
        throw new Error(
          data?.cadenceTemplates?.userError?.message ||
          error?.message ||
          "Unknown error"
        );
      }

      const templates = data?.cadenceTemplates?.templates || [];
      setCadences(templates);
    } catch (error) {
      console.error("Error fetching cadences:", error);
      toast.error("Failed to load cadences");
    } finally {
    }
  }, [fetchCadenceTemplatesQuery]);

  useEffect(() => {
    if (showUploadDialog) {
      fetchCadences();
      
      // If campaign already has a cadence, set it as selected
      if (activeCampaign?.cadence_template?.id) {
        setSelectedCadence(activeCampaign.cadence_template.id);
        if (activeCampaign.cadence_start_date) {
          setCadenceStartDate(new Date(activeCampaign.cadence_start_date));
        }
      } else {
        // Reset cadence selection if no cadence is attached
        setSelectedCadence("");
        setCadenceStartDate(undefined);
      }
    }
  }, [showUploadDialog, fetchCadences, activeCampaign]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { stats, setStats, resetDashboardData, resetDashboardStats } = useLeads(
    isViewingCampaign,
    isDashboardInitialized,
    currentCampaignId ? currentCampaignId : campaignId ? campaignId : null,
    startDate, endDate, userId
  );

  const {
    isExecuting,
    isCallInProgress,
    selectedPacing,
    setSelectedPacing,
    toggleExecution,
  } = useCampaignExecution(
    isViewingCampaign
      ? campaignId
      : currentCampaignId
        ? currentCampaignId
        : null
  );

  // Load campaign data if campaignId is present in URL
  useEffect(() => {
    if (campaignId) {
      loadCampaignData(campaignId);
      setIsDashboardInitialized(true);
      
      // Check if we should show upload dialog for newly created campaign
      const shouldShowUpload = sessionStorage.getItem('showUploadDialog');
      const newCampaignId = sessionStorage.getItem('newCampaignId');
      
      if (shouldShowUpload === 'true' && newCampaignId === campaignId) {
        // Clear the session storage flags
        sessionStorage.removeItem('showUploadDialog');
        sessionStorage.removeItem('newCampaignId');
        
        // Set the current campaign ID and show upload dialog
        setCurrentCampaignId(campaignId);
        setShowUploadDialog(true);
        
        // Fetch cadences for the upload dialog
        fetchCadences();
      }
    } else {
      setIsViewingCampaign(false);
      setIsDashboardInitialized(false);
      resetDashboardStats()
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
      const campaign = campaignRes?.fetchCampaignById?.data as Campaign | null;
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
        fetchPolicy: "network-only",
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
    // resetDashboardData();
    resetDashboardStats()
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
                 cadenceId:
                   activeCampaign?.cadence_template?.id || 
                   (selectedCadence && selectedCadence !== "none" ? selectedCadence : undefined),
                 cadenceStartDate:
                   activeCampaign?.cadence_start_date || 
                   (selectedCadence && selectedCadence !== "none" ? new Date().toISOString() : undefined),
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
              setSelectedCadence("");
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
        setShowNewCampaignDialog(false);

        const newCampaignId = result?.data?.createCampaign?.data?.id ?? "";
        setCurrentCampaignId(newCampaignId);
        
        // Redirect to the new campaign page
        router.push(`/campaigns/${newCampaignId}`);
        
        // Set a flag to show upload dialog after navigation
        // We'll use sessionStorage to persist this across navigation
        sessionStorage.setItem('showUploadDialog', 'true');
        sessionStorage.setItem('newCampaignId', newCampaignId);
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
    ;
    try {
      const { data: leadsData, error: fetchError } =
        await fetchLeadsForCampaignQuery({
          variables: {
            campaignId: currentCampaignId ?? campaignId ?? "",
            skip: 0,
            take: ITEMS_PER_PAGE,
            searchTerm: hasSearchTerm ? searchTerm : undefined,
          },
          fetchPolicy: "network-only",
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

        const { data: leadsData, error: fetchError } =
          await fetchLeadsForCampaignQuery({
            variables: {
              campaignId: campaignIdToUse,
              skip: 0,
              take: ITEMS_PER_PAGE,
            },
            fetchPolicy: "network-only",
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

  const handleToggleCadenceExecution = async () => {
    if (!activeCampaign?.id) return;

    const newPausedState = !activeCampaign.cadence_stopped;

    try {
      const { data, errors } = await updateCampaignMutation({
        variables: {
          input: {
            id: activeCampaign.id,
            cadence_stopped: newPausedState,
          },
        },
      });

      if (errors && errors.length > 0) throw errors[0];

      await loadCampaignData(activeCampaign.id); // Refresh data

      toast.success(
        newPausedState
          ? "Cadence execution stopped"
          : "Cadence execution resumed"
      );
    } catch (error) {
      console.error("Error toggling cadence execution:", error);
      toast.error("Failed to update cadence execution status");
    }
  };
  const handleAttachCadence = (campaignId: string) => {
    setManagingCadenceFor(campaignId);
    setSelectedCadence("");
    setCadenceStartDate(undefined);
    fetchCadences();
    setShowCadenceDialog(true);
  };

  const handleDelinkCadence = (campaignId: string) => {
    const cadenceId = activeCampaign?.cadence_template?.id || "Unknown Cadence";
    setCadenceToDelink({ campaignId, cadenceId });
    setShowDelinkConfirmation(true);
  };

  const confirmDelinkCadence = async () => {
    if (!cadenceToDelink?.campaignId) return;

    try {
      const { data, errors } = await updateCampaignMutation({
        variables: {
          input: {
            id: cadenceToDelink.campaignId,
            cadence_template_id: null,
            cadence_start_date: null,
            cadence_stopped: false,
            cadence_completed: false,
          },
        },
      });

      if (errors && errors.length > 0) throw errors[0];

      await loadCampaignData(cadenceToDelink.campaignId); // Refresh UI

      toast.success("Cadence delinked from campaign");
    } catch (error) {
      console.error("Error delinking cadence:", error);
      toast.error("Failed to delink cadence");
    } finally {
      setShowDelinkConfirmation(false);
      setCadenceToDelink(null);
    }
  };

  const handleSaveCadence = async () => {
    if (!managingCadenceFor || !selectedCadence || selectedCadence === "none") {
      toast.error("Please select a cadence template");
      return;
    }

    try {
      const res = await attachCadenceToCampaignMutation({
        variables: {
          input: {
            campaignId: managingCadenceFor,
            cadenceId: selectedCadence,
            ...(cadenceStartDate
              ? { startDate: cadenceStartDate.toISOString() }
              : {}),
          },
        },
      });

      const result = res.data?.attachCadenceToCampaign;

      if (result?.userError) {
        toast.error(result.userError.message);
        return;
      }

      if (result?.success) {
        toast.success("Cadence attached to campaign");
      } else {
        toast.error("Failed to attach cadence");
      }

      setShowCadenceDialog(false);
      setManagingCadenceFor(null);
      setSelectedCadence("");
      setCadenceStartDate(undefined);
      loadCampaignData(managingCadenceFor); // Refresh campaign data
    } catch (error) {
      console.error("Error attaching cadence:", error);
      toast.error("Something went wrong while attaching the cadence");
    }
  };

  const handleUpdateStartDate = async (date: Date | undefined) => {
    if (!activeCampaign?.id) return;

    try {
      const { data, errors } = await updateCampaignMutation({
        variables: {
          input: {
            id: activeCampaign.id,
            cadence_start_date: date ? date.toISOString() : null,
          },
        },
      });

      if (errors && errors.length > 0) throw errors[0];

      await loadCampaignData(activeCampaign.id); // Refresh data

      toast.success(
        date
          ? "Start date updated successfully"
          : "Start date removed successfully"
      );
    } catch (error) {
      console.error("Error updating start date:", error);
      toast.error("Failed to update start date");
    }
  };
  const handlePhoneIdsCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = (event.target?.result as string).trim();
          const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

          if (lines.length < 2) {
            toast.error("No phone IDs found in file");
            setIsUploading(false);
            return;
          }

          const header = lines[0].toLowerCase();
          if (!["phone_ids", "phone_id"].includes(header)) {
            toast.error("CSV must have 'phone_ids' or 'phone_id' as the first column");
            setIsUploading(false);
            return;
          }

          const phoneIds = lines.slice(1).filter((id) => /^[0-9a-fA-F-]{36}$/.test(id));
          if (!phoneIds.length) {
            toast.error("No valid UUID phone IDs found");
            setIsUploading(false);
            return;
          }

          await createPhoneIds({ variables: { phoneIds } });
          toast.success(`Uploaded ${phoneIds.length} phone IDs`);
        } catch (err) {
          console.error(err);
          toast.error("Error processing CSV file");
        }

        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to read file");
      setIsUploading(false);
    }

    e.target.value = "";
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
                  {activeCampaign?.created_at
                    ? new Date(activeCampaign.created_at).toLocaleDateString()
                    : "-"}
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
                variant={
                  activeCampaign?.cadence_stopped ? "default" : "outline"
                }
                onClick={handleToggleCadenceExecution}
                disabled={!activeCampaign?.cadence_template?.id}
                className={
                  !activeCampaign?.cadence_template?.id
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                {activeCampaign?.cadence_stopped ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Cadence Execution
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Cadence Execution
                  </>
                )}
              </Button>
            ) : (
              <>
                {isDashboardInitialized && (
                  <Button variant="outline" onClick={fetchPaginatedLeads}>
                    Refresh Data
                  </Button>
                )}

                {username?.toLowerCase() === "kamraanabbas" && (
                  <>
                    <Button
                      className="bg-primary"
                      onClick={() => document.getElementById("phoneIdCsvUpload")?.click()}
                    >
                      Upload Phone IDs
                    </Button>

                    <input
                      id="phoneIdCsvUpload"
                      type="file"
                      accept=".csv"
                      style={{ display: "none" }}
                      onChange={handlePhoneIdsCsvUpload}
                    />
                  </>
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
      {isViewingCampaign && activeCampaign && (
        <div className="bg-white shadow-sm rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Cadence Configuration</h3>
                             <p className="text-sm text-muted-foreground mt-1">
                 {activeCampaign.cadence_template?.id
                   ? (
                     <>
                       This campaign is using the{" "}
                       <span className="font-bold text-gray-900">
                         "{activeCampaign.cadence_template?.name || "Unknown"}"
                       </span>{" "}
                       cadence template.
                     </>
                   )
                   : "No cadence template attached to this campaign."}
                 {activeCampaign.cadence_start_date && (
                   <span className="block">
                     Start date:{" "}
                     <span className="font-semibold">
                       {new Date(
                         activeCampaign.cadence_start_date
                       ).toLocaleDateString()}
                     </span>
                   </span>
                 )}
               </p>
            </div>
            <div className="flex flex-col space-y-2">
              {activeCampaign?.cadence_template?.id ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelinkCadence(activeCampaign.id)}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Delink Cadence
                  </Button>

                  <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !activeCampaign.cadence_start_date &&
                          "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {activeCampaign.cadence_start_date
                          ? `Change Start Date`
                          : "Add Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          activeCampaign.cadence_start_date
                            ? new Date(activeCampaign.cadence_start_date)
                            : undefined
                        }
                        onSelect={(date) => {
                          handleUpdateStartDate(date);
                          setIsStartDatePopoverOpen(false);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        disabled={(date: Date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                      {activeCampaign.cadence_start_date && (
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleUpdateStartDate(undefined);
                              setIsStartDatePopoverOpen(false);
                            }}
                            className="w-full"
                          >
                            Remove Start Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAttachCadence(activeCampaign.id)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Attach Cadence
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
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
          handlePageChange={handlePageChange}
          totalLeads={totalLeads}
          startIndex={startIndex}
          endIndex={endIndex}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE!}
          cadenceAttached={activeCampaign?.cadence_template?.id ? true : false}  
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
              {
                "This will create a new empty campaign. You'll be prompted to upload leads afterward."
              }
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

                    <div className="space-y-2">
                <Label htmlFor="cadence-select">
                  {activeCampaign?.cadence_template?.id ? "Selected Cadence" : "Select Cadence (Optional)"}
                </Label>
                <Select
                 value={selectedCadence}
                 onValueChange={setSelectedCadence}
                 disabled={activeCampaign?.cadence_template?.id ? true : false}
               >
                 <SelectTrigger className="bg-white">
                   <SelectValue placeholder={
                     activeCampaign?.cadence_template?.id 
                       ? `${activeCampaign.cadence_template.name}`
                       : "Choose a cadence template"
                   } />
                 </SelectTrigger>
                 <SelectContent className="bg-white border shadow-lg z-50">
                   <SelectItem value="none">No Cadence</SelectItem>
                   {cadences &&
                     cadences.length > 0 &&
                     cadences.map((cadence) => (
                       <SelectItem key={cadence.id} value={cadence.id}>
                         {cadence.name}
                       </SelectItem>
                     ))}
                 </SelectContent>
               </Select>
               <p className="text-xs text-muted-foreground">
                 {activeCampaign?.cadence_template?.id 
                   ? "This campaign already has a cadence attached. You cannot change it here."
                   : "Select a cadence template to apply to this campaign"
                 }
               </p>
             </div> 

                 {(selectedCadence && selectedCadence !== "none" && !activeCampaign?.cadence_template?.id) && (
                 <div className="space-y-2">
                   <Label>Cadence Start Date</Label>
                   <Popover open={isUploadDatePopoverOpen} onOpenChange={setIsUploadDatePopoverOpen}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         className={cn(
                           "w-full justify-start text-left font-normal bg-white",
                           !cadenceStartDate && "text-muted-foreground"
                         )}
                       >
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {cadenceStartDate ? (
                           format(cadenceStartDate, "PPP")
                         ) : (
                           <span>Pick a start date</span>
                         )}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent
                       className="w-auto p-0 bg-white border shadow-lg z-50"
                       align="start"
                     >
                       <Calendar
                         mode="single"
                         selected={cadenceStartDate}
                         onSelect={(date) => {
                           setCadenceStartDate(date);
                           setIsUploadDatePopoverOpen(false);
                         }}
                         disabled={(date) =>
                           date < new Date(new Date().setHours(0, 0, 0, 0))
                         }
                         initialFocus
                         className={cn("p-3 pointer-events-auto")}
                       />
                     </PopoverContent>
                   </Popover>
                   <p className="text-xs text-muted-foreground">
                     Select when the cadence should start executing
                   </p>
                 </div>
               )} 
            

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
                setSelectedCadence("");
                setCadenceStartDate(undefined);
              }}
            >
              Skip Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadence Management Dialog */}
      <Dialog open={showCadenceDialog} onOpenChange={setShowCadenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Campaign Cadence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manage-cadence-select">
                Select Cadence Template
              </Label>
              <Select
                value={selectedCadence}
                onValueChange={setSelectedCadence}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a cadence template" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {cadences &&
                    cadences.length > 0 &&
                    cadences.map((cadence) => (
                      <SelectItem key={cadence.id} value={cadence.id}>
                        {cadence.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a cadence template to apply to this campaign
              </p>
            </div>

            {selectedCadence && selectedCadence !== "none" && (
              <div className="space-y-2">
                <Label>Cadence Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white",
                        !cadenceStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cadenceStartDate ? (
                        format(cadenceStartDate, "PPP")
                      ) : (
                        <span>Pick a start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white border shadow-lg z-50"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={cadenceStartDate}
                      onSelect={setCadenceStartDate}
                      disabled={(date: Date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select when the cadence should start executing
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCadenceDialog(false);
                setManagingCadenceFor(null);
                setSelectedCadence("");
                setCadenceStartDate(undefined);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCadence}>Attach Cadence</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delink Cadence Confirmation Dialog */}
      <AlertDialog
        open={showDelinkConfirmation}
        onOpenChange={setShowDelinkConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delink Cadence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delink the "
              {activeCampaign?.cadence_template?.name}" cadence from this
              campaign? This action will remove the cadence template and reset
              the start date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDelinkConfirmation(false);
                setCadenceToDelink(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelinkCadence}>
              Yes, Delink Cadence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

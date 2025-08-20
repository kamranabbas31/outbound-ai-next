"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  useCadenceTemplatesLazyQuery,
  useDeleteCadenceTemplateMutation,
  useCreateCadenceTemplateMutation,
} from "@/generated/graphql";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

// Replace with your actual type based on your NestJS response
interface CadenceTemplate {
  id: string;
  name: string;
  retry_dispositions: string[];
  cadence_days: Record<
    string,
    {
      attempts: number;
      time_windows: string[];
    }
  >;
  campaigns: {
    id: string;
    name: string;
  }[];
}

const Cadences = () => {
  const router = useRouter();

  // queries and mutations
  const [fetchCadenceTemplatesQuery] = useCadenceTemplatesLazyQuery();
  const [deleteCadenceTemplateMutation] = useDeleteCadenceTemplateMutation();
  const [createCadenceTemplateMutation] = useCreateCadenceTemplateMutation();

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  // State management for cadences and dialog
  const [cadences, setCadences] = useState<CadenceTemplate[]>([]);
  const [selectedCadence, setSelectedCadence] =
    useState<CadenceTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    fetchCadences();
  }, []);

  const fetchCadences = async () => {
    try {
      const { data, error } = await fetchCadenceTemplatesQuery({
        variables: {
          userId: userId!,
        },
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
      setLoading(false);
    }
  };

  const deleteCadence = async (id: string) => {
    setIsDeleting(true);
    try {
      const { data } = await deleteCadenceTemplateMutation({
        variables: { id },
      });

      if (data?.deleteCadenceTemplate?.userError) {
        toast.error(data.deleteCadenceTemplate.userError.message);
        return;
      }

      toast.success("Cadence deleted successfully!");
      setCadences((prev) => prev.filter((c) => c.id !== id));
      setIsDialogOpen(false);
      setSelectedCadence(null);
    } catch (error) {
      console.error("Error deleting cadence:", error);
      toast.error("Failed to delete cadence. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getTotalDays = (cadenceDays: any) => {
    if (!cadenceDays || typeof cadenceDays !== "object") return 0;
    return Object.keys(cadenceDays).length;
  };

  const formatCadenceDays = (cadenceDays: any) => {
    if (!cadenceDays || typeof cadenceDays !== "object") return [];

    return Object.entries(cadenceDays)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, data]) => {
        const dayData = data as { attempts: number; time_windows: string[] };
        const timeWindows = Array.isArray(dayData.time_windows)
          ? dayData.time_windows.join(", ")
          : dayData.time_windows || "";
        return `Day ${day} → ${dayData.attempts} attempts → ${timeWindows}`;
      });
  };

  const handleViewDetails = (cadence: CadenceTemplate) => {
    setSelectedCadence(cadence);
    setIsDialogOpen(true);
  };

  const handleDeleteCadence = async () => {
    if (!selectedCadence) return;
    setIsDeleting(true);
    await deleteCadence(selectedCadence.id);
  };

  const handleCloneCadence = async (cadence: CadenceTemplate) => {
    setIsCloning(true);
    try {
      // Convert cadence_days from backend format to frontend format
      const cadence_days = Object.entries(cadence.cadence_days)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([day, data]) => {
          const dayData = data as { attempts: number; time_windows: string[] };
          return {
            day: day,
            config: {
              attempts: dayData.attempts,
              time_windows: dayData.time_windows,
            },
          };
        });

      const { data } = await createCadenceTemplateMutation({
        variables: {
          input: {
            name: `${cadence.name}-Copy`,
            userId: userId!,
            retry_dispositions: cadence.retry_dispositions,
            cadence_days,
          },
        },
      });

      if (!data?.createCadenceTemplate?.userError?.message) {
        toast.success("Cadence cloned successfully!");
        // Refresh the cadences list
        fetchCadences();
        // Close the dialog if it's open
        if (isDialogOpen) {
          setIsDialogOpen(false);
          setSelectedCadence(null);
        }
      } else {
        toast.error(
          data?.createCadenceTemplate?.userError?.message ||
            "Failed to clone cadence"
        );
      }
    } catch (error) {
      console.error("Error cloning cadence:", error);
      toast.error("Failed to clone cadence. Please try again.");
    } finally {
      setIsCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cadence Management</h1>
        <Button asChild>
          <Link href="/cadence-creator">Create New Cadence</Link>
        </Button>
      </div>

      {cadences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            No cadences created yet.
          </p>
          <Button asChild>
            <Link href="/cadence-creator">Create Your First Cadence</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cadence Name</TableHead>
                <TableHead>Retry Dispositions</TableHead>
                <TableHead>Total Days Defined</TableHead>
                <TableHead>Campaigns Used In</TableHead>
                <TableHead className="w-56">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cadences.map((cadence) => (
                <TableRow key={cadence.id}>
                  <TableCell className="font-medium">{cadence.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {cadence.retry_dispositions.map((disposition) => (
                        <Badge
                          key={disposition}
                          variant="secondary"
                          className="text-xs"
                        >
                          {disposition}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getTotalDays(cadence.cadence_days)}</TableCell>
                  <TableCell>
                    {cadence.campaigns.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {cadence.campaigns.map((campaign) => (
                          <Badge
                            key={campaign.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {campaign.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(cadence)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCadence?.name}</DialogTitle>
          </DialogHeader>

          {selectedCadence && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Retry Dispositions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCadence.retry_dispositions.map((disposition) => (
                    <Badge key={disposition} variant="secondary">
                      {disposition}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Cadence Days Breakdown</h3>
                <div className="space-y-2">
                  {formatCadenceDays(selectedCadence.cadence_days).map(
                    (dayInfo, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg text-sm"
                      >
                        {dayInfo}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Campaigns Using This Cadence
                </h3>
                {selectedCadence.campaigns.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No campaigns are currently using this cadence.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCadence.campaigns.map((campaign) => (
                      <Badge key={campaign.id} variant="outline">
                        {campaign.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedCadence) {
                      setIsDialogOpen(false);
                      router.push(`/cadence-creator?id=${selectedCadence.id}`);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedCadence) {
                      handleCloneCadence(selectedCadence);
                    }
                  }}
                  disabled={isCloning}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isCloning ? "Cloning..." : "Clone"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCadence}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Cadence"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cadences;

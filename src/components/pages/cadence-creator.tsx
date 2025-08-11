"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCreateCadenceTemplateMutation } from "@/generated/graphql";

interface CadenceDay {
  day: number;
  attempts: number;
  timeWindows: string;
}

const RETRY_DISPOSITION_OPTIONS = [
  "Answering Machine",
  "No Answer",
  "Not Interested",
  "Not Qualified",
  "Language Barrier",
  "Hang Up",
  "Do Not Contact",
  "Callback",
  "Warm Transfer(Education)",
  "Warm Transfer(Job)",
];

export default function CadenceCreator() {
  // GraphQL mutation hook
  const [createCadenceTemplate] = useCreateCadenceTemplateMutation();

  // State variables
  const [cadenceName, setCadenceName] = useState("");
  const [retryDispositions, setRetryDispositions] = useState<string[]>([]);
  const [cadenceDays, setCadenceDays] = useState<CadenceDay[]>([
    { day: 1, attempts: 1, timeWindows: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleDispositionChange = (disposition: string, checked: boolean) => {
    if (checked) {
      setRetryDispositions((prev) => [...prev, disposition]);
    } else {
      setRetryDispositions((prev) => prev.filter((d) => d !== disposition));
    }
  };

  const addCadenceDay = () => {
    const maxDay = Math.max(...cadenceDays.map((d) => d.day), 0);
    setCadenceDays((prev) => [
      ...prev,
      { day: maxDay + 1, attempts: 1, timeWindows: "" },
    ]);
  };

  const removeCadenceDay = (index: number) => {
    setCadenceDays((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCadenceDay = (
    index: number,
    field: keyof CadenceDay,
    value: number | string
  ) => {
    setCadenceDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cadenceName.trim()) {
      toast.error("Please enter a cadence name");
      return;
    }

    if (cadenceDays.length === 0) {
      toast.error("Please add at least one cadence day");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert cadenceDays into required array of { day, config }
      const cadence_days = cadenceDays.map((day) => ({
        day: day.day.toString(),
        config: {
          attempts: day.attempts,
          time_windows: day.timeWindows
            .split(",")
            .map((tw) => tw.trim())
            .filter((tw) => tw.length > 0),
        },
      }));

      const { data } = await createCadenceTemplate({
        variables: {
          input: {
            name: cadenceName,
            retry_dispositions: retryDispositions,
            cadence_days,
          },
        },
      });

      if (!data?.createCadenceTemplate?.userError?.message) {
        toast.success("Cadence created successfully!");
        router.push("/cadences");
      } else {
        toast.error(
          data?.createCadenceTemplate?.userError?.message ||
            "Something went wrong"
        );
      }
    } catch (error: any) {
      console.error("Error creating cadence:", error);
      toast.error("Failed to create cadence. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Dialing Cadence</h1>
        <p className="text-muted-foreground">
          Design a custom cadence template for your campaigns
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Cadence Name */}
          <Card>
            <CardHeader>
              <CardTitle>Cadence Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="cadence-name">Cadence Name</Label>
                <Input
                  id="cadence-name"
                  value={cadenceName}
                  onChange={(e) => setCadenceName(e.target.value)}
                  placeholder="Enter cadence name"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Retry Dispositions */}
          <Card>
            <CardHeader>
              <CardTitle>Retry Dispositions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Only retry leads with these call outcomes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {RETRY_DISPOSITION_OPTIONS.map((disposition) => (
                  <div
                    key={disposition}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={disposition}
                      checked={retryDispositions.includes(disposition)}
                      onCheckedChange={(checked) =>
                        handleDispositionChange(disposition, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={disposition}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {disposition}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cadence Days */}
          <Card>
            <CardHeader>
              <CardTitle>Cadence Days</CardTitle>
              <p className="text-sm text-muted-foreground">
                You don't need to call every day. Just define the days you want.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cadenceDays.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Day Number
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="90"
                        value={day.day}
                        onChange={(e) =>
                          updateCadenceDay(
                            index,
                            "day",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Attempts
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={day.attempts}
                        onChange={(e) =>
                          updateCadenceDay(
                            index,
                            "attempts",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-2">
                      <Label className="text-xs text-muted-foreground">
                        Time Windows
                      </Label>
                      <Input
                        value={day.timeWindows}
                        onChange={(e) =>
                          updateCadenceDay(index, "timeWindows", e.target.value)
                        }
                        placeholder="10:00–12:00, 14:00–16:00"
                        className="mt-1"
                      />
                    </div>
                    {cadenceDays.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCadenceDay(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCadenceDay}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Day
                </Button>

                <p className="text-sm text-muted-foreground">
                  All time windows are in EST
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/campaigns")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Cadence"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

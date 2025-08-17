"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateCadenceTemplateMutation,
  useUpdateCadenceTemplateMutation,
  useCadenceTemplatesLazyQuery,
} from "@/generated/graphql";
import { cn } from "@/lib/utils";

interface CadenceDay {
  day: number;
  attempts: number;
  timeWindows: string;
}

interface CadenceTemplate {
  id: string;
  name: string;
  retry_dispositions: string[];
  cadence_days: any[];
}

// Smart Time Window Input Component
interface TimeWindowInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TimeWindowInput = ({
  value,
  onChange,
  placeholder,
  className,
}: TimeWindowInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [rawDigits, setRawDigits] = useState("");

  const formatTimeWindows = (digits: string): string => {
    if (digits.length === 0) return "";

    let result = "";
    let position = 0;

    while (position < digits.length) {
      // Start new time window
      if (result && !result.endsWith(", ")) {
        result += ", ";
      }

      // First hour (HH)
      if (position < digits.length) {
        let hour = parseInt(digits[position]);
        if (hour > 2) hour = 0;
        result += hour.toString();
        position++;
      }

      // Second digit of hour
      if (position < digits.length) {
        let hour = parseInt(digits.substring(position - 1, position + 1));
        if (hour > 23) hour = 0;
        result =
          result.substring(0, result.length - 1) +
          hour.toString().padStart(2, "0");
        position++;
      }

      // Add colon after hours
      if (position < digits.length) {
        result += ":";
      }

      // First digit of minutes
      if (position < digits.length) {
        let minute = parseInt(digits[position]);
        if (minute > 5) minute = 0;
        result += minute.toString();
        position++;
      }

      // Second digit of minutes
      if (position < digits.length) {
        let minute = parseInt(digits.substring(position - 1, position + 1));
        if (minute > 59) minute = 0;
        result =
          result.substring(0, result.length - 1) +
          minute.toString().padStart(2, "0");
        position++;
      }

      // Add dash for time range
      if (position < digits.length) {
        result += "-";
      }

      // Second hour (HH)
      if (position < digits.length) {
        let hour = parseInt(digits[position]);
        if (hour > 2) hour = 0;
        result += hour.toString();
        position++;
      }

      // Second digit of second hour
      if (position < digits.length) {
        let hour = parseInt(digits.substring(position - 1, position + 1));
        if (hour > 23) hour = 0;
        result =
          result.substring(0, result.length - 1) +
          hour.toString().padStart(2, "0");
        position++;
      }

      // Add colon after second hours
      if (position < digits.length) {
        result += ":";
      }

      // First digit of second minutes
      if (position < digits.length) {
        let minute = parseInt(digits[position]);
        if (minute > 5) minute = 0;
        result += minute.toString();
        position++;
      }

      // Second digit of second minutes
      if (position < digits.length) {
        let minute = parseInt(digits.substring(position - 1, position + 1));
        if (minute > 59) minute = 0;
        result =
          result.substring(0, result.length - 1) +
          minute.toString().padStart(2, "0");
        position++;
      }
    }

    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.currentTarget.selectionStart || 0;

    // Always extract digits for placeholder logic
    const digits = newValue.replace(/\D/g, "");
    setRawDigits(digits);

    // If user is deleting or editing, don't reformat immediately
    if (newValue.length < inputValue.length) {
      // User is deleting - allow free editing
      setInputValue(newValue);
      onChange(newValue);
      return;
    }

    // Only auto-format when adding new digits
    if (digits.length > rawDigits.length) {
      const formatted = formatTimeWindows(digits);
      setInputValue(formatted);
      onChange(formatted);
    } else {
      // Just update the value without reformatting
      setInputValue(newValue);
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const currentValue = isFocused ? inputValue : value;
  const showPlaceholder = !currentValue || currentValue.trim() === "";

  // Calculate how many characters from the placeholder should be consumed based on raw digits
  const getRemainingPlaceholder = () => {
    if (!placeholder || !rawDigits) return placeholder;

    // Create a mapping of how many placeholder characters each digit should consume
    // For "00:00–00:00, 00:00–00:00" and input like "12:00-1"
    let consumedChars = 0;
    let digitCount = 0;

    // Map each digit to its corresponding position in the placeholder
    const digitPositions = [];
    for (let i = 0; i < placeholder.length; i++) {
      if (/\d/.test(placeholder[i])) {
        digitPositions.push(i);
      }
    }

    // Calculate how many placeholder characters to consume
    if (rawDigits.length <= digitPositions.length) {
      consumedChars = digitPositions[rawDigits.length - 1] + 1;
    }

    // Get the remaining part and clean it up
    const remaining = placeholder.substring(consumedChars);
    // Only remove multiple consecutive spaces, preserve single intentional spaces
    return remaining.replace(/\s{2,}/g, " ").trim();
  };

  return (
    <div className="relative">
      {/* Background placeholder text */}
      {placeholder && (
        <div className="absolute inset-0 flex items-center px-3 text-muted-foreground pointer-events-none z-0 overflow-hidden">
          {currentValue ? (
            // Show placeholder with typed text overlaid
            <span className="whitespace-nowrap overflow-hidden text-base md:text-sm font-normal">
              <span
                style={{
                  color: "transparent",
                  lineHeight: "1.5",
                  verticalAlign: "top",
                }}
              >
                {currentValue}
              </span>
              <span style={{ lineHeight: "1.5" }}>
                {getRemainingPlaceholder()}
              </span>
            </span>
          ) : (
            // Show full placeholder when empty
            <span
              className="whitespace-nowrap overflow-hidden text-base md:text-sm font-normal"
              style={{ lineHeight: "1.5" }}
            >
              {placeholder}
            </span>
          )}
        </div>
      )}

      {/* Input field positioned over the placeholder */}
      <Input
        value={currentValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(className, "relative z-10 bg-transparent")}
        style={{ color: "inherit" }}
      />
    </div>
  );
};

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
  const [updateCadenceTemplate] = useUpdateCadenceTemplateMutation();
  const [fetchCadenceTemplate] = useCadenceTemplatesLazyQuery();

  // State variables
  const [cadenceName, setCadenceName] = useState("");
  const [retryDispositions, setRetryDispositions] = useState<string[]>([]);
  const [cadenceDays, setCadenceDays] = useState<CadenceDay[]>([
    { day: 1, attempts: 1, timeWindows: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setIsEditing(true);
      setTemplateId(id);
      loadCadenceTemplate(id);
    }
  }, [searchParams]);

  const loadCadenceTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const { data } = await fetchCadenceTemplate({
        variables: {},
        fetchPolicy: "network-only",
      });

      if (data?.cadenceTemplates?.templates) {
        const template = data.cadenceTemplates.templates.find(
          (t) => t.id === id
        );
        if (template) {
          setCadenceName(template.name);
          setRetryDispositions(template.retry_dispositions || []);

          // Convert cadence_days from backend format to frontend format
          if (
            template.cadence_days &&
            typeof template.cadence_days === "object"
          ) {
            // Handle the Record<string, { attempts: number; time_windows: string[] }> format
            const convertedDays = Object.entries(template.cadence_days)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([day, data]) => {
                const dayData = data as {
                  attempts: number;
                  time_windows: string[];
                };
                return {
                  day: parseInt(day) || 1,
                  attempts: dayData.attempts || 1,
                  timeWindows: Array.isArray(dayData.time_windows)
                    ? dayData.time_windows.join(", ")
                    : "",
                };
              });
            setCadenceDays(convertedDays);
          }
        }
      }
    } catch (error) {
      console.error("Error loading cadence template:", error);
      toast.error("Failed to load cadence template");
    } finally {
      setIsLoading(false);
    }
  };

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

    let hasError = false;
    if (!cadenceName.trim()) {
      toast.error("Cadence name is required");
      hasError = true;
    }

    if (retryDispositions.length === 0) {
      toast.error("Please select at least one retry disposition");
      hasError = true;
    }

    if (cadenceDays.length === 0) {
      toast.error("Please add at least one cadence day");
      hasError = true;
    }

    // Check if any time windows are empty
    const hasEmptyTimeWindows = cadenceDays.some(
      (day) => !day.timeWindows.trim()
    );
    if (hasEmptyTimeWindows) {
      toast.error("Please fill in time windows for all cadence days");
      hasError = true;
    }

    // Check if any day numbers or attempts are missing
    const hasInvalidDays = cadenceDays.some((day) => !day.day || !day.attempts);
    if (hasInvalidDays) {
      toast.error(
        "Please fill in day number and attempts for all cadence days"
      );
      hasError = true;
    }

    // Validate time window format for each day
    const hasInvalidTimeWindows = cadenceDays.some((day) => {
      if (!day.timeWindows.trim()) return false;

      const timeWindows = day.timeWindows
        .split(",")
        .map((tw) => tw.trim())
        .filter((tw) => tw.length > 0);

      return timeWindows.some((timeWindow) => {
        // Check if time window follows HH:MM-HH:MM format
        const timePattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
        if (!timePattern.test(timeWindow)) return true;

        // Check if time difference is at least 30 minutes
        const [startTime, endTime] = timeWindow.split("-");
        const startMinutes =
          parseInt(startTime.split(":")[0]) * 60 +
          parseInt(startTime.split(":")[1]);
        const endMinutes =
          parseInt(endTime.split(":")[0]) * 60 +
          parseInt(endTime.split(":")[1]);

        // Handle case where end time is on the next day
        const timeDifference =
          endMinutes >= startMinutes
            ? endMinutes - startMinutes
            : 24 * 60 - startMinutes + endMinutes;

        if (timeDifference < 30) {
          return true;
        }

        return false;
      });
    });

    if (hasInvalidTimeWindows) {
      toast.error(
        "Each time window must be at least 30 minutes long and in proper format (HH:MM-HH:MM). Complete all time windows before saving."
      );
      hasError = true;
    }

    if (hasError) {
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

      if (isEditing) {
        const { data } = await updateCadenceTemplate({
          variables: {
            input: {
              id: templateId!,
              name: cadenceName,
              retry_dispositions: retryDispositions,
              cadence_days,
            },
          },
        });

        if (!data?.updateCadenceTemplate?.userError?.message) {
          toast.success("Cadence updated successfully!");
          router.push("/cadences");
        } else {
          toast.error(
            data?.updateCadenceTemplate?.userError?.message ||
              "Something went wrong"
          );
        }
      } else {
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
        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? "Edit Dialing Cadence" : "Create Dialing Cadence"}
        </h1>
        <p className="text-muted-foreground">
          Design a custom cadence template for your campaigns
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">Loading cadence template...</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Cadence Name */}
          <Card>
            <CardHeader>
              <CardTitle>Cadence Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="cadence-name">
                  Cadence Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cadence-name"
                  value={cadenceName}
                  onChange={(e) => setCadenceName(e.target.value)}
                  placeholder="Enter cadence name"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Retry Dispositions */}
          <Card>
            <CardHeader>
              <CardTitle>
                Retry Dispositions <span className="text-red-500">*</span>
              </CardTitle>
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
                      disabled={isLoading}
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
                        Day Number <span className="text-red-500">*</span>
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
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Attempts <span className="text-red-500">*</span>
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
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex-2">
                      <Label className="text-xs text-muted-foreground">
                        Time Windows <span className="text-red-500">*</span>
                      </Label>
                      <TimeWindowInput
                        value={day.timeWindows}
                        onChange={(value) =>
                          updateCadenceDay(index, "timeWindows", value)
                        }
                        placeholder="00:00-00:00, 00:00-00:00"
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
              onClick={() => router.push("/cadences")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Cadence"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

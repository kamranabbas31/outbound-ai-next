"use client";
import { useState, useEffect, useRef } from "react";
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
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface CadenceDay {
  day: number;
  attempts: number;
  timeWindows: {
    from: string;
    to: string;
  }[];
}

interface CadenceTemplate {
  id: string;
  name: string;
  retry_dispositions: string[];
  cadence_days: any[];
}

// Time Input Component
interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label: string;
}

const TimeInput = ({
  value,
  onChange,
  placeholder,
  className,
  label,
}: TimeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse the current value when component mounts or value changes
  useEffect(() => {
    if (value && value.trim() !== "") {
      // Check if the value already contains AM/PM (from database)
      if (value.includes("AM") || value.includes("PM")) {
        // Extract time and period from "HH:MM AM/PM" format
        const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          const [, hour, minute, period] = timeMatch;
          setSelectedHour(hour.padStart(2, "0"));
          setSelectedMinute(minute);
          setSelectedPeriod(period.toUpperCase());
        }
      } else {
        // Handle 24-hour format "HH:MM" (fallback)
        const [hour, minute] = value.split(":");
        if (hour && minute) {
          const hourNum = parseInt(hour);
          let displayHour = hourNum;
          let period = "AM";

          if (hourNum === 0) {
            displayHour = 12;
            period = "AM";
          } else if (hourNum > 12) {
            displayHour = hourNum - 12;
            period = "PM";
          } else if (hourNum === 12) {
            period = "PM";
          }

          setSelectedHour(displayHour.toString().padStart(2, "0"));
          setSelectedMinute(minute);
          setSelectedPeriod(period);
        }
      }
    } else {
      // Reset to default values if no value
      setSelectedHour("12");
      setSelectedMinute("00");
      setSelectedPeriod("AM");
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return "bottom";

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 280; // Approximate height of the dropdown

    // Check if there's enough space below
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // If there's more space above than below, or not enough space below, open upward
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return "top";
    }

    return "bottom";
  };

  const handleInputClick = () => {
    const position = calculateDropdownPosition();
    setDropdownPosition(position);
    setIsOpen(!isOpen);
  };

  const handleTimeChange = (hour: string, minute: string, period: string) => {
    // Store in 12-hour format with AM/PM
    const timeString = `${hour}:${minute} ${period}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  // 15-minute intervals: 00, 15, 30, 45
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  // Format display value
  const getDisplayValue = () => {
    if (!value || value.trim() === "") return "--:-- --";

    // If the value already contains AM/PM (from database), return as is
    if (value.includes("AM") || value.includes("PM")) {
      return value;
    }

    // Handle 24-hour format "HH:MM" (fallback)
    const [hour, minute] = value.split(":");
    if (hour && minute) {
      const hourNum = parseInt(hour);
      let displayHour = hourNum;
      let period = "AM";

      if (hourNum === 0) {
        displayHour = 12;
        period = "AM";
      } else if (hourNum > 12) {
        displayHour = hourNum - 12;
        period = "PM";
      } else if (hourNum === 12) {
        period = "PM";
      }

      return `${displayHour.toString().padStart(2, "0")}:${minute} ${period}`;
    }

    return value;
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative" ref={dropdownRef}>
        <Input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onClick={handleInputClick}
          readOnly
          className={cn(className, "cursor-pointer")}
          required
        />

        {isOpen && (
          <div
            className={cn(
              "absolute left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[280px]",
              dropdownPosition === "bottom"
                ? "top-full mt-1"
                : "bottom-full mb-1"
            )}
          >
            {/* Selected Time Display */}
            <div className="flex gap-2 mb-3 pb-3 border-b">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium cursor-pointer">
                {selectedHour}
              </div>
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium cursor-pointer">
                {selectedMinute}
              </div>
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium cursor-pointer">
                {selectedPeriod}
              </div>
            </div>

            <div className="flex gap-4">
              {/* Hours */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Hour
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => setSelectedHour(hour)}
                      className={cn(
                        "px-3 py-1 text-sm cursor-pointer rounded",
                        selectedHour === hour
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-black hover:bg-primary/10"
                      )}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              </div>

              {/* Minutes - 15-minute intervals */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Minute
                </div>
                <div className="space-y-1">
                  {minutes.map((minute) => (
                    <div
                      key={minute}
                      onClick={() => setSelectedMinute(minute)}
                      className={cn(
                        "px-3 py-1 text-sm cursor-pointer rounded",
                        selectedMinute === minute
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-black hover:bg-primary/10"
                      )}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              </div>

              {/* AM/PM */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Period
                </div>
                <div className="space-y-1">
                  {periods.map((period) => (
                    <div
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={cn(
                        "px-3 py-1 text-sm cursor-pointer rounded",
                        selectedPeriod === period
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-black hover:bg-primary/10"
                      )}
                    >
                      {period}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleTimeChange(selectedHour, selectedMinute, selectedPeriod)
                }
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
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
    { day: 1, attempts: 1, timeWindows: [{ from: "", to: "" }] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = useSelector((state: RootState) => state.auth.user?.id);

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
        variables: {
          userId: userId!,
        },
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
                    ? dayData.time_windows.map((tw) => ({
                        from: tw.split("-")[0],
                        to: tw.split("-")[1],
                      }))
                    : [],
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
      { day: maxDay + 1, attempts: 1, timeWindows: [{ from: "", to: "" }] },
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

  const addTimeWindow = (dayIndex: number) => {
    setCadenceDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, timeWindows: [...day.timeWindows, { from: "", to: "" }] }
          : day
      )
    );
  };

  const removeTimeWindow = (dayIndex: number, timeWindowIndex: number) => {
    setCadenceDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              timeWindows: day.timeWindows.filter(
                (_, twi) => twi !== timeWindowIndex
              ),
            }
          : day
      )
    );
  };

  const updateTimeWindow = (
    dayIndex: number,
    timeWindowIndex: number,
    field: "from" | "to",
    value: string
  ) => {
    setCadenceDays((prev) => {
      const newState = prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              timeWindows: day.timeWindows.map((tw, twi) =>
                twi === timeWindowIndex ? { ...tw, [field]: value } : tw
              ),
            }
          : day
      );
      return newState;
    });
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
      (day) =>
        day.timeWindows.length === 0 ||
        day.timeWindows.some((tw) => !tw.from || !tw.to)
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

    // Validate time windows for each day
    const hasInvalidTimeWindows = cadenceDays.some((day) => {
      return day.timeWindows.some((timeWindow) => {
        if (!timeWindow.from || !timeWindow.to) return true;

        // Convert 12-hour format with AM/PM to minutes for comparison
        const convertToMinutes = (timeStr: string) => {
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            const [, hour, minute, period] = timeMatch;
            let hourNum = parseInt(hour);

            if (period.toUpperCase() === "PM" && hourNum !== 12) {
              hourNum += 12;
            } else if (period.toUpperCase() === "AM" && hourNum === 12) {
              hourNum = 0;
            }

            return hourNum * 60 + parseInt(minute);
          }
          return 0; // Return 0 if no valid time found
        };

        const startMinutes = convertToMinutes(timeWindow.from);
        const endMinutes = convertToMinutes(timeWindow.to);

        // Handle case where end time is on the next day
        const timeDifference =
          endMinutes >= startMinutes
            ? endMinutes - startMinutes
            : 24 * 60 - startMinutes + endMinutes;

        // Check if time difference is at least 30 minutes
        if (timeDifference < 30) {
          return true;
        }

        return false;
      });
    });

    if (hasInvalidTimeWindows) {
      toast.error(
        "Each time window must be at least 30 minutes long. Complete all time windows before saving."
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
          time_windows: day.timeWindows.map((tw) => `${tw.from}-${tw.to}`),
        },
      }));

      if (isEditing) {
        const { data } = await updateCadenceTemplate({
          variables: {
            input: {
              id: templateId!,
              userId: userId!,
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
              userId: userId!,
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
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800">Loading cadence template...</p>
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
                {cadenceDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center gap-4">
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
                              dayIndex,
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
                              dayIndex,
                              "attempts",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="mt-1"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {cadenceDays.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCadenceDay(dayIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Time Windows */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Time Windows <span className="text-red-500">*</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            All times are in EST
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeWindow(dayIndex)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Time Window
                        </Button>
                      </div>

                      {day.timeWindows.map((timeWindow, timeWindowIndex) => (
                        <div
                          key={timeWindowIndex}
                          className="flex items-center gap-3 p-3 border rounded-md bg-gray-50"
                        >
                          <TimeInput
                            value={timeWindow.from}
                            onChange={(value) =>
                              updateTimeWindow(
                                dayIndex,
                                timeWindowIndex,
                                "from",
                                value
                              )
                            }
                            label="From"
                            className="flex-1"
                          />
                          <TimeInput
                            value={timeWindow.to}
                            onChange={(value) =>
                              updateTimeWindow(
                                dayIndex,
                                timeWindowIndex,
                                "to",
                                value
                              )
                            }
                            label="To"
                            className="flex-1"
                          />
                          {day.timeWindows.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeTimeWindow(dayIndex, timeWindowIndex)
                              }
                              className="text-destructive hover:text-destructive mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
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
                  All times are in EST
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

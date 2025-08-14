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

// Smart Time Window Input Component
interface TimeWindowInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TimeWindowInput = ({ value, onChange, placeholder, className }: TimeWindowInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const formatTimeWindows = (digits: string): string => {
    if (digits.length === 0) return '';
    
    let result = '';
    let position = 0;
    
    while (position < digits.length) {
      // Start new time window
      if (result && !result.endsWith(', ')) {
        result += ', ';
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
        result = result.substring(0, result.length - 1) + hour.toString().padStart(2, '0');
        position++;
      }
      
      // Add colon after hours
      if (position < digits.length) {
        result += ':';
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
        result = result.substring(0, result.length - 1) + minute.toString().padStart(2, '0');
        position++;
      }
      
      // Add dash for time range
      if (position < digits.length) {
        result += '-';
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
        result = result.substring(0, result.length - 1) + hour.toString().padStart(2, '0');
        position++;
      }
      
      // Add colon after second hours
      if (position < digits.length) {
        result += ':';
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
        result = result.substring(0, result.length - 1) + minute.toString().padStart(2, '0');
        position++;
      }
    }
    
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Extract only digits
    const digits = newValue.replace(/\D/g, '');
    
    // Format into time windows
    const formatted = formatTimeWindows(digits);
    
    setInputValue(formatted);
    onChange(formatted);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div>
      <Input
        value={isFocused ? inputValue : value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
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
    const hasEmptyTimeWindows = cadenceDays.some(day => !day.timeWindows.trim());
    if (hasEmptyTimeWindows) {
      toast.error("Please fill in time windows for all cadence days");
      hasError = true;
    }

    // Check if any day numbers or attempts are missing
    const hasInvalidDays = cadenceDays.some(day => !day.day || !day.attempts);
    if (hasInvalidDays) {
      toast.error("Please fill in day number and attempts for all cadence days");
      hasError = true;
    }

    // Validate time window format for each day
    const hasInvalidTimeWindows = cadenceDays.some(day => {
      if (!day.timeWindows.trim()) return false;
      
      const timeWindows = day.timeWindows.split(',').map(tw => tw.trim()).filter(tw => tw.length > 0);
      
      return timeWindows.some(timeWindow => {
        // Check if time window follows HH:MM-HH:MM format
        const timePattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
        return !timePattern.test(timeWindow);
      });
    });

    if (hasInvalidTimeWindows) {
      toast.error("Each time window must be in proper format (HH:MM-HH:MM). Complete all time windows before saving.");
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
              <CardTitle>Retry Dispositions <span className="text-red-500">*</span></CardTitle>
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
                      />
                    </div>
                    <div className="flex-2">
                      <Label className="text-xs text-muted-foreground">
                        Time Windows <span className="text-red-500">*</span>
                      </Label>
                      <TimeWindowInput
                        value={day.timeWindows}
                        onChange={(value) => updateCadenceDay(index, "timeWindows", value)}
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

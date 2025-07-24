
import { WebhookPayload } from './types.ts';

// Determine call status based on payload
export function determineCallStatus(payload: WebhookPayload): string {
  if (payload.success === false || (payload.message && payload.message.success === false)) {
    return "Failed";
  }
  
  // Look for specific status indicators
  if (payload.status && typeof payload.status === 'string') {
    if (payload.status.toLowerCase().includes('fail')) {
      return "Failed";
    }
  }
  
  return "Completed";
}

// Helper function to calculate call cost
export function calculateCallCost(durationMinutes: number): number {
  // $0.99 per minute
  const minuteRate = 0.99;
  return durationMinutes * minuteRate;
}

// Define CORS headers for browser requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create success response
export function createSuccessResponse(message: string = "Webhook processed successfully") {
  return new Response(
    JSON.stringify({ success: true, message }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Create error response
export function createErrorResponse(message: string, error?: string) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message,
      error 
    }),
    { 
      status: 200, // Still return 200 so Vapi doesn't retry
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

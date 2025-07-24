
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  extractContactId, 
  extractPhoneNumber, 
  extractCustomerName, 
  extractRecordingUrl, 
  extractDuration, 
  extractDisposition 
} from './extractors.ts';
import { 
  findLeadByPhoneNumber, 
  findLeadByNameAndPhone, 
  updateLead, 
  createClient 
} from './database.ts';
import { 
  determineCallStatus, 
  calculateCallCost, 
  corsHeaders, 
  createSuccessResponse, 
  createErrorResponse 
} from './utils.ts';
import { WebhookPayload, LeadUpdateData } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw request body as text first to avoid truncation issues
    const rawBody = await req.text();
    console.log("Received raw webhook body length:", rawBody.length);

    // Parse the webhook payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
      console.log("Successfully parsed JSON payload");
    } catch (e) {
      console.error("Error parsing JSON:", e);
      console.log("Raw payload first 1000 chars:", rawBody.substring(0, 1000));
      return createErrorResponse("Invalid JSON payload");
    }
    
    // Log important parts of the payload without truncating
    console.log("Payload keys at root level:", Object.keys(payload));
    if (payload.message) {
      console.log("Message keys:", Object.keys(payload.message));
      if (payload.message.artifact) {
        console.log("Artifact keys:", Object.keys(payload.message.artifact));
      }
    }
    
    // Get the Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Extract critical information
    let contactId = extractContactId(payload);
    let phoneNumber = extractPhoneNumber(payload);
    const disposition = extractDisposition(payload);
    const duration = extractDuration(payload);
    const status = determineCallStatus(payload);
    const recordingUrl = extractRecordingUrl(payload);
    
    console.log("Extracted contactId:", contactId);
    console.log("Extracted phone number:", phoneNumber);
    console.log("Final extracted disposition:", disposition);
    console.log("Extracted duration in seconds:", duration);
    console.log("Extracted recording URL:", recordingUrl);
    
    const durationMinutes = duration / 60;
    const cost = calculateCallCost(durationMinutes);
    console.log(`Calculated cost: $${cost.toFixed(2)} for ${durationMinutes.toFixed(1)} minutes`);
    console.log("Call status determined as:", status);
    
    // If no contactId but we have a phone number, look up the lead
    if (!contactId && phoneNumber) {
      console.log(`No contactId found, trying to find lead by phone number: ${phoneNumber}`);
      
      const leadResult = await findLeadByPhoneNumber(supabaseAdmin, phoneNumber);
      if (leadResult) {
        contactId = leadResult.id;
        console.log(`Found lead with phone ${phoneNumber}, id: ${contactId}`);
      } else {
        // Try to extract customer name as fallback
        const customerName = extractCustomerName(payload);
        if (customerName && phoneNumber) {
          console.log(`Trying to find lead with name: ${customerName} and phone pattern`);
          const leadByNameResult = await findLeadByNameAndPhone(supabaseAdmin, customerName, phoneNumber);
          if (leadByNameResult) {
            contactId = leadByNameResult.id;
            console.log(`Found lead with name ${customerName}, id: ${contactId}`);
          }
        }
      }
    }
    
    if (!contactId && !phoneNumber) {
      console.error("No contactId or phone number could be extracted from webhook payload");
      return createErrorResponse("Failed to find contact information in webhook");
    }
    
    // Update the lead in the database if we have a contactId
    if (contactId) {
      const updateData: LeadUpdateData = {
        status,
        disposition,
        duration: durationMinutes, // Store as minutes
        cost
      };
      
      // Only add recording_url if we have one
      if (recordingUrl) {
        updateData.recording_url = recordingUrl;
      }
      
      try {
        await updateLead(supabaseAdmin, contactId, updateData);
      } catch (error) {
        console.error("Error updating lead:", error);
        return createErrorResponse("Failed to update lead", error.message);
      }
    } else {
      console.warn("Webhook received without contactId and couldn't find matching lead");
    }
    
    // Always return a success to Vapi
    return createSuccessResponse();
  } catch (error) {
    console.error("Error processing webhook:", error);
    return createErrorResponse("Failed to process webhook", error.message);
  }
});

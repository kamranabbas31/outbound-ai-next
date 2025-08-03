// import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";

// /**

// /**
//  * Creates a new empty campaign
//  */
// export const createEmptyCampaign = async (
//   campaignName: string,
//   userId: string
// ) => {
//   try {
//     if (!campaignName.trim()) {
//       toast.error("Campaign name is required");
//       return null;
//     }

//     // Insert new empty campaign
//     const { data: campaign, error: campaignError } = await supabase
//       .from("campaigns")
//       .insert({
//         name: campaignName,
//         file_name: null,
//         status: "pending",
//         leads_count: 0,
//         completed: 0,
//         in_progress: 0,
//         remaining: 0,
//         failed: 0,
//         duration: 0,
//         cost: 0,
//         user_id: userId,
//       })
//       .select()
//       .single();

//     if (campaignError) {
//       console.error("Error creating empty campaign:", campaignError);
//       throw new Error("Failed to create empty campaign");
//     }

//     return campaign;
//   } catch (err) {
//     console.error("Error in createEmptyCampaign:", err);
//     toast.error("Failed to create empty campaign");
//     return null;
//   }
// };

// /**
//  * Adds leads to a specific campaign
//  */
// export const addLeadsToCampaign = async (campaignId: string, leads: any[]) => {
//   try {
//     if (!leads || leads.length === 0) {
//       toast.error("No leads to add to campaign");
//       return false;
//     }

//     // Step 1: Insert leads and get inserted rows
//     const { data: insertedLeads, error: leadsError } = await supabase
//       .from("leads")
//       .insert(leads)
//       .select();

//     if (leadsError || !insertedLeads) {
//       console.error("Error inserting leads:", leadsError);
//       throw new Error("Failed to insert leads");
//     }

//     // Step 2: Prepare link table entries
//     const campaignLeads = insertedLeads.map((lead) => ({
//       campaign_id: campaignId,
//       lead_id: lead.id,
//     }));

//     const { error: linkError } = await supabase
//       .from("campaign_leads")
//       .insert(campaignLeads);

//     if (linkError) {
//       console.error("Error linking leads to campaign:", linkError);
//       toast.error("Leads added but some could not be linked to the campaign");
//       return false;
//     }

//     // Step 3: Get existing campaign counts
//     const { data: existingCampaign, error: fetchError } = await supabase
//       .from("campaigns")
//       .select("leads_count, remaining")
//       .eq("id", campaignId)
//       .single();

//     if (fetchError || !existingCampaign) {
//       console.error("Error fetching campaign data:", fetchError);
//       toast.error("Leads linked, but campaign stats couldn't be fetched");
//       return false;
//     }

//     // Step 4: Increment counts
//     const newLeadsCount =
//       (existingCampaign.leads_count || 0) + insertedLeads.length;
//     const newRemaining =
//       (existingCampaign.remaining || 0) + insertedLeads.length;
//     const { data: updatedCampaign, error: updateError } = await supabase
//       .from("campaigns")
//       .update({
//         leads_count: newLeadsCount,
//         remaining: newRemaining,
//       })
//       .eq("id", campaignId)
//       .select()
//       .single();

//     if (updateError) {
//       console.error("Error updating campaign stats:", updateError);
//       toast.error("Leads linked, but campaign stats couldn't be updated");
//       return false;
//     }

//     return updatedCampaign;
//   } catch (err) {
//     console.error("Error in addLeadsToCampaign:", err);
//     toast.error("Failed to add leads to campaign");
//     return false;
//   }
// };

// /**
//  * Fetches all campaigns
//  */
// export const fetchCampaigns = async (userId: string) => {
//   try {
//     const { data, error } = await supabase
//       .from("campaigns")
//       .select("*")
//       .eq("user_id", userId)
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching campaigns:", error);
//       throw new Error("Failed to fetch campaigns");
//     }

//     return data || [];
//   } catch (err) {
//     console.error("Error in fetchCampaigns:", err);
//     toast.error("Failed to fetch campaigns");
//     return [];
//   }
// };

// /**
//  * Resets the leads table by deleting all leads
//  */
// export const resetLeads = async () => {
//   try {
//     // Delete all leads
//     const { error } = await supabase
//       .from("leads")
//       .delete()
//       .neq("id", "00000000-0000-0000-0000-000000000000"); // This condition ensures all rows are deleted

//     if (error) {
//       console.error("Error resetting leads:", error);
//       throw new Error("Failed to reset leads");
//     }

//     return true;
//   } catch (err) {
//     console.error("Error in resetLeads:", err);
//     toast.error("Failed to reset leads table");
//     return false;
//   }
// };

// // Add a new function to fetch a specific campaign's details
// export const fetchCampaignById = async (campaignId: string) => {
//   try {
//     const { data, error } = await supabase
//       .from("campaigns")
//       .select("*")
//       .eq("id", campaignId)
//       .single();

//     if (error) {
//       console.error("Error fetching campaign:", error);
//       toast.error(`Failed to fetch campaign: ${error.message}`);
//       throw error;
//     }

//     return data;
//   } catch (err) {
//     console.error("Error in fetchCampaignById:", err);
//     throw err;
//   }
// };

// // Add a new function to fetch leads for a specific campaign
// export const fetchCampaignLeads = async (campaignId: string) => {
//   try {
//     const { data, error } = await supabase
//       .from("campaign_leads")
//       .select("*")
//       .eq("campaign_id", campaignId)
//       .order("created_at", { ascending: false })
//       .order("id", { ascending: false });

//     if (error) {
//       console.error("Error fetching campaign leads:", error);
//       toast.error(`Failed to fetch campaign leads: ${error.message}`);
//       throw error;
//     }

//     return data || [];
//   } catch (err) {
//     console.error("Error in fetchCampaignLeads:", err);
//     throw err;
//   }
// };

// // Add a new function to fetch all leads for a specific campaign
// export const fetchLeadsForCampaign = async (
//   campaignId: string,
//   startIndex: number = 0,
//   endIndex: number = 10000,
//   searchTerm?: string
// ) => {
//   try {
//     // Step 1: Fetch linked lead IDs from campaign_leads table
//     const { data: campaignLeads, error: linkError } = await supabase
//       .from("campaign_leads")
//       .select("lead_id")
//       .eq("campaign_id", campaignId)
//       .order("created_at", { ascending: false }) // primary sort: latest first
//       .order("id", { ascending: false })
//       .range(startIndex, endIndex);

//     if (linkError) {
//       console.error("Error fetching campaign lead links:", linkError);
//       toast.error("Failed to fetch campaign lead links");
//       throw new Error("Failed to fetch campaign lead links");
//     }

//     if (!campaignLeads || campaignLeads.length === 0) {
//       console.warn("No leads linked to this campaign");
//       return [];
//     }

//     // Step 2: Extract lead IDs
//     const leadIds = campaignLeads.map((cl) => cl.lead_id);

//     // Step 3: Batch fetch leads in chunks
//     const CHUNK_SIZE = 100;
//     const allLeads: any[] = [];

//     for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
//       const chunk = leadIds.slice(i, i + CHUNK_SIZE);

//       let query = supabase
//         .from("leads")
//         .select("*")
//         .in("id", chunk)
//         .order("created_at", { ascending: false })
//         .order("id", { ascending: false });

//       // Add search filtering if searchTerm is provided
//       if (searchTerm) {
//         query = query.or(
//           `name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%,disposition.ilike.%${searchTerm}%`
//         );
//       }

//       const { data, error } = await query;

//       if (error) {
//         console.error(
//           `Error fetching leads for chunk [${i} - ${i + CHUNK_SIZE}]:`,
//           error
//         );
//         toast.error("Failed to fetch some leads for campaign");
//         throw new Error("Failed to fetch leads for campaign");
//       }

//       allLeads.push(...(data ?? []));
//     }

//     return allLeads;
//   } catch (err) {
//     console.error("Error in fetchLeadsForCampaign:", err);
//     toast.error("Failed to fetch leads for campaign");
//     return [];
//   }
// };

// // Add a function to update campaign statistics (keeping for legacy support)
// export const updateCampaignStats = async (campaignId: string) => {
//   try {
//     // This function is now mainly for legacy support
//     // Campaign stats are automatically updated via database triggers

//     return { success: true, message: "Campaign stats updated via triggers" };
//   } catch (err) {
//     console.error("Error in updateCampaignStats:", err);
//     return null;
//   }
// };

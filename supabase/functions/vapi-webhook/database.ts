import { LeadUpdateData } from "./types.ts";

// Helper function to find a lead by phone number
export async function findLeadByPhoneNumber(
  supabase: any,
  phoneNumber: string
) {
  // Try exact match first
  const { data, error } = await supabase
    .from("leads")
    .select("id, phone_number")
    .eq("phone_number", phoneNumber)
    .limit(1);

  if (!error && data && data.length > 0) {
    return data[0];
  }

  // If no exact match, try cleaning and normalizing the phone number
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const lastTenDigits = cleanedPhoneNumber.slice(-10);

  console.log(
    `No exact match found, trying with cleaned number: ${cleanedPhoneNumber} and last 10 digits: ${lastTenDigits}`
  );

  // Try searching with LIKE on the last 10 digits
  const { data: data2, error: error2 } = await supabase
    .from("leads")
    .select("id, phone_number")
    .ilike("phone_number", `%${lastTenDigits}%`)
    .limit(1);

  if (!error2 && data2 && data2.length > 0) {
    console.log(
      `Found lead with pattern matching on last 10 digits: ${lastTenDigits}`
    );
    return data2[0];
  }

  // As a last resort, try each lead and compare the cleaned numbers
  console.log("Trying more advanced phone number matching...");
  const { data: allLeads, error: leadsError } = await supabase
    .from("leads")
    .select("id, phone_number")
    .limit(25);

  if (!leadsError && allLeads) {
    for (const lead of allLeads) {
      if (!lead.phone_number) continue;

      const leadCleanNumber = lead.phone_number.replace(/\D/g, "");
      const leadLastDigits = leadCleanNumber.slice(-10);

      if (
        leadCleanNumber === cleanedPhoneNumber ||
        leadLastDigits === lastTenDigits ||
        leadCleanNumber.endsWith(lastTenDigits) ||
        cleanedPhoneNumber.endsWith(leadLastDigits)
      ) {
        console.log(
          `Found matching lead by comparing cleaned numbers: ${lead.id}`
        );
        return lead;
      }
    }
  }

  console.log("No matching lead found after all attempts");
  return null;
}

// Helper function to find a lead by name and partial phone match
export async function findLeadByNameAndPhone(
  supabase: any,
  name: string,
  phoneNumber: string
) {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const lastFourDigits = cleanedPhoneNumber.slice(-4);

  console.log(
    `Looking for lead with name '${name}' and last 4 digits '${lastFourDigits}'`
  );

  // Get leads with the same name
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone_number")
    .ilike("name", `%${name}%`)
    .limit(10);

  if (error || !data || data.length === 0) {
    console.log(`No leads found with name similar to '${name}'`);
    return null;
  }

  // Check if any of these leads have matching phone number patterns
  for (const lead of data) {
    if (!lead.phone_number) continue;

    const leadCleanNumber = lead.phone_number.replace(/\D/g, "");
    if (leadCleanNumber.endsWith(lastFourDigits)) {
      console.log(
        `Found lead with matching name and last 4 digits: ${lead.id}`
      );
      return lead;
    }
  }

  console.log(`No leads found with matching name and phone digits`);
  return null;
}

// Update lead in database
export async function updateLead(
  supabase: any,
  contactId: string,
  updateData: LeadUpdateData
) {
  console.log(`Updating lead ${contactId} with:`, updateData);

  const { data, error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", contactId)
    .select();

  if (error) {
    console.error("Error updating lead:", error);
    throw new Error(`Failed to update lead: ${error.message}`);
  }

  console.log(`Successfully updated lead ${contactId}:`, data);
  return data;
}

// Helper to create a Supabase client
export function createClient(supabaseUrl: string, supabaseKey: string) {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          single: () =>
            fetch(
              `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${encodeURIComponent(
                value
              )}`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                },
              }
            )
              .then((res) => res.json())
              .then((data) => ({ data: data[0], error: null })),
          limit: (n: number) =>
            fetch(
              `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${encodeURIComponent(
                value
              )}&limit=${n}`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                },
              }
            )
              .then((res) => res.json())
              .then((data) => ({ data, error: null })),
        }),
        ilike: (column: string, value: string) => ({
          limit: (n: number) =>
            fetch(
              `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=ilike.${encodeURIComponent(
                value
              )}&limit=${n}`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                },
              }
            )
              .then((res) => res.json())
              .then((data) => ({ data, error: null })),
        }),
        limit: (n: number) =>
          fetch(
            `${supabaseUrl}/rest/v1/${table}?select=${columns}&limit=${n}`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
            }
          )
            .then((res) => res.json())
            .then((data) => ({ data, error: null })),
        single: () =>
          fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          })
            .then((res) => res.json())
            .then((data) => ({ data: data[0], error: null })),
      }),
      update: (updates: any) => ({
        eq: (column: string, value: string) => ({
          select: () =>
            fetch(
              `${supabaseUrl}/rest/v1/${table}?${column}=eq.${encodeURIComponent(
                value
              )}`,
              {
                method: "PATCH",
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify(updates),
              }
            )
              .then((res) => {
                if (res.status === 204) {
                  return { data: {}, error: null };
                }
                return res
                  .json()
                  .then((data) => ({ data, error: null }))
                  .catch((err) => ({ data: null, error: err }));
              })
              .catch((err) => ({ data: null, error: err })),
        }),
      }),
    }),
  };
}

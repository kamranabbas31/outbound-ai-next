import * as XLSX from "xlsx";
import { toast } from "sonner";
import client from "../lib/apollo-client";
import { gql } from "@apollo/client";
import { Lead } from "@/hooks/useLeads";

const FETCH_LEADS_QUERY = gql`
  query FetchLeadsForCampaign($campaignId: String!, $skip: Int, $take: Int) {
    fetchLeadsForCampaign(campaignId: $campaignId, skip: $skip, take: $take) {
      data {
        name
        phone_number
        status
        disposition
        duration
        cost
      }
    }
  }
`;

const FETCH_LEAD_ATTEMPTS_QUERY = gql`
  query FetchLeadAttempts($campaignId: String!) {
    fetchLeadAttempts(campaignId: $campaignId) {
      userError {
        message
      }
      data {
        name
        phone
        status
        disposition
        duration
        cost
        attempt
      }
    }
  }
`;

export const downloadCampaignReport = async (
  campaignId: string,
  campaignName: string,
  cadence: boolean
) => {
  try {
    let leadsData;

    if (cadence) {
      const { data } = await client.query({
        query: FETCH_LEAD_ATTEMPTS_QUERY,
        variables: { campaignId },
      });

      if (data.fetchLeadAttempts.userError) {
        toast.error(data.fetchLeadAttempts.userError.message || "Error fetching lead attempts");
        return;
      }

      leadsData = data.fetchLeadAttempts.data;
      if (!leadsData.length) {
        toast.error("No lead attempts found for this campaign");
        return;
      }
    } else {
      const { data } = await client.query({
        query: FETCH_LEADS_QUERY,
        variables: {
          campaignId,
          skip: 0,
          take: 10000000,
        },
      });

      leadsData = (data?.fetchLeadsForCampaign?.data as Lead[]) ?? [];
      if (!leadsData.length) {
        toast.error("No leads found for this campaign");
        return;
      }
    }

    // Prepare excel data based on cadence flag
    const excelData = cadence
      ? leadsData.map((lead: any) => ({
        "Lead Name": lead.name || "",
        "Phone Number": lead.phone || "",
        Status: lead.status || "",
        Disposition: lead.disposition || "",
        "Duration (minutes)": lead.duration
          ? parseFloat(lead.duration).toFixed(2)
          : "0.00",
        "Cost ($)": lead.cost?.toFixed(2) ?? "0.00",
        "Attempt No": lead.attempt ?? 0,
      }))
      : leadsData.map((lead: Lead) => ({
        "Lead Name": lead.name || "",
        "Phone Number": lead.phone_number || "",
        Status: lead.status || "",
        Disposition: lead.disposition || "",
        "Duration (minutes)": lead.duration?.toFixed(2) ?? "0.00",
        "Cost ($)": lead.cost?.toFixed(2) ?? "0.00",
      }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths based on cadence flag
    worksheet["!cols"] = cadence
      ? [
        { wch: 20 }, // Lead Name
        { wch: 15 }, // Phone Number
        { wch: 12 }, // Status
        { wch: 20 }, // Disposition
        { wch: 15 }, // Duration
        { wch: 10 }, // Cost
        { wch: 10 }, // Attempt No
      ]
      : [
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
      ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Campaign Results");

    const sanitizedName = campaignName.replace(/[^a-z0-9]/gi, "_");
    const filename = `${sanitizedName}_Report_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);

    toast.success(`Report downloaded: ${filename}`);
  } catch (error) {
    console.error("Error generating campaign report:", error);
    toast.error("Failed to generate campaign report");
  }
};

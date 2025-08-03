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

export const downloadCampaignReport = async (
  campaignId: string,
  campaignName: string
) => {
  try {
    const { data } = await client.query({
      query: FETCH_LEADS_QUERY,
      variables: {
        campaignId,
        skip: 0,
        take: 10000000,
      },
    });

    const leads = (data?.fetchLeadsForCampaign?.data as Lead[]) ?? [];

    if (!leads.length) {
      toast.error("No leads found for this campaign");
      return;
    }

    const excelData = leads.map((lead) => ({
      "Lead Name": lead.name || "",
      "Phone Number": lead.phone_number || "",
      Status: lead.status || "",
      Disposition: lead.disposition || "",
      "Duration (minutes)": lead.duration?.toFixed(2) ?? "0.00",
      "Cost ($)": lead.cost?.toFixed(2) ?? "0.00",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Campaign Results");

    const sanitizedName = campaignName.replace(/[^a-z0-9]/gi, "_");
    const filename = `${sanitizedName}_Report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(workbook, filename);

    toast.success(`Report downloaded: ${filename}`);
  } catch (error) {
    console.error("Error generating campaign report:", error);
    toast.error("Failed to generate campaign report");
  }
};

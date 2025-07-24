
export interface WebhookPayload {
  metadata?: {
    contactId?: string;
  };
  message?: {
    artifact?: {
      assistantOverrides?: {
        metadata?: {
          contactId?: string;
        };
      };
      customer?: {
        number?: string;
        name?: string;
      };
      endedReason?: string;
      transcript?: string;
      recordingUrl?: string;
    };
    assistantOverrides?: {
      metadata?: {
        contactId?: string;
      };
    };
    customer?: {
      number?: string;
      name?: string;
    };
    endedReason?: string;
    end_reason?: string;
    analysis?: {
      summary?: string;
      successEvaluation?: string;
      structuredData?: any;
    };
    summary?: string;
    transcript?: string;
    durationSeconds?: number;
    duration?: number;
    recordingUrl?: string;
    recording_url?: string;
    recording?: {
      url?: string;
    };
    call?: {
      recordingUrl?: string;
    };
    metadata?: {
      contactId?: string;
    };
    to?: string;
    success?: boolean;
  };
  customer?: {
    number?: string;
    name?: string;
    contactId?: string;
  };
  assistantOverrides?: {
    metadata?: {
      contactId?: string;
    };
  };
  endedReason?: string;
  end_reason?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: any;
  };
  summary?: string;
  transcript?: string;
  durationSeconds?: number;
  duration?: number;
  recordingUrl?: string;
  recording_url?: string;
  recording?: {
    url?: string;
  };
  call?: {
    recordingUrl?: string;
  };
  to?: string;
  success?: boolean;
  status?: string;
}

export interface LeadUpdateData {
  status: string;
  disposition: string;
  duration: number;
  cost: number;
  recording_url?: string;
}

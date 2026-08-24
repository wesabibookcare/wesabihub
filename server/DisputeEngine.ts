import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
function getAi() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Settings.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export interface DisputePreAssessmentInput {
  disputeId: string;
  reason: string;
  details: string;
  initiatorRole: string;
  conversationSnapshot: any[];
  shipmentInfo?: any;
  trackingHistory?: any[];
  protectionRecord?: any;
}

export async function generateDisputePreAssessment(input: DisputePreAssessmentInput): Promise<string> {
  const {
    disputeId,
    reason,
    details,
    initiatorRole,
    conversationSnapshot,
    shipmentInfo,
    trackingHistory,
    protectionRecord
  } = input;

  // Format messages
  const formattedMessages = conversationSnapshot && conversationSnapshot.length > 0
    ? conversationSnapshot.map((m: any) => `[${m.senderRole}] ${m.senderName}: "${m.text}" (Status: ${m.status}, Attachments: ${m.attachments ? m.attachments.length : 0})`).join("\n")
    : "No chat history available.";

  // Format tracking events
  const formattedTracking = trackingHistory && trackingHistory.length > 0
    ? trackingHistory.map((t: any) => `- [${t.timestamp || t.time || 'N/A'}] ${t.title || t.type}: ${t.description || t.message || ''} at ${t.location || 'Unknown'}`).join("\n")
    : "No tracking history available.";

  // Format payment protection timeline
  const formattedProtection = protectionRecord
    ? `Protection ID: ${protectionRecord.id || protectionRecord.paymentProtectionId}
Amount: ${protectionRecord.currency || 'NGN'} ${protectionRecord.amount}
Status: ${protectionRecord.status}
Inspection Period: ${protectionRecord.inspectionPeriodHours || 48} hours
Inspection Expires At: ${protectionRecord.inspectionExpiresAt || 'N/A'}`
    : "No active payment protection record associated.";

  // Extract Call Evidence if any
  const calls = conversationSnapshot?.filter((m: any) => m.callInfo) || [];
  const callSummary = calls.length > 0
    ? calls.map((c: any) => `- Call Type: ${c.callInfo.callType}, Status: ${c.callInfo.status}, Duration: ${c.callInfo.durationSeconds || 0}s, Consented: ${c.callInfo.consentedParties ? c.callInfo.consentedParties.join(', ') : 'N/A'}`).join("\n")
    : "No Verified Packing or Unpacking Calls logged.";

  const prompt = `
You are the OmorfiHub AI Compliance Officer, an elite, unbiased, automated payment protection auditor. Your job is to pre-assess dispute case #${disputeId} using all forensic custody data provided.

The dispute was opened by the ${initiatorRole}.
Reason Category: ${reason}
Customer/Initiator Details: ${details}

--- FORENSIC EVIDENCE PACKAGE ---

1. PAYMENT PROTECTION & FINANCIAL RECORD:
${formattedProtection}

2. SHIPMENT & LOGISTICS TRACKING SNAPSHOT:
${shipmentInfo ? JSON.stringify(shipmentInfo, null, 2) : "No shipment info available"}
Logistics Timeline:
${formattedTracking}

3. CHAT EVIDENCE SNAPSHOT:
${formattedMessages}

4. VERIFIED AUDIO/VIDEO PACKING & UNPACKING CALL RECORDINGS:
${callSummary}

--- COMPLIANCE ASSESSMENT INSTRUCTIONS ---

Analyze the timeline and logs to write a professional internal pre-assessment. Be cold, analytical, and logical. You are helping human Dispute Administrators and Support Officers make the final decision. Do NOT make the final decision yourself, but provide deep policy guidance.

Please structure your assessment with these exact headings:
1. **Case Summary & Timeline Analysis**: Summarize the sequence of events (securing funds, shipping, tracking milestones, and dispute initiation). Highlight any anomalies in the timing.
2. **Evidence Quality Score & Assessment**: Rate the credibility and completeness of the evidence (High/Medium/Low). Analyze the WeSabiChat logs, any media attachments, and whether Verified Packing/Unpacking calls were made with party consent.
3. **Missing or Contradictory Information**: State exactly what critical evidence is still needed (e.g., photo of parcel damage, merchant shipping receipt, or missing call logs).
4. **Platform Policy & Payment Protection Resolution Guidance**: Suggest possible resolution options (e.g., 100% refund, partial refund, or release of funds to merchant) and outline the next operational case workflow steps to resolve the issue fairly.

Use clear formatting with headers and bullet points. Do not include any promotional language or greetings. Keep the tone strictly professional, objective, and authoritative.
`;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return response.text || "AI Pre-assessment failed to generate content.";
  } catch (error: any) {
    console.error("AI Pre-assessment failed:", error);
    return `Compliance AI Pre-assessment temporarily unavailable. Error: ${error.message || error}`;
  }
}

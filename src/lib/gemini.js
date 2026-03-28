import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as string'));
        return;
      }
      const base64Data = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function processCrisisInput(apiKey, text, imageFile) {
  if (!apiKey) throw new Error('API key is required. Please enter your Gemini API key (or type DEMO).');

  // Hackathon Presentation Failsafe
  if (apiKey.trim().toUpperCase() === 'DEMO') {
    await new Promise(r => setTimeout(r, 1500)); // simulate processing time
    return {
      success: true,
      data: {
        domain: "Emergency Response",
        urgency: "critical",
        summary: "A severe situation has been identified from your input requiring immediate intervention and secure perimeter establishment.",
        keyFacts: [
          "Critical incident reported based on user text.",
          "Immediate physical risk factors detected.",
          "Requires coordinated multi-agency response."
        ],
        recommendedActions: [
          "Dispatch emergency medical services (EMS) immediately.",
          "Establish a secure 500-foot perimeter.",
          "Notify local hospital of incoming critical care patients."
        ],
        missingInformation: [
          "Exact number of individuals affected.",
          "Current environmental hazards (e.g. active power lines).",
          "Clearance for heavy rescue vehicles."
        ],
        verificationNotes: [
          "Ensure scene is safe for first responders before entry.",
          "Treat severity as HIGH until professional on-ground evaluation."
        ]
      }
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `You are an AI assistant that converts messy real-world input into structured, actionable summaries.

Rules:
- Extract only facts from input
- Do not hallucinate
- Be conservative in urgency
- Prioritize safety
- Suggest clear next steps
- Highlight missing information
- Add verification notes

Return ONLY valid JSON with these exact keys:
{
  "domain": "string",
  "urgency": "low | medium | high | critical",
  "summary": "string",
  "keyFacts": ["string"],
  "recommendedActions": ["string"],
  "missingInformation": ["string"],
  "verificationNotes": ["string"]
}

If unsure, include uncertainty in verificationNotes.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction
  });

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      domain:              { type: SchemaType.STRING },
      urgency:             { type: SchemaType.STRING },
      summary:             { type: SchemaType.STRING },
      keyFacts:            { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      recommendedActions:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      missingInformation:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      verificationNotes:   { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ['domain', 'urgency', 'summary', 'keyFacts', 'recommendedActions', 'missingInformation', 'verificationNotes']
  };

  const requestParts = [];
  if (text) requestParts.push(text);

  if (imageFile) {
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      requestParts.push(imagePart);
    } catch (e) {
      console.error('Error reading image file:', e);
      throw new Error(`Image processing failed: ${e.message}`);
    }
  }

  if (requestParts.length === 0) {
    throw new Error('Please provide some text or an image to analyze.');
  }

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: requestParts.map(p => typeof p === 'string' ? { text: p } : p)
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const responseText = result.response.text();
    console.log('Gemini raw response:', responseText);

    try {
      const parsed = JSON.parse(responseText);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.warn('JSON parse failed, raw text returned:', parseError);
      return { success: false, rawText: responseText };
    }
  } catch (error) {
    // Log the full error object for debugging in DevTools
    console.error('Gemini API call failed:', error);

    // Surface the actual error message, not a generic one
    const message = error?.message || String(error);
    throw new Error(`Gemini API Error: ${message}`);
  }
}

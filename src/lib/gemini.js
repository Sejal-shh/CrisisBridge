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
      resolve({
        inlineData: {
          data: result.split(',')[1],
          mimeType: file.type
        }
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function processCrisisInput(apiKey, text, imageFile, locationContext) {
  if (!apiKey) throw new Error('API key is required. Please enter your Gemini API key (or type DEMO).');

  if (apiKey.trim().toUpperCase() === 'DEMO') {
    await new Promise(r => setTimeout(r, 1500));
    return {
      success: true,
      data: {
        incident_type: "medical",
        urgency: "high",
        summary: "Severe medical distress reported with cardiac symptoms requiring fast verification and immediate response.",
        key_facts: [
          "Patient 45yo male reporting crushing chest pain.",
          "Symptoms started 10 minutes ago.",
          "Pre-existing hypertension present."
        ],
        immediate_actions: [
          "Have patient sit down and rest immediately.",
          "Call emergency medical dispatch.",
          "Prepare to initiate CPR if unconsciousness occurs."
        ],
        avoid_actions: [
          "Do not allow patient to walk or exert themselves.",
          "Avoid offering water or food."
        ],
        missing_information: [
          "Current pulse and breathing rate.",
          "Any recent medication taken (e.g. aspirin/nitroglycerin)."
        ],
        escalation_recommendation: "Immediate Advanced Life Support (ALS) dispatch.",
        recommended_services: ["hospital", "fire"],
        verification_notes: [
          "Needs confirmation of airway clarity.",
          "Severity assumed high (possible myocardial infarction) until determined by paramedics."
        ]
      }
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `You are an assistive emergency triage AI. Your output is non-authoritative and for guidance only.
Convert messy real-world input into structured, safe, and actionable output.

Rules:
- Treat your analysis as strictly assistive, not definitive.
- Extract only facts from input
- Do not hallucinate
- Be conservative in urgency classification
- Prioritize safety and escalation
- Suggest practical next steps
- Clearly state missing information
- Include uncertainty where needed
- Avoid definitive diagnosis

Return ONLY valid JSON:

{
  "incident_type": "medical | fire | flood | electrical | traffic | personal_safety | unknown",
  "urgency": "low | medium | high | critical",
  "summary": "string",
  "key_facts": ["string"],
  "immediate_actions": ["string"],
  "avoid_actions": ["string"],
  "missing_information": ["string"],
  "escalation_recommendation": "string",
  "recommended_services": ["hospital", "police", "fire", "pharmacy"],
  "verification_notes": ["string"]
}`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    systemInstruction: systemInstruction
  });

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      incident_type: { type: SchemaType.STRING },
      urgency: { type: SchemaType.STRING },
      summary: { type: SchemaType.STRING },
      key_facts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      immediate_actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      avoid_actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      missing_information: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      escalation_recommendation: { type: SchemaType.STRING },
      recommended_services: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      verification_notes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: [
      "incident_type", "urgency", "summary", "key_facts", 
      "immediate_actions", "avoid_actions", "missing_information", 
      "escalation_recommendation", "recommended_services", "verification_notes"
    ]
  };

  const requestParts = [];
  
  if (locationContext) {
    requestParts.push(`Reported Location: ${locationContext}\n\n`);
  }
  
  if (text) {
    requestParts.push(`Incident Description:\n${text}`);
  }

  if (imageFile) {
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      requestParts.push(imagePart);
    } catch (e) {
      console.error("Error reading image:", e);
      throw new Error(`Failed to process the uploaded image: ${e.message}`);
    }
  }

  if (requestParts.length === 0) {
    throw new Error('Please provide incident text or upload an image to analyze.');
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
    
    try {
      const parsed = JSON.parse(responseText);
      return { success: true, data: parsed };
    } catch (parseError) {
      return { success: false, rawText: responseText };
    }
  } catch (error) {
    // Stripped console.error log to absolutely prevent API Keys / secure data leaking to devtools
    return { 
      success: false, 
      rawText: "The AI service is currently unavailable or the API key is exhausted. Please follow standard local emergency protocols and dial emergency services (e.g., 911) immediately." 
    };
  }
}

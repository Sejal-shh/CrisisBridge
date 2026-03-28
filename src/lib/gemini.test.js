import { describe, it, expect, vi } from 'vitest';
import { processCrisisInput } from './gemini';

// Mock the network-dependent Google AI package to isolate internal logic
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => {
      return {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockImplementation(async (req) => {
            const textContent = req.contents[0].parts[0].text;
            
            // 1. Simulate API Hard Failure
            if (textContent.includes("FAIL_API")) {
              throw new Error("Simulated Network Timeout / Exhaustion Error");
            }
            
            // 2. Simulate Bad JSON parsing failure
            if (textContent.includes("BAD_JSON")) {
              return {
                response: { text: () => "{ incomplete_json_string: " }
              };
            }
            
            // 3. Return standard structured mock JSON for logic mapping tests
            const mockResponse = {
              incident_type: "electrical",
              urgency: "critical",
              summary: "High voltage hazard.",
              key_facts: ["Sparks visible"],
              immediate_actions: ["Clear the area"],
              avoid_actions: ["Touching wires"],
              missing_information: ["Source block number"],
              escalation_recommendation: "Immediate Grid Shutoff",
              recommended_services: ["fire", "police"],
              verification_notes: ["None"]
            };
            
            return {
              response: { text: () => JSON.stringify(mockResponse) }
            };
          })
        })
      };
    }),
    SchemaType: {
      OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY'
    }
  };
});

describe('CrisisBridge AI Integration Tests', () => {
  
  it('should immediately throw an error if no API key is provided before network execution', async () => {
    // Asserting the exact early exit error message
    await expect(processCrisisInput(null, 'test text'))
      .rejects.toThrow('API key is required. Please enter your Gemini API key (or type DEMO).');
  });

  it('should successfully short-circuit and return strict DEMO fallback JSON', async () => {
    // Trigger the internal offline failsafe
    const result = await processCrisisInput('DEMO', 'Help!');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Verify mapped data from internal object
    expect(result.data.urgency).toBe('high');
    expect(result.data.incident_type).toBe('medical');
  });

  it('should successfully execute JSON parsing logic on valid AI output', async () => {
    const result = await processCrisisInput('REAL_KEY', 'There is an electrical fire!');
    
    expect(result.success).toBe(true);
    // Verifying urgency mapping expectations (Color/Labelling behavior is derived from this literal exact string)
    expect(result.data.urgency).toBe('critical'); 
    expect(result.data.incident_type).toBe('electrical');
    expect(result.data).toHaveProperty('recommended_services');
    expect(result.data.recommended_services).toContain('fire');
  });

  it('should degrade safely and return the raw output text if the API returns invalid JSON', async () => {
    const result = await processCrisisInput('REAL_KEY', 'BAD_JSON');
    
    expect(result.success).toBe(false);
    expect(result.rawText).toContain('{ incomplete_json_string:');
  });

  it('should handle API layer failures seamlessly with a secure user-facing fallback context', async () => {
    const result = await processCrisisInput('REAL_KEY', 'FAIL_API');
    
    expect(result.success).toBe(false);
    // Asserts that standard emergency protocols are recommended when standard execution collapses
    expect(result.rawText).toContain('service is currently unavailable');
    expect(result.rawText).toContain('dial emergency services');
  });
});

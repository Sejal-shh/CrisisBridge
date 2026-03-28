# 🚨 CrisisBridge AI 

> *"From chaotic input to beneficial output."*

**Chosen Vertical:** Emergency & Public Safety 

---

## 🛑 The Problem

When severe incidents (medical emergencies, natural disasters, active hazards) occur, the initial reports are often chaotic, disjointed, and incomplete. Bystanders or victims in shock struggle to articulate the exact nature of the problem, leading to critical delays in emergency response dispatch and incorrect allocations of crucial tier-1 resources. 

The immediate moments following a crisis suffer from a catastrophic lack of structured intelligence.

## 💡 The Solution

**CrisisBridge** is a native-feeling, ultra-low latency intelligent triage application designed to act as an immediate proxy between chaotic civilian input and structured operational data. It utilizes advanced vision and linguistic models to instantly synthesize messy text descriptions or chaotic images into a strictly mapped, 10-point actionable tactical framework, then instantly overlays this information over live geographic resource mapping.

By automating the synthesis of crisis data, we eliminate the "cognitive load" of determining what to do next during high-adrenaline scenarios while formatting the exact data standard needed for 911 dispatchers and First Responders.

---

## 🛠️ How It Works (Step-By-Step)

1. **Information Capture:** The user opens the highly accessible app and inputs raw data (e.g., "Guy sweating profusely with chest pain") or uploads a chaotic real-time incident photo. They also permit geolocation tracking with a single click.
2. **AI Synthesis Pipeline:** The system passes the unstructured, multimodal data through Google's Gemini LLM with a strictly guarded internal schema.
3. **Structured Execution Board:** The system instantly returns a 10-point Action Plan formatted into highly readable UI cards. It parses out specific `Immediate Actions`, tags the `Urgency` securely, and critically highlights dangerous `AVOID ACTIONS`.
4. **Geographic Resource Matrix:** The application parses the derived needed intelligence (e.g., "Fire" & "Hospital") and passes those exact resource nodes into a localized dispatch map array generated strictly via longitude/latitude.

---

## 🌐 Google Technologies & Frameworks Leveraged

- **Google Gemini 1.5 Flash:** Powers the backbone of the entire data pipeline. Utilized for zero-shot text structuring and complex multimodal image analysis to extract severity and tactical advice simultaneously.
- **Google Maps API (Embedded):** Dynamically generated geographic `iframe` arrays based on contextually required services intercepted by Gemini API.
- **Browser Geolocation API:** Hardware-level GPS integration to feed true localization into the contextual intelligence.
- **React + Vite App Architecture:** Ensures an ultra-performant, zero-stutter Single Page Application (SPA) natively styled in custom CSS without bulk libraries.

---

## 🛡️ Safety & Security Architecture

CrisisBridge was engineered heavily with "Safe AI" principles specifically required for Emergency Verticals:
1. **Strictly Non-Authoritative:** System prompts force the model to adopt a conservative, assistive approach designed heavily to escalate issues rather than diagnose them.
2. **Persistent Warning Banners:** High-contrast `(⚠ AI-assisted guidance only. Dial 911 for certified emergency response)` alerts exist unconditionally on every page.
3. **Network Failsafes:** Implemented strict error handling to ensure standard emergency protocol text renders even if the APIs or user networks fail entirely. 
4. **Offline DEMO Engine:** Specifically engineered an offline `DEMO` API Key branch to safely demo the product mechanics securely offline.

---

## 🚀 Setup & Execution 

### Requirements:
- Node.js version 18+

### Installation Sequence:
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Sejal-shh/CrisisBridge.git
   ```
2. Navigate to the project directory and install dependencies:
   ```bash
   cd CrisisBridge
   npm install
   ```
3. Boot the local Vite development server:
   ```bash
   npm run dev
   ```
4. Access the CrisisBridge platform via your browser at `http://localhost:5173`.
5. Run the offline test suite (`npm run test`) to verify core logical mapping components.

---

## Design Decisions

- Optimized for real-time emergency scenarios
- Structured output ensures clarity over conversational ambiguity
- Safety-first design with explicit uncertainty and escalation
- Lightweight frontend ensures usability in low-network conditions
- API key handled client-side strictly in memory (wipes on refresh) for pure demo security purposes.

## ⚠️ Known Limitations

- Voice input not yet implemented (planned enhancement)
- Uses iframe-based Google Maps instead of full Maps SDK for simplicity
- Client-side only architecture for rapid prototyping

## 🔮 Future Development Roadmap
1. **Direct CAD Integrations:** Formatting the outgoing JSON intelligence string to fire directly into local Computer Aided Dispatch (CAD) systems utilized by regional 911 systems.
2. **Live Audio Interception:** Incorporating Speech-to-Text streaming so bystanders can just stream chaotic audio to bypass manual typing entirely.
3. **Secure Firebasing Auth:** Adding native user-authentication and encrypted cloud database hosting (Firestore) to create audit logs of all field reports for post-incident insurance processing.

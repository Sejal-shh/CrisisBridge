import React, { useState } from 'react';
import { processCrisisInput } from './lib/gemini';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [rawOutput, setRawOutput] = useState(null);

  const setExample = (text) => setText(text);

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey) return setError('Please enter your Gemini API key.');
    if (!text && !image) return setError('Please enter some text or upload an image.');

    setLoading(true);
    setError(null);
    setResult(null);
    setRawOutput(null);

    try {
      const response = await processCrisisInput(apiKey, text, image);
      if (response && response.success) {
        setResult(response.data);
      } else {
        setRawOutput(response?.rawText || 'Failed to generate output.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>CrisisBridge &ndash; From Chaos to Action</h1>
      <p className="subtitle">Convert messy real-world input into structured, life-saving actions</p>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <label>Gemini API Key</label>
        <input 
          type="password" 
          placeholder="AIzaSy..." 
          value={apiKey} 
          onChange={handleApiKeyChange}
        />
        
        <label>Situation Description</label>
        <div className="example-buttons">
          <button type="button" className="btn-sm" onClick={() => setExample("Patient 45yo male, severe crushing chest pain radiating to left arm, sweating profusely, shortness of breath, started 10 mins ago. History of hypertension.")}>Medical emergency</button>
          <button type="button" className="btn-sm" onClick={() => setExample("River overflowing at Main St bridge. Water rising fast. Two cars stalled with people inside. Current is getting stronger.")}>Flood / disaster situation</button>
          <button type="button" className="btn-sm" onClick={() => setExample("Large oak tree fell across Maple Ave, taking down multiple active power lines. Sparks visible. Road completely blocked.")}>General problem</button>
        </div>
        <textarea 
          placeholder="Describe the problem, crisis, or document contents..." 
          value={text} 
          onChange={(e) => setText(e.target.value)}
        />
        
        <label>Provide Context Image (Optional)</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing...' : 'Analyze Input'}
        </button>
      </div>

      {rawOutput && (
        <div className="card">
          <h2>Raw Output (Failed to Parse JSON)</h2>
          <div className="raw-output">{rawOutput}</div>
        </div>
      )}

      {result && (
        <div className="grid">
          <div className="result-card full-width">
            <h2>Situation Summary</h2>
            <p>{result.summary}</p>
            <div style={{ marginTop: '10px' }}>
              <strong>Domain:</strong> {result.domain} &nbsp;|&nbsp; 
              <strong>Urgency:</strong> <span className={`badge ${result.urgency?.toLowerCase()}`}>{result.urgency}</span>
            </div>
          </div>
          
          <div className="result-card">
            <h2>Key Facts</h2>
            <ul>
              {result.keyFacts?.map((fact, i) => <li key={i}>{fact}</li>)}
            </ul>
          </div>

          <div className="result-card">
            <h2>Recommended Next Actions</h2>
            <ul>
              {result.recommendedActions?.map((action, i) => <li key={i}>{action}</li>)}
            </ul>
          </div>

          <div className="result-card">
            <h2>Missing Information to Verify</h2>
            <ul>
              {result.missingInformation?.map((info, i) => <li key={i}>{info}</li>)}
            </ul>
          </div>

          <div className="result-card full-width" style={{ borderLeft: '4px solid #f59e0b' }}>
            <h2>Verification Notes</h2>
            <ul>
              {result.verificationNotes?.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="disclaimer">
        This is AI-assisted guidance. Verify critical actions with professionals.
      </div>
    </div>
  );
}

export default App;

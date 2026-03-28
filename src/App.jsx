import React, { useState, useCallback } from 'react';
import { processCrisisInput } from './lib/gemini';

const EXAMPLES = [
  { label: 'Medical emergency', text: "Patient 45yo male, severe crushing chest pain radiating to left arm, sweating profusely, shortness of breath, started 10 mins ago. History of hypertension." },
  { label: 'Flood / Disaster', text: "River overflowing at Main St bridge. Water rising fast. Two cars stalled with people inside. Current is getting stronger." },
  { label: 'Electrical Hazard', text: "Large oak tree fell across Maple Ave, taking down multiple active power lines. Sparks visible. Road completely blocked, live wires resting on a vehicle." }
];

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash', 'input', 'results', 'maps'

  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [locationContext, setLocationContext] = useState('');
  const [coords, setCoords] = useState(null);

  const [locLoading, setLocLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null);
  const [rawOutput, setRawOutput] = useState(null);
  const [copied, setCopied] = useState(false);

  // Note: The timer Effect was specifically removed per your request! You now control entering.

  const handleApiKeyChange = useCallback((e) => setApiKey(e.target.value), []);

  const handleImageChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  }, []);

  const handleGetLocation = useCallback(() => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationContext(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (Acc: ${accuracy}m)`);
        setLocLoading(false);
      },
      () => {
        setError('Unable to retrieve your location permissions. Please check browser settings.');
        setLocLoading(false);
      }
    );
  }, []);

  const handleReset = useCallback(() => {
    setText('');
    setImage(null);
    setLocationContext('');
    setCoords(null);
    setResult(null);
    setRawOutput(null);
    setError(null);
    setCopied(false);
    setCurrentScreen('input');
  }, []);

  const handleCopy = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const currentKey = apiKey.trim();
    if (!currentKey) return setError('Please map a valid Gemini API key.');
    if ((!text || !text.trim()) && !image) return setError('Please provide emergency details or upload an image before proceeding.');

    setLoading(true);
    setError(null);
    setResult(null);
    setRawOutput(null);

    try {
      const response = await processCrisisInput(apiKey.trim(), text, image, locationContext);
      if (response && response.success) {
        setResult(response.data);
        setCurrentScreen('results');
      } else {
        setRawOutput(response?.rawText || 'Failed to generate output.');
        setCurrentScreen('results');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred building the triage plan.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, text, image, locationContext]);

  //==========================================
  // RENDER: SPLASH SCREEN
  //==========================================
  if (currentScreen === 'splash') {
    return (
      <main className="splash-screen">
        <h1 className="splash-title">CrisisBridge AI</h1>
        <p className="splash-subtitle">From chaotic input to beneficial output</p>
        <button className="splash-btn" onClick={() => setCurrentScreen('input')}>
          Enter Platform Now
        </button>
      </main>
    );
  }

  //==========================================
  // RENDER: MAIN APPLICATION
  //==========================================
  return (
    <div className="container" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease-in-out' }}>

      <header className="header-bar">
        <h1 className="header-title">CrisisBridge <span>AI</span></h1>
        {currentScreen !== 'input' && (
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            ↺ New Incident
          </button>
        )}
      </header>

      <main>
        {/* Only show error on the input screen if we failed before routing */}
        {error && currentScreen === 'input' && (
          <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#fef2f2', color: '#991b1b', padding: '1rem 2rem', borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '2px solid #ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideUp 0.3s ease-out', minWidth: '300px', justifyContent: 'center' }} role="alert" aria-live="assertive">
            <span style={{ fontSize: '1.4rem' }}>⚠</span> 
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.5rem', marginLeft: 'auto', padding: '0 5px' }} aria-label="Close Error">×</button>
          </div>
        )}

        {/* VIEW 1: INPUT FORM */}
        {currentScreen === 'input' && (
          <section className="card slide-left" aria-label="Incident Triage Form">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', color: '#f8fafc' }}>Incident Command Input</h2>

            <form onSubmit={handleSubmit} noValidate>

              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="api-key-input">Secure AI API Key <span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '8px', textTransform: 'none', letterSpacing: 'normal' }}>*Cleared on Refresh</span></label>
                <input
                  id="api-key-input"
                  type="password"
                  placeholder="Paste your Gemini AI key here (or type DEMO)"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  aria-required="true"
                />
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid #334155', marginBottom: '2rem' }}>
                <label htmlFor="situation-description">Describe The Emergency</label>

                <nav aria-label="Example scenarios" className="example-buttons">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn-sm"
                      onClick={() => setText(ex.text)}
                      aria-label={`Use example: ${ex.label}`}
                    >
                      {ex.label}
                    </button>
                  ))}
                </nav>

                <textarea
                  id="situation-description"
                  placeholder="Detail the chaotic problem, crisis, injuries, or hazards..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-required={!image ? "true" : "false"}
                  style={{ marginBottom: '0' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <label htmlFor="context-image">Provide Contextual Image <span>(Optional)</span></label>
                  <input
                    id="context-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ background: 'transparent', border: 'none', padding: 0 }}
                  />
                </div>

                <div>
                  <span id="location-label" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#94a3b8' }}>
                    Geographic Reality
                  </span>
                  {locationContext ? (
                    <div role="status" aria-labelledby="location-label" style={{ padding: '0.75rem 1rem', background: 'rgba(22, 163, 74, 0.2)', color: '#86efac', borderRadius: '8px', border: '1px solid #22c55e', fontWeight: 700 }}>
                      <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>✓ </span> {locationContext}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locLoading}
                      aria-label="Use browser geolocation to acquire operational coordinates"
                      aria-describedby="location-label"
                      style={{ 
                        width: '100%', 
                        padding: '1.1rem', 
                        background: 'linear-gradient(to right, #059669, #10b981)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold', 
                        cursor: 'pointer', 
                        boxShadow: '0 8px 20px -5px rgba(16, 185, 129, 0.5)', 
                        transition: 'all 0.2s ease-in-out' 
                      }}
                      onMouseOver={(e) => !locLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => !locLoading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {locLoading ? 'Acquiring Secure Lat/Lng...' : '📍 Secure Current Location'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '3rem' }}>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? 'Synthesizing Tactical Data...' : 'Generate Structured Plan →'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* VIEW 2: RESULTS */}
        {currentScreen === 'results' && rawOutput && (
          <section className="card slide-left" role="alert" aria-live="assertive" style={{ borderLeft: '6px solid #ef4444' }}>
            <h2 style={{ color: '#fca5a5', fontSize: '2rem' }}>System Fallback Notification</h2>
            <div className="raw-output" style={{ background: 'rgba(153, 27, 27, 0.2)', color: '#fca5a5', fontWeight: 600, fontSize: '1.1rem' }}>
              {rawOutput}
            </div>
            <button className="btn-secondary" onClick={handleReset} style={{ marginTop: '2rem' }}>
              ← Return to Input
            </button>
          </section>
        )}

        {currentScreen === 'results' && result && (
          <section aria-label="Analysis Results" role="region" aria-live="polite">

            <header className="slide-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '2rem', color: '#f8fafc' }}>Structured Action Plan</h2>
              <button
                onClick={handleCopy}
                className="btn-secondary"
                aria-label={copied ? "JSON copied to clipboard" : "Copy JSON to clipboard"}
              >
                {copied ? '✓ JSON Copied!' : '📋 Copy JSON'}
              </button>
            </header>

            <div className="grid">

              <article className="result-card full-width slide-right" style={{ animationDelay: '0.1s' }}>
                <h2>Situation Intelligence Summary</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#cbd5e1' }}>{result.summary}</p>
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Incident Type</strong>
                    <div style={{ textTransform: 'capitalize', fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', marginTop: '0.25rem' }}>{result.incident_type}</div>
                  </div>
                  <div style={{ width: '2px', height: '40px', background: '#334155' }}></div>
                  <div>
                    <strong style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', display: 'block' }}>Engineered Urgency</strong>
                    <span className={`badge ${result.urgency?.toLowerCase()}`} aria-label={`Urgency level is ${result.urgency}`} style={{ marginTop: '0.5rem' }}>
                      [Level: {result.urgency}]
                    </span>
                  </div>
                </div>
              </article>

              <article className="result-card full-width slide-left" style={{ animationDelay: '0.2s', background: '#0f172a', border: '1px solid #334155' }}>
                <h2>Verified Key Facts</h2>
                <ul style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{result.key_facts?.map((fact, i) => <li key={i}>{fact}</li>)}</ul>
              </article>

              <article className="result-card slide-right" style={{ animationDelay: '0.3s', borderLeft: '6px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                <h2 style={{ color: '#60a5fa' }}>Immediate Actions Required</h2>
                <ul>{result.immediate_actions?.map((action, i) => <li key={i} style={{ color: '#e2e8f0', fontWeight: '500' }}>{action}</li>)}</ul>
              </article>

              <article className="result-card slide-left" style={{ animationDelay: '0.4s', borderLeft: '6px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                <h2 style={{ color: '#f87171' }}>⚠ CRITICAL AVOID ACTIONS</h2>
                <ul>{result.avoid_actions?.map((action, i) => <li key={i} style={{ color: '#fca5a5', fontWeight: 700 }}>{action}</li>)}</ul>
              </article>

              <article className="result-card full-width slide-right" style={{ animationDelay: '0.5s', borderLeft: '6px solid #f59e0b' }}>
                <h2 style={{ color: '#fbbf24' }}>Escalation & Unverified Intelligence</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: '#fb923c', marginBottom: '0.5rem' }}>Primary Escalation</h3>
                  <p style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem', margin: 0 }}>{result.escalation_recommendation}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#94a3b8' }}>Missing Information</h3>
                    <ul style={{ color: '#cbd5e1' }}>{result.missing_information?.map((info, i) => <li key={i}>{info}</li>)}</ul>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#94a3b8' }}>Verification Notes</h3>
                    <ul style={{ color: '#cbd5e1' }}>{result.verification_notes?.map((note, i) => <li key={i}>{note}</li>)}</ul>
                  </div>
                </div>
              </article>
            </div>

            <div className="slide-up" style={{ marginTop: '3rem', textAlign: 'center', animation: 'slideUp 0.8s ease forwards', opacity: 0, animationDelay: '0.7s' }}>
              <button className="btn" onClick={() => setCurrentScreen('maps')} style={{ fontSize: '1.5rem', padding: '1.5rem', maxWidth: '500px' }}>
                Dispatch Nearby Services 🗺️
              </button>
            </div>

          </section>
        )}

        {/* VIEW 3: MAPS & SERVICES */}
        {currentScreen === 'maps' && result && (
          <section aria-label="Geographic Dispatch Intelligence" role="region" className="slide-left">

            <header style={{ marginBottom: '2.5rem' }}>
              <button className="btn-secondary" onClick={() => setCurrentScreen('results')} style={{ marginBottom: '2rem' }}>
                ← Back to Tactical Plan
              </button>
              <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#f8fafc' }}>Nearby Recommended Facilities</h2>
              <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginTop: '0.5rem' }}>We intercepted these required logistics: {result.recommended_services?.join(', ')}</p>
            </header>

            {!coords ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                <h3 style={{ color: '#f8fafc', fontSize: '1.75rem' }}>Geographic Capabilities Locked</h3>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>You did not utilize internal tracking coordinates during initialization. Return and track your location to dispatch mapped assets.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
                {result.recommended_services?.map((svc, i) => (
                  <figure className="card slide-right" key={i} style={{ animationDelay: `${i * 0.2}s`, margin: 0, padding: '1.5rem', border: '2px solid #334155' }}>
                    <figcaption style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <span style={{ textTransform: 'capitalize', fontSize: '1.75rem', color: '#f8fafc', fontWeight: '800' }}>
                        Local {svc}
                      </span>
                      <span className="badge low">VERIFIED</span>
                    </figcaption>
                    <iframe
                      title={`Google Map showing nearest ${svc}`}
                      width="100%"
                      height="350"
                      frameBorder="0"
                      style={{ border: 0, borderRadius: '8px', background: '#0f172a', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${svc}+near+${coords.lat},${coords.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed&style=element:geometry%7Ccolor:0x212121`}
                      allowFullScreen>
                    </iframe>
                  </figure>
                ))}
              </div>
            )}

            <div style={{ marginTop: '4rem', textAlign: 'center', paddingBottom: '2rem' }}>
              <button className="btn-danger slide-up" onClick={handleReset} style={{ maxWidth: '400px', fontSize: '1.2rem', animationDelay: '0.6s' }}>
                Securely End Triage Cycle
              </button>
            </div>

          </section>
        )}

      </main>

      {currentScreen !== 'splash' && (
        <footer style={{ marginTop: '4rem', padding: '1.5rem', textAlign: 'center', fontWeight: 'bold', color: '#fca5a5', background: 'rgba(153, 27, 27, 0.15)', border: '1px solid #ef4444', borderRadius: '8px' }} role="contentinfo">
          ⚠ This is AI-assisted guidance. Always dial your local emergency capabilities (911) dynamically.
        </footer>
      )}
    </div>
  );
}

export default App;

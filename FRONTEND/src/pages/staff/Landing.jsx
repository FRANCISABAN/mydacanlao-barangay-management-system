import { CERT_TYPES } from '../../lib/staff/constants.js'
import { useAuth } from '../../lib/staff/auth.js'
import { Link } from '../../components/staff/ui.jsx'
import PublicBar from '../../components/staff/PublicBar.jsx'

function scrollToSection(id) {
  const section = document.getElementById(id)
  if (!section) return
  section.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

export default function Landing() {
  const { signedIn } = useAuth()
  return (
    <>
      <PublicBar landing />
      <main className="landing landing-home">
        <section className="landing-hero" aria-labelledby="cert-h">
          <div className="hero-copy">
            <p className="landing-eyebrow"><span /> Barangay services, made simpler</p>
            <h1 id="cert-h">Your next step starts <span>right here.</span></h1>
            <p className="hero-description">
              Find the barangay certificate you need and send your request online, at your own pace.
            </p>
            <div className="hero-actions">
              <Link to="/request" className="btn primary">Request a certificate <span aria-hidden="true">→</span></Link>
              <button type="button" className="btn hero-secondary" onClick={() => scrollToSection('services')}>Explore services</button>
            </div>
            <div className="hero-points" aria-label="Service highlights">
              <span><b aria-hidden="true">✓</b> Clear requirements</span>
              <span><b aria-hidden="true">✓</b> Submit from home</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="hero-document">
              <div className="hero-document-top"><span className="seal">MD</span><span>BARANGAY DACANLAO</span></div>
              <div className="hero-document-rule" />
              <span className="hero-document-kicker">COMMUNITY SERVICES</span>
              <strong>Made for your<br />next chapter.</strong>
              <span className="hero-document-line" />
              <span className="hero-document-line short" />
              <div className="hero-document-stamp">MD</div>
            </div>
            <div className="hero-float hero-float-top"><span className="hero-float-dot" /> Simple online requests</div>
            <div className="hero-float hero-float-bottom"><span>01</span> Choose a service</div>
          </div>
        </section>

        <section className="landing-section services-section" id="services" aria-labelledby="services-title">
          <div className="section-heading">
            <div>
              <p className="landing-eyebrow">Services for residents</p>
              <h2 id="services-title">What can we help you with?</h2>
              <p>Choose a certificate to see its requirements and start your request.</p>
            </div>
            <span className="section-count">{Object.keys(CERT_TYPES).length} SERVICES</span>
          </div>
          <ul className="cert-grid">
            {Object.entries(CERT_TYPES).map(([name, reqs], index) => (
              <li key={name}>
                <Link to={`/request?type=${encodeURIComponent(name)}`} className="cert-card">
                  <span className="cert-card-number">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{name}</strong>
                  <span className="cert-card-requirements">Prepare: {reqs.join(', ')}</span>
                  <span className="cert-card-link">View requirements <span aria-hidden="true">↗</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-section process-section" id="how-it-works" aria-labelledby="process-title">
          <div className="section-heading">
            <div>
              <p className="landing-eyebrow">A straightforward process</p>
              <h2 id="process-title">Three steps. One less trip.</h2>
              <p>Prepare your information before visiting the barangay hall.</p>
            </div>
          </div>
          <ol className="process-grid">
            <li className="process-step">
              <span className="process-number">01</span>
              <h3>Choose your certificate</h3>
              <p>Browse the services and check the documents you may need.</p>
            </li>
            <li className="process-step">
              <span className="process-number">02</span>
              <h3>Send your request</h3>
              <p>Enter your details, contact email, and attach supporting documents.</p>
            </li>
            <li className="process-step">
              <span className="process-number">03</span>
              <h3>Secretary review</h3>
              <p>The Barangay Secretary reviews your request and submitted documents.</p>
            </li>
          </ol>
        </section>

        <section className="landing-section doors-section" aria-labelledby="who-h">
          <div className="section-heading">
            <div>
              <p className="landing-eyebrow">Welcome to MyDacanlao</p>
              <h2 id="who-h">A helpful place to get started.</h2>
            </div>
          </div>
          <div className="door-grid">
            <div className="door resident-door">
              <span className="door-label">FOR RESIDENTS</span>
              <h3>Get your request started.</h3>
              <p>Review certificate requirements and submit your details and supporting documents online.</p>
              <Link to="/request" className="btn primary">Request a certificate <span aria-hidden="true">→</span></Link>
            </div>
            <div className="door dark secretary-door">
              <span className="door-label">FOR BARANGAY STAFF</span>
              <h3>Manage requests in one place.</h3>
              <p>Review submitted requests, check documents, and manage resident records.</p>
              <Link to={signedIn ? '/dashboard' : '/login'} className="btn">
                {signedIn ? 'Open dashboard' : 'Staff log in'} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div>
            <p className="landing-eyebrow">Ready when you are</p>
            <h2 id="cta-title">Start with the service you need.</h2>
            <p>Check the requirements first, then submit your request online.</p>
          </div>
          <Link to="/request" className="btn primary">Browse certificates <span aria-hidden="true">→</span></Link>
        </section>
      </main>
      <footer className="public-foot landing-footer">
        <strong>MyDacanlao</strong>
        <p>Need help? Ask for assistance at the Barangay Hall.</p>
        <p>Pag Asenso Laban ko Angat Dacanlao</p>
      </footer>
    </>
  )
}

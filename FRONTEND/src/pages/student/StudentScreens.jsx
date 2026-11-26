// WBS 4.1.1 [Frontend] Implement student account registration
// WBS 4.1.2 [Frontend] Implement student login and logout
function StudentLoginPage({ onBack, onLoggedIn, showToast }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', address: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showPw, setShowPw] = useState(false);

    const registering = mode === 'reg';

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        // Kapag in-edit ang email, mag-request ulit ng OTP.
        if (e.target.name === 'email') {
            setOtpEmail('');
            setOtp('');
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const name = form.name.trim();
        const address = form.address.trim();
        const email = form.email.trim().toLowerCase();
        const password = form.password;

        if (!email || !password || (registering && (!name || !address))) {
            setError('Fill in all the fields to continue.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Enter a valid email, like you@gmail.com.');
            return;
        }
        if (registering && !isValidAddress(address)) {
            setError('Address must include the barangay, municipality and province, and must be in Dacanlao, City of Calaca, Batangas.');
            return;
        }
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            if (registering) {
                if (otpEmail !== email) {
                    // Una: ipadala muna ang OTP. Hindi pa ginagawa ang account.
                    await call('/student/send-otp', send('POST', { email }));
                    setOtpEmail(email);
                    showToast('Verification code sent to ' + email);
                    return;
                }
                // Pangalawa: i-check ang OTP at saka gawin ang account.
                const data = await call('/student/register', send('POST', { name, address, email, password, otp }));

                // welcome email to the Gmail the student just registered (does not block the login)
                sendEmails([{
                    to: email,
                    name,
                    subject: 'Welcome to the SK Scholarship Portal',
                    text: 'Your account has been created. You can now log in, choose a scholarship, and upload your requirements. Updates on your application will be sent to this email.',
                }]).then((result) => showToast(result.ok
                    ? `Welcome email sent to ${email}.`
                    : `Account created, but the welcome email was not sent. ${result.error}`));

                onLoggedIn({ role: 'student', ...data.message }, data.token);
            } else {
                const data = await call('/student/login', send('POST', { email, password }));
                onLoggedIn({ role: 'student', ...data.message }, data.token);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="login page role-st stl">

            {/* Background: malabong asul at dilaw na kulay */}
            <div className="stl-bg" aria-hidden="true"><span /><span /></div>

            <main className="stl-card">

                {/* Kaliwa: araw, pagbati at mga bagay na magagawa */}
                <aside className="lside">
                    <StudentSun />
                    <button className="back" onClick={onBack}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                        Back to home
                    </button>

                    <div className="stl-hello">
                        <p className="stl-eyebrow">SK Scholarship Portal</p>
                        <h1>Kumusta, scholar!</h1>
                        <p className="stl-sub">Log in or create your student account to start applying.</p>

                        <ul className="stl-points">
                            <li>
                                <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-5 9 5-9 5z" /><path d="M7 11.5V16c2.5 2 7.5 2 10 0v-4.5" /></svg></span>
                                Browse open scholarships
                            </li>
                            <li>
                                <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg></span>
                                Upload your requirements
                            </li>
                            <li>
                                <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg></span>
                                Get updates in your Gmail
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Kanan: login o gumawa ng account */}
                <section className="lform">
                    <div className="fcard">
                        <h2>{registering ? 'Create account' : 'Student login'}</h2>
                        <p className="stl-mut">{registering ? 'Fill in your details. We will send a code to your Gmail.' : 'Welcome back! Log in to continue.'}</p>

                        <div className="seg">
                            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
                            <button type="button" className={mode === 'reg' ? 'on' : ''} onClick={() => setMode('reg')}>New student</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {registering && (
                                <>
                                    <label htmlFor="nm">Full name</label>
                                    <div className="stl-field">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" /></svg>
                                        <input id="nm" name="name" autoComplete="name" placeholder="Juan Dela Cruz" value={form.name} onChange={handleChange} />
                                    </div>
                                    <label htmlFor="ad">Address</label>
                                    <div className="stl-field">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                                        <input id="ad" name="address" autoComplete="street-address" placeholder="Example: Dacanlao, City of Calaca, Batangas" value={form.address} onChange={handleChange} />
                                    </div>
                                    <p className="stl-hint">Include your barangay, municipality and province.</p>
                                </>
                            )}

                            <label htmlFor="em">Email (Gmail)</label>
                            <div className="stl-field">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
                                <input id="em" name="email" type="email" autoComplete="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange} />
                            </div>

                            <label htmlFor="pw">Password</label>
                            <div className="stl-field">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
                                <input id="pw" name="password" type={showPw ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} placeholder="Enter your password" value={form.password} onChange={handleChange} />
                                <button type="button" className="stl-eye" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                                    {showPw
                                        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4.5 9.5 6a15 15 0 01-3 3.5M6.5 7.8A15 15 0 002.5 12c1 1.5 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.9M9.9 9.9a3 3 0 004.2 4.2" /></svg>
                                        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12C3.5 10.5 7 6 12 6s8.5 4.5 9.5 6c-1 1.5-4.5 6-9.5 6S3.5 13.5 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>}
                                </button>
                            </div>

                            {registering && otpEmail === form.email.trim().toLowerCase() && (
                                <>
                                    <label htmlFor="otp">6-digit OTP from Gmail</label>
                                    <div className="stl-field">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                                        <input id="otp" type="text" inputMode="numeric" maxLength={6}
                                            autoComplete="one-time-code" placeholder="Enter OTP"
                                            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                                    </div>
                                    <p className="stl-hint">Code expires after 5 minutes.</p>
                                    <button type="button" className="ghost stl-resend" disabled={busy} onClick={async () => {
                                        setBusy(true);
                                        setError('');
                                        try {
                                            await call('/student/send-otp', send('POST', { email: otpEmail }));
                                            showToast('New OTP sent to your Gmail.');
                                        } catch (e) { setError(e.message); }
                                        finally { setBusy(false); }
                                    }}>Resend OTP</button>
                                </>
                            )}

                            {error && <div className="stl-err" role="alert">{error}</div>}

                            <button className="stl-submit" type="submit"
                                disabled={busy || (registering && otpEmail === form.email.trim().toLowerCase() && otp.length !== 6)}>
                                {busy
                                    ? <><i className="stl-spin" />Please wait...</>
                                    : registering ? (otpEmail ? 'Verify OTP & Create account' : 'Send OTP to Gmail') : 'Log in'}
                            </button>
                        </form>

                        <p className="stl-foot">
                            Are you an SK officer?{' '}
                            <button type="button" onClick={() => { window.location.href = '/sk.html'; }}>SK login</button>
                        </p>
                    </div>
                </section>

            </main>
        </div>
    )
}

// Main page para mag-apply at mag-upload.

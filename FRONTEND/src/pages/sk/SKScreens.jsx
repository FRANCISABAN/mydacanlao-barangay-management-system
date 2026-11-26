import { useState } from 'react';
import { SKLogo } from '../../components/sk/SKSidebarAndUI';
import { call, send } from '../../components/sk/skFunctions';

// Login ng SK account.
// SK login only. (Student login and sign up are in StudentLoginPage.jsx)
// WBS 3.1.6 [Frontend] Implement SK role-based access permissions
function SKLoginPage({ onLoggedIn }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = form.email.trim().toLowerCase();
        const password = form.password;

        if (!email || !password) {
            setError('Fill in all the fields to continue.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Enter a valid email, like you@gmail.com.');
            return;
        }
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            const data = await call('/sk/login', send('POST', { email, password }));
            onLoggedIn({ role: 'sk', dbId: data.message.id, name: data.message.name, email: data.message.email });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    }

    return (
        <div className="skl role-sk">

            {/* Background: malabong kulay ng logo (asul, dilaw, pula) */}
            <div className="skl-bg" aria-hidden="true"><span /><span /><span /></div>

            <button type="button" className="skl-back" onClick={() => { window.location.href = '/student.html'; }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                Back to home
            </button>

            <main className="skl-card">

                {/* Kaliwa: logo at maikling paliwanag */}
                <section className="skl-hero">
                    <div className="skl-logowrap"><SKLogo className="skl-logo" /></div>
                    <p className="skl-eyebrow">Sangguniang Kabataan &middot; Brgy. Dacanlao</p>
                    <h1>SK Console</h1>
                    <p className="skl-sub">Scholarship management for SK officers.</p>

                    <ul className="skl-points">
                        <li>
                            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg></span>
                            Review student applications
                        </li>
                        <li>
                            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg></span>
                            Validate every requirement
                        </li>
                        <li>
                            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg></span>
                            Notify students by email
                        </li>
                    </ul>

                    <div className="skl-strip" aria-hidden="true" />
                </section>

                {/* Kanan: login form */}
                <section className="skl-form">
                    <span className="skl-chip">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
                        SK officers only
                    </span>
                    <h2>Welcome back</h2>
                    <p className="skl-mut">Log in with the SK account to continue.</p>

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="em">Email</label>
                        <div className="skl-field">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
                            <input id="em" name="email" type="email" autoComplete="email" placeholder="sk@gmail.com" value={form.email} onChange={handleChange} />
                        </div>

                        <label htmlFor="pw">Password</label>
                        <div className="skl-field">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
                            <input id="pw" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={handleChange} />
                            <button type="button" className="skl-eye" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                                {showPw
                                    ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4.5 9.5 6a15 15 0 01-3 3.5M6.5 7.8A15 15 0 002.5 12c1 1.5 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.9M9.9 9.9a3 3 0 004.2 4.2" /></svg>
                                    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12C3.5 10.500 7 6 12 6s8.5 4.5 9.5 6c-1 1.5-4.5 6-9.5 6S3.5 13.5 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>}
                            </button>
                        </div>

                        {error && <div className="skl-err" role="alert">{error}</div>}

                        <button className="skl-submit" type="submit" disabled={busy}>
                            {busy ? <><i className="skl-spin" />Logging in...</> : 'Log in'}
                        </button>
                    </form>

                    <p className="skl-foot">
                        Are you a student?{' '}
                        <button type="button" onClick={() => { window.location.href = '/student.html'; }}>Student login</button>
                    </p>
                </section>

            </main>
        </div>
    )
}

/* ===== reviewing an application (backend: /sk/applications) ===== */
    // saves the review in the backend, then loads the lists again. Gives back true when it worked.
    // WBS 3.1.2 [Frontend] Review and validate scholarship requirements
    const saveReview = async (path, body, method = 'PUT') => {
        try {
            await call(path, send(method, body));
        } catch (e) {
            showToast(e.message);
            return false;
        }
        await loadRemote();
        return true;
    }

    // The student gets ONE email, only when every document of the application has been reviewed
    // (each one is either "Valid" or "Needs revision"). Marking a single document sends nothing.
    // `newStatus` and `newNote` are the document that was just saved (the app on screen is not updated yet).
    // WBS 3.1.5 [Frontend] Manage in-system and email notifications
    const emailWhenReviewed = (app, req, newStatus, newNote) => {
        const list = requirementsOf(app, scholarships).map((r) => {
            const doc = r === req ? { status: newStatus, note: newNote } : app.reqs[r];
            return { name: r, status: doc?.status, note: doc?.note || '' };
        });

        // still waiting for the SK to review something (or the student has not uploaded it)
        if (list.some((d) => d.status !== 'Valid' && d.status !== 'Revise')) {
            showToast('Saved. The student is emailed once every document is reviewed.');
            return;
        }

        const valid = list.filter((d) => d.status === 'Valid');
        const revise = list.filter((d) => d.status === 'Revise');

        if (!revise.length) {
            notify([app.uid], 'All your documents are validated', `Every document for ${titleOf(app)} passed validation:\n- ${valid.map((d) => d.name).join('\n- ')}`);
            return;
        }

        let text = `The SK finished reviewing your documents for ${titleOf(app)}.`;
        if (valid.length) text += `\n\nValid:\n- ${valid.map((d) => d.name).join('\n- ')}`;
        text += `\n\nNeeds revision:\n- ${revise.map((d) => d.note ? `${d.name} (${d.note})` : d.name).join('\n- ')}`;
        text += '\n\nPlease log in and upload a corrected copy of each document that needs revision.';
        notify([app.uid], 'Your documents were reviewed', text);
    }

    // WBS 3.1.2 [Frontend] Review and validate scholarship requirements
    const handleValid = async (app, req) => {
        if (!await saveReview(`/sk/applications/${app.id}/documents`, { requirement: req, status: 'Valid' })) return;
        emailWhenReviewed(app, req, 'Valid', '');
    }

    // WBS 3.1.3 [Frontend] Manage scholarship requirement resubmissions
    const handleRevise = async (app, req, note) => {
        if (!await saveReview(`/sk/applications/${app.id}/documents`, { requirement: req, status: 'Revise', note })) return;
        emailWhenReviewed(app, req, 'Revise', note);
    }

    // WBS 3.1.4 [Frontend] Manage scholarship application statuses and decisions
    const handleReject = async (app, note) => {
        if (!await saveReview(`/sk/applications/${app.id}/reject`, { note })) return;
        notify([app.uid], 'Application not approved', `Your application for ${titleOf(app)} was not accepted. Reason: ${note}`);
    }

    const handleApprove = async (app) => {
        if (requirementsOf(app, scholarships).some((r) => !app.reqs[r] || app.reqs[r].status === 'Revise')) {
            showToast('Cannot approve yet. A document is missing or needs revision.');
            return;
        }

        if (!await saveReview(`/sk/applications/${app.id}/approve`, {})) return;
        setOpenAppId(null);
        notify([app.uid], 'Application approved', `Congratulations! Your application for ${titleOf(app)} was accepted.`);
    }

    // an image opens in the viewer, a PDF opens in a new tab
    // WBS 3.1.2 [Frontend] Review and validate scholarship requirements
    const handleZoom = async (app, req) => {
        const upload = app.reqs[req];

        if (upload?.img) {
            setZoom({ appId: app.id, req });
            return;
        }
        if (upload?.type !== 'application/pdf') {
            showToast('This file cannot be previewed.');
            return;
        }

        const tab = window.open('', '_blank');
        try {
            const data = await call(`/sk/documents/${upload.id}/file`);
            const blob = await (await fetch(data.message.file_data)).blob();
            const url = URL.createObjectURL(blob);
            if (tab) tab.location.href = url;
            else showToast('Allow pop-ups to open the PDF.');
        } catch (e) {
            if (tab) tab.close();
            showToast(e.message);
        }
    }

    const zoomApp = zoom ? apps.find((a) => a.id === zoom.appId) : null;
    const zoomUpload = zoomApp?.reqs[zoom.req];

{tab === 'apps' && (
    <SKApplicationList
        apps={submitted}
        scholarships={scholarships}
        students={students}
        schFilter={schFilter}
        status={status}
        query={query}
        onStatus={setStatus}
        onQuery={setQuery}
        onClearSch={() => setSchFilter(null)}
        onReview={setOpenAppId}
    />
)}
{tab === 'students' && (
    <SKStudentList
        students={students}
        apps={apps}
        scholarships={scholarships}
        query={studentQuery}
        onQuery={setStudentQuery}
    />
)}

            {openApp && (
                <SKReviewDrawer onClose={() => setOpenAppId(null)}>
                    <SKReviewPanel
                        key={openApp.id}
                        app={openApp}
                        student={studentOf(students, openApp.uid)}
                        scholarshipTitle={titleOf(openApp)}
                        reqs={requirementsOf(openApp, scholarships)}
                        showToast={showToast}
                        onClose={() => setOpenAppId(null)}
                        onZoom={(req) => handleZoom(openApp, req)}
                        onValid={(req) => handleValid(openApp, req)}
                        onRevise={(req, note) => handleRevise(openApp, req, note)}
                        onReject={(note) => handleReject(openApp, note)}
                        onApprove={() => handleApprove(openApp)}
                    />
                </SKReviewDrawer>
            )}

            {zoomUpload?.img && (
                <SKLightbox
                    req={zoom.req}
                    upload={zoomUpload}
                    studentName={studentOf(students, zoomApp.uid).name}
                    onClose={() => setZoom(null)}
                />
            )}
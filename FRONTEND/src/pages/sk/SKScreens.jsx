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

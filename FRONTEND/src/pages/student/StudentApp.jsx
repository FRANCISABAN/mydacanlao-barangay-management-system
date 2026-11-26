  // WBS 4.1.1 [Frontend] Implement student account registration
  // WBS 4.1.2 [Frontend] Implement student login and logout
  const handleLoggedIn = (account, token) => {
    saveSession(token, account);
    setMe(account);
    setView('student');
  }

  // WBS 4.1.2 [Frontend] Implement student login and logout
  const handleLogout = async () => {
    try { await call('/student/logout', send('POST', {})); } catch { /* the session is removed here anyway */ }
    saveSession();
    setMe(null);
    setApps([]);
    setNotifications([]);
    setView('landing');
  }

  return (
    <>

      {view === 'landing' && (
        <StudentLandingPage
          scholarships={scholarships}
          studentCount={students.length}
          approvedCount={approvedCount}
          onLogin={() => { setView('login'); window.scrollTo(0, 0); }}
        />
      )}

      {view === 'login' && (
        <StudentLoginPage onBack={() => setView('landing')} onLoggedIn={handleLoggedIn} showToast={showToast} />
      )}

      {view === 'student' && me && (
        <StudentPage
          me={me}
          scholarships={scholarships}
          apps={apps}
          notifications={notifications}
          notify={notify}
          showToast={showToast}
          loadRemote={loadRemote}
          onLogout={handleLogout}
        />
      )}

      {toast && <StudentToast key={toast.id} message={toast} onClose={closeToast} />}

    </>
  )
}

export default StudentApp;

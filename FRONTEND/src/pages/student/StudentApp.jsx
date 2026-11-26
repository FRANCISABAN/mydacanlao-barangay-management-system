  // WBS 4.1.1 [Frontend] Implement student account registration
  // WBS 4.1.2 [Frontend] Implement student login and logout
  const handleLoggedIn = (account, token) => {
    saveSession(token, account);
    setMe(account);
    setView('student');
  }


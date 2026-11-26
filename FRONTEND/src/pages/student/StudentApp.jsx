import { useState, useEffect, useCallback } from 'react'
import { StudentLandingPage, StudentLoginPage, StudentPage } from './StudentScreens'
import { StudentToast } from '../../components/student/StudentHeaderAndHome'
import { call, send, toScholarship, notifyStudents, getSavedStudent, saveSession } from '../../components/student/studentFunctions'
import '../../components/student/student-base.css'
import '../../components/student/student-animations.css'
import '../../components/student/student-landing.css'
import '../../components/student/student-forms.css'
import '../../components/student/student-home.css'
import '../../components/student/student-login.css'

// The student site (student.html): landing page -> student login / sign up -> student pages.
function StudentApp() {

  // a student who is still logged in (saved in sessionStorage) goes straight to the student pages
  const [me, setMe] = useState(null);
  const [view, setView] = useState(me ? 'student' : 'landing');

  const [scholarships, setScholarships] = useState([]);
  const [students, setStudents] = useState([]);
  const [apps, setApps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  // everything comes from the backend. A student gets only their own applications.
  // WBS 4.2.1 [Frontend] View available scholarships and create applications
  // WBS 4.4.1 [Frontend] Display scholarship notifications and email updates
  // WBS 4.4.2 [Frontend] Track scholarship application and requirement statuses
  const loadRemote = useCallback(async () => {
    try {
      const studentList = await call('/student/all');
      setStudents(studentList);
    } catch (e) {
      if (e.status === 401) {
        // the session ended (example: the backend was restarted): go back to the landing page
        saveSession();
        setMe(null);
        setView('landing');
      }
      showToast(e.message);
    }
  }, [showToast, me]);

  // loads again when the page opens and when the student logs in or out
  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  // WBS 4.4.1 [Frontend] Display scholarship notifications and email updates
  const notify = (emails, subject, text) => showToast(text);

  // WBS 4.1.1 [Frontend] Implement student account registration
  // WBS 4.1.2 [Frontend] Implement student login and logout
  const handleLoggedIn = (account, token) => {
    saveSession();
    setMe(null);
    setView('landing');
    showToast('Account created successfully.');
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

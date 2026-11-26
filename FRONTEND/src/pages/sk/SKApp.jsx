import { useState, useEffect, useCallback } from 'react'
import { SKLoginPage, SKPage } from './SKScreens'
import { SKToast } from '../../components/sk/SKSidebarAndUI'
import { call, toScholarship, notifyStudents } from '../../components/sk/skFunctions'
import '../../components/sk/sk-base.css'
import '../../components/sk/sk-animations.css'
import '../../components/sk/sk-layout.css'
import '../../components/sk/sk-header.css'
import '../../components/sk/sk-dashboard.css'
import '../../components/sk/sk-theme.css'
import '../../components/sk/sk-login.css'

// The SK site (sk.html): SK login -> SK pages. SK accounts are made in the database, so there is no sign up.
function SKApp() {

  const [me, setMe] = useState(null);

  const [scholarships, setScholarships] = useState([]);
  const [students, setStudents] = useState([]);
  const [apps, setApps] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  // everything comes from the backend. The SK gets all the applications.
  // WBS 3.1.1 [Frontend] Display, search, and view scholarship applications
  // WBS 3.1.7 [Frontend] Create and publish scholarship programs
  const loadRemote = useCallback(async () => {
    try {
      const requests = [
        call('/sk/scholarship/all'),
        call('/student/all'),
      ];
      if (me) requests.push(call('/sk/applications'));

      const [scholarshipList, studentList, applicationList] = await Promise.all(requests);
      setScholarships(scholarshipList.map(toScholarship));
      setStudents(studentList);
      setApps(applicationList || []);
    } catch (e) {
      showToast(e.message);
    }
  }, [showToast, me]);

  // loads again when the page opens and when the SK logs in or out
  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  // WBS 3.1.5 [Frontend] Manage in-system and email notifications
  const notify = (emails, subject, text) => notifyStudents(students, emails, subject, text, showToast);

  return (
    <>

      {!me && <SKLoginPage onLoggedIn={setMe} />}

      {me && (
        <SKPage
          me={me}
          scholarships={scholarships}
          students={students}
          apps={apps}
          notify={notify}
          showToast={showToast}
          loadRemote={loadRemote}
          onLogout={() => { setMe(null); setApps([]); }}
        />
      )}

      {toast && <SKToast key={toast.id} message={toast} onClose={closeToast} />}

    </>
  )
}

export default SKApp;
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
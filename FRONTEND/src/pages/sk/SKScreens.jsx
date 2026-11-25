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
import React, { useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import JobCard from '../components/JobCard.jsx'

export default function ApplicationStatus() {
  const { jobs, applicantApplications, fetchApplicantData, applicantAuth } = useApp()

  // Refresh applications data when component mounts or when logged in
  useEffect(() => {
    if (applicantAuth.isLoggedIn && fetchApplicantData) {
      fetchApplicantData()
    }
  }, [applicantAuth.isLoggedIn, fetchApplicantData])

  const appliedJobs = useMemo(() => {
    return jobs.filter(j => {
      // Check both number and string keys
      return applicantApplications[j.id] || applicantApplications[String(j.id)]
    })
  }, [jobs, applicantApplications])
  const list = appliedJobs
  const appliedCount = appliedJobs.length

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-100">Application Status</h2>

        <div className="mt-4 text-gray-400">
          Applied Jobs ({appliedCount})
        </div>

        <div className="mt-6 grid gap-4">
          {list.length === 0 ? (
            <div className="text-zinc-400">
              No applied jobs yet.
            </div>
          ) : (
            list.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isApplied={!!applicantApplications[job.id]}
                isSaved={false}
                onApply={() => { /* no-op, already applied or will navigate back to listing if needed */ }}
                onToggleSave={() => {}}
              />
            ))
          )}
        </div>

      </div>
    </section>
  )
}

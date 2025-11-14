import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import JobCard from '../components/JobCard.jsx'

export default function ApplicationStatus() {
  const { jobs, applicantAuth, applicantApplications, applicantSavedJobs, toggleSaveJob, fetchApplicantData } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('applied') // 'applied' | 'saved'
  const [toast, setToast] = useState('')

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
  const savedJobs = useMemo(() => {
    // Sort by most recent saved using timestamps in map; fallback to original order
    const withTs = jobs
      .filter(j => applicantSavedJobs[j.id] || applicantSavedJobs[String(j.id)])
      .map(j => ({ 
        job: j, 
        ts: applicantSavedJobs[j.id] || applicantSavedJobs[String(j.id)] || 0 
      }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .map(x => x.job)
    return withTs
  }, [jobs, applicantSavedJobs])

  const list = tab === 'applied' ? appliedJobs : savedJobs
  const appliedCount = appliedJobs.length
  const savedCount = savedJobs.length

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-100">Application Status</h2>

        <div className="mt-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <button
            className={`px-4 py-2 text-sm ${tab === 'applied' ? 'bg-white text-black' : 'text-zinc-300 hover:text-white'}`}
            onClick={() => setTab('applied')}
          >
            Applied Jobs ({appliedCount})
          </button>
          <button
            className={`px-4 py-2 text-sm ${tab === 'saved' ? 'bg-white text-black' : 'text-zinc-300 hover:text-white'}`}
            onClick={() => setTab('saved')}
          >
            Saved Jobs ({savedCount})
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {list.length === 0 ? (
            <div className="text-zinc-400">
              {tab === 'applied' ? 'No applied jobs yet.' : 'No saved jobs yet.'}
            </div>
          ) : (
            list.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isApplied={!!applicantApplications[job.id]}
                isSaved={!!applicantSavedJobs[job.id]}
                onApply={() => { /* no-op, already applied or will navigate back to listing if needed */ }}
                onToggleSave={() => {
                  if (!applicantAuth.isLoggedIn) {
                    const qs = new URLSearchParams({ redirect: window.location.pathname + window.location.search }).toString()
                    navigate(`/login/applicant?${qs}`)
                    return
                  }
                  toggleSaveJob(job.id)
                  const nowSaved = !applicantSavedJobs[job.id]
                  setToast(nowSaved ? 'Saved to your list' : 'Removed from saved')
                  setTimeout(() => setToast(''), 1200)
                }}
              />
            ))
          )}
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white text-black rounded-lg px-4 py-2 shadow">
            {toast}
          </div>
        )}
      </div>
    </section>
  )
}

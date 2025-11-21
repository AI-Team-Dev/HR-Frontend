import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import CandidateCard from '../components/CandidateCard.jsx'

// Score filter ranges
const SCORE_FILTERS = [
  { id: 'all', label: 'All Candidates', min: 0, max: 100 },
  { id: '80+', label: '> 80%', min: 80, max: 100 },
  { id: '70-80', label: '70-80%', min: 70, max: 80 },
  { id: '60-70', label: '60-70%', min: 60, max: 70 },
  { id: '50-60', label: '50-60%', min: 50, max: 60 },
  { id: '40-50', label: '40-50%', min: 40, max: 50 },
  { id: '30-40', label: '30-40%', min: 30, max: 40 },
  { id: '<30', label: '< 30%', min: 0, max: 30 },
]

export default function AppliedCandidates() {
  const { jobs, fetchApplicationsForJob, auth } = useApp()
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  // Filter jobs to only show those with applications (for HR)
  const jobsWithApplications = useMemo(() => {
    return jobs.filter(job => job.enabled !== false)
  }, [jobs])

  // Set initial selected job
  useEffect(() => {
    if (jobsWithApplications.length > 0 && !selectedJobId) {
      setSelectedJobId(jobsWithApplications[0].id)
    }
  }, [jobsWithApplications, selectedJobId])

  // Fetch applications when job is selected
  useEffect(() => {
    if (!selectedJobId) return

    const loadApplications = async () => {
      setLoading(true)
      setError('')
      const result = await fetchApplicationsForJob(selectedJobId)
      if (result.ok) {
        setApplications(result.data || [])
      } else {
        setError(result.message || 'Failed to load applications')
        setApplications([])
      }
      setLoading(false)
    }

    loadApplications()
  }, [selectedJobId, fetchApplicationsForJob])

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    const filter = SCORE_FILTERS.find(f => f.id === selectedFilter)
    if (!filter) return []

    const filtered = applications.filter(app => {
      const score = app.matchScore || app.score || 0
      return score >= filter.min && score < filter.max
    })

    // Sort by score descending
    return filtered.sort((a, b) => {
      const scoreA = a.matchScore || a.score || 0
      const scoreB = b.matchScore || b.score || 0
      return scoreB - scoreA
    })
  }, [applications, selectedFilter])

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate)
  }

  const closeModal = () => {
    setSelectedCandidate(null)
  }

  if (!auth.isLoggedIn || auth.role !== 'HR') {
    return (
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-zinc-400">
            <p>You must be logged in as HR to view this page.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Applied Candidates</h1>
          <p className="mt-2 text-zinc-400">Review and manage candidate applications by job posting</p>
        </div>

        {jobsWithApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">No Job Postings</h3>
            <p className="mt-1 text-sm text-zinc-400">Create job postings to start receiving applications</p>
          </div>
        ) : (
          <>
            {/* Job Tabs */}
            <div className="mb-6">
              <div className="border-b border-zinc-800">
                <div className="flex gap-2 overflow-x-auto pb-px scrollbar-hide">
                  {jobsWithApplications.map(job => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                        selectedJobId === job.id
                          ? 'border-white text-white'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>JD #{job.id}</span>
                        <span className="text-xs opacity-75">• {job.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Filters */}
            <div className="mb-6 bg-zinc-900/50 rounded-xl p-4 ring-1 ring-zinc-800">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-zinc-400">Filter by Match Score:</span>
                <div className="flex gap-2 flex-wrap">
                  {SCORE_FILTERS.map(filter => {
                    const count = applications.filter(app => {
                      const score = app.matchScore || app.score || 0
                      return score >= filter.min && score < filter.max
                    }).length

                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedFilter === filter.id
                            ? 'bg-white text-black ring-2 ring-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ring-1 ring-zinc-700'
                        }`}
                      >
                        {filter.label}
                        {count > 0 && (
                          <span className={`ml-1.5 text-xs ${selectedFilter === filter.id ? 'text-black/70' : 'text-zinc-500'}`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-4 text-zinc-400">Loading candidates...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="rounded-lg border border-red-600/40 bg-red-950/50 text-red-200 px-4 py-3">
                {error}
              </div>
            )}

            {/* Candidates Grid */}
            {!loading && !error && (
              <div>
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/30 rounded-xl ring-1 ring-zinc-800">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">No Candidates Found</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {selectedFilter === 'all' 
                        ? 'No applications received for this job yet' 
                        : 'No candidates match the selected score range'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-zinc-400">
                        Showing <span className="font-semibold text-white">{filteredCandidates.length}</span> candidate{filteredCandidates.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M2.25 4.125c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875V17.25a4.5 4.5 0 1 1-9 0V4.125Zm4.5 14.25a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
                          <path d="M10.719 21.75h9.156c1.036 0 1.875-.84 1.875-1.875v-5.25c0-1.036-.84-1.875-1.875-1.875h-.14l-8.742 8.743c-.09.089-.18.175-.274.257ZM12.738 17.625l6.474-6.474a1.875 1.875 0 0 0 0-2.651L15.5 4.787a1.875 1.875 0 0 0-2.651 0l-.1.099V17.25c0 .126-.003.251-.01.375Z" />
                        </svg>
                        Sorted by match score (highest first)
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredCandidates.map((candidate, index) => (
                        <CandidateCard
                          key={candidate.id || index}
                          candidate={candidate}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-zinc-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Candidate Profile</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-zinc-400">Name:</span> <span className="text-white ml-2">{selectedCandidate.fullName || 'N/A'}</span></div>
                  <div><span className="text-zinc-400">Email:</span> <span className="text-white ml-2">{selectedCandidate.email || 'N/A'}</span></div>
                  <div><span className="text-zinc-400">Phone:</span> <span className="text-white ml-2">{selectedCandidate.phone || 'N/A'}</span></div>
                  <div><span className="text-zinc-400">Location:</span> <span className="text-white ml-2">{selectedCandidate.currentLocation || 'N/A'}</span></div>
                </div>
              </div>

              {/* Education */}
              {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Education</h3>
                  <div className="space-y-2">
                    {selectedCandidate.education.map((edu, idx) => (
                      <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-white">{edu.degree}</div>
                        <div className="text-zinc-400">{edu.institution}</div>
                        {edu.cgpa && <div className="text-zinc-500 text-xs mt-1">CGPA: {edu.cgpa}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedCandidate.experiences && selectedCandidate.experiences.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Experience</h3>
                  <div className="space-y-2">
                    {selectedCandidate.experiences.map((exp, idx) => (
                      <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-white">{exp.role}</div>
                        <div className="text-zinc-400">{exp.company}</div>
                        <div className="text-zinc-500 text-xs mt-1">{exp.startMonth} - {exp.isCurrent ? 'Present' : exp.endMonth}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedCandidate.resumeFileName && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Resume</h3>
                  <a href={selectedCandidate.resumeUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    {selectedCandidate.resumeFileName}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

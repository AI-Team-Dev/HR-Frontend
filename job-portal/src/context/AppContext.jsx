import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest, setUnauthorizedHandler } from '../utils/api'
import { tokenService } from '../utils/tokenService'

// App state: jobs and auth via backend
const AppContext = createContext(null)

const STORAGE_KEYS = {
  auth: 'authState',
  applicantAuth: 'applicantAuthState',
  applicantProfile: 'applicantProfileState',
  applicantApplications: 'applicantApplicationsState',
  applicantSavedJobs: 'applicantSavedJobsState',
  jobs: 'jobsState',
  user: 'authUser',
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  if (typeof date === 'string') return date
  const d = date || new Date()
  return d.toISOString().split('T')[0]
}

// Helper functions for localStorage
const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (err) {
    console.warn('Failed to parse storage key', key, err)
    return fallback
  }
}

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn('Failed to persist storage key', key, err)
  }
}

export function AppProvider({ children }) {
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState('')

  const defaultAuth = { isLoggedIn: false, role: null, email: '' }
  const defaultApplicantAuth = { isLoggedIn: false, email: '' }
  const defaultApplicantProfile = {
    experienceLevel: '',
    servingNotice: '',
    fullName: '',
    email: '',
    phone: '',
    noticePeriod: '',
    lastWorkingDay: '',
    linkedinUrl: '',
    portfolioUrl: '',
    currentLocation: '',
    preferredLocation: '',
    resumeFileName: '',
    education: [], // [{ degree, institution, year }]
    certifications: [], // [{ name, issuer, year }]
    experiences: [], // [{ company, role, years }]
    completed: false,
  }

  const [auth, setAuth] = useState(() => readJson(STORAGE_KEYS.auth, defaultAuth))
  const [applicantAuth, setApplicantAuth] = useState(() => readJson(STORAGE_KEYS.applicantAuth, defaultApplicantAuth))
  const [token, setToken] = useState('')
  const [user, setUser] = useState(() => readJson(STORAGE_KEYS.user, null))
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [applicantProfile, setApplicantProfile] = useState(() => readJson(STORAGE_KEYS.applicantProfile, defaultApplicantProfile))
  const [applicantApplications, setApplicantApplications] = useState(() => readJson(STORAGE_KEYS.applicantApplications, {})) // jobId -> true
  const [applicantSavedJobs, setApplicantSavedJobs] = useState(() => readJson(STORAGE_KEYS.applicantSavedJobs, {})) // jobId -> true

  useEffect(() => {
    // Wire global 401 -> logout handling
    setUnauthorizedHandler(() => logout())
    // If migrating to HttpOnly cookies in production:
    // - Have the backend set a SameSite=Lax, Secure HttpOnly cookie on login
    // - Remove Authorization header usage and token persistence here
    // - Rely on credentials: 'include' already set in api.js
    // - Ensure CORS allows credentials and your frontend domain
    // Note: keep tokenService empty or disabled when using HttpOnly cookies.
  }, [])

  // Initialize token from tokenService so it survives reloads via persistence
  useEffect(() => {
    const existing = tokenService.getToken()
    if (existing) setToken(existing)
  }, [])

  useEffect(() => {
    // Keep in-memory token in sync if any flows setToken elsewhere
    tokenService.setToken(token)
  }, [token])

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeJson(STORAGE_KEYS.auth, auth)
  }, [auth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeJson(STORAGE_KEYS.applicantAuth, applicantAuth)
  }, [applicantAuth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeJson(STORAGE_KEYS.applicantProfile, applicantProfile)
  }, [applicantProfile])

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeJson(STORAGE_KEYS.applicantApplications, applicantApplications)
  }, [applicantApplications])

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeJson(STORAGE_KEYS.applicantSavedJobs, applicantSavedJobs)
  }, [applicantSavedJobs])

  // Do not persist jobs; source of truth is backend

  // Persist user only (token is kept in-memory for security)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user) writeJson(STORAGE_KEYS.user, user)
    else window.localStorage.removeItem(STORAGE_KEYS.user)
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hydrateFromStorage = () => {
      setAuth((prev) => {
        const stored = readJson(STORAGE_KEYS.auth, defaultAuth)
        return JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored
      })
      setApplicantAuth((prev) => {
        const stored = readJson(STORAGE_KEYS.applicantAuth, defaultApplicantAuth)
        return JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored
      })
      setApplicantProfile((prev) => {
        const stored = readJson(STORAGE_KEYS.applicantProfile, defaultApplicantProfile)
        return JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored
      })
      setApplicantApplications((prev) => {
        const stored = readJson(STORAGE_KEYS.applicantApplications, {})
        return JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored
      })
      setApplicantSavedJobs((prev) => {
        const stored = readJson(STORAGE_KEYS.applicantSavedJobs, {})
        return JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored
      })
      // Do not hydrate token from storage
      setUser(() => readJson(STORAGE_KEYS.user, null))
    }

    hydrateFromStorage()

    const onStorage = (event) => {
      if (event.storageArea !== window.localStorage) return
      if (!event.key || Object.values(STORAGE_KEYS).includes(event.key)) {
        hydrateFromStorage()
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loginHR = async (email, password) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      if (data && data.token && data.user) {
        setToken(data.token)
        tokenService.setToken(data.token)
        setUser(data.user)
        const nextAuth = { isLoggedIn: true, role: 'HR', email: data.user.email || email }
        setAuth(nextAuth)
        writeJson(STORAGE_KEYS.auth, nextAuth)
        return { ok: true }
      }
      return { ok: false, message: 'Invalid response from server' }
    } catch (err) {
      setAuthError(err?.message || 'Login failed')
      return { ok: false, message: err?.message || 'Login failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch applications and saved jobs from backend
  const fetchApplicantData = async () => {
    if (!applicantAuth.isLoggedIn || !token) return
    try {
      const [applications, savedJobs] = await Promise.all([
        apiRequest('/api/applications', { method: 'GET', token }).catch(() => []),
        apiRequest('/api/applications/saved', { method: 'GET', token }).catch(() => [])
      ])
      
      // Convert applications array to map
      const applicationsMap = {}
      if (Array.isArray(applications)) {
        applications.forEach(app => {
          // Handle both jobId and job.id formats from backend
          const jobId = app.jobId || (app.job && app.job.id) || app.job_id
          if (jobId) {
            // Store as both number and string for compatibility
            applicationsMap[jobId] = true
            applicationsMap[String(jobId)] = true
          }
        })
      }
      setApplicantApplications(applicationsMap)
      writeJson(STORAGE_KEYS.applicantApplications, applicationsMap)

      // Convert saved jobs array to map
      const savedJobsMap = {}
      if (Array.isArray(savedJobs)) {
        savedJobs.forEach(job => {
          const jobId = job.id
          if (jobId) {
            savedJobsMap[jobId] = new Date(job.savedAt).getTime() || Date.now()
            savedJobsMap[String(jobId)] = new Date(job.savedAt).getTime() || Date.now()
          }
        })
      }
      setApplicantSavedJobs(savedJobsMap)
      writeJson(STORAGE_KEYS.applicantSavedJobs, savedJobsMap)
    } catch (err) {
      console.error('Fetch applicant data error:', err)
    }
  }

  const loginApplicant = async (idOrEmail, password) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const data = await apiRequest('/api/candidate/login', {
        method: 'POST',
        body: { email: idOrEmail, password },
      })
      if (data && data.token && data.user) {
        setToken(data.token)
        tokenService.setToken(data.token)
        setUser(data.user)
        const nextApplicantAuth = { isLoggedIn: true, email: data.user.email || idOrEmail }
        setApplicantAuth(nextApplicantAuth)
        writeJson(STORAGE_KEYS.applicantAuth, nextApplicantAuth)
        
        // Load profile from backend if available
        if (data.user.profile) {
          setApplicantProfile(data.user.profile)
          writeJson(STORAGE_KEYS.applicantProfile, data.user.profile)
        } else {
          setApplicantProfile((p) => {
            const nextProfile = { ...p, email: data.user.email || idOrEmail }
            writeJson(STORAGE_KEYS.applicantProfile, nextProfile)
            return nextProfile
          })
        }
        
        // Fetch applications and saved jobs
        setTimeout(() => fetchApplicantData(), 100)
        
        return { ok: true }
      }
      return { ok: false, message: 'Invalid response from server' }
    } catch (err) {
      setAuthError(err?.message || 'Login failed')
      return { ok: false, message: err?.message || 'Login failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  const signupApplicant = async ({ name, email, password }) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const data = await apiRequest('/api/candidate/signup', {
        method: 'POST',
        body: { name, email, password },
      })
      return { ok: true, data }
    } catch (err) {
      setAuthError(err?.message || 'Signup failed')
      return { ok: false, message: err?.message || 'Signup failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  const signupHR = async ({ fullName, email, password, company }) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const data = await apiRequest('/api/signup', {
        method: 'POST',
        body: { fullName, email, password, company },
      })
      return { ok: true, data }
    } catch (err) {
      setAuthError(err?.message || 'Signup failed')
      return { ok: false, message: err?.message || 'Signup failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  const saveApplicantProfile = async (profile) => {
    if (!applicantAuth.isLoggedIn) {
      // Save locally only if not logged in
      const next = { ...applicantProfile, ...profile }
      setApplicantProfile(next)
      writeJson(STORAGE_KEYS.applicantProfile, next)
      return { ok: true }
    }
    try {
      await apiRequest('/api/candidate/profile', {
        method: 'POST',
        body: profile,
        token
      })
      const next = { ...applicantProfile, ...profile }
      setApplicantProfile(next)
      writeJson(STORAGE_KEYS.applicantProfile, next)
      return { ok: true }
    } catch (err) {
      console.error('Save profile error:', err)
      // Fallback to local storage
      const next = { ...applicantProfile, ...profile }
      setApplicantProfile(next)
      writeJson(STORAGE_KEYS.applicantProfile, next)
      return { ok: true }
    }
  }

  const markApplicantProfileCompleted = async () => {
    const profileWithCompleted = { ...applicantProfile, completed: true }
    if (applicantAuth.isLoggedIn) {
      try {
        await apiRequest('/api/candidate/profile', {
          method: 'POST',
          body: profileWithCompleted,
          token
        })
      } catch (err) {
        console.error('Mark profile completed error:', err)
      }
    }
    setApplicantProfile((p) => {
      const next = { ...p, completed: true }
      writeJson(STORAGE_KEYS.applicantProfile, next)
      return next
    })
    return { ok: true }
  }

  const applyToJobAsApplicant = async (jobId) => {
    if (!applicantAuth.isLoggedIn) return { ok: false, reason: 'not_logged_in' }
    if (!applicantProfile.completed) return { ok: false, reason: 'profile_incomplete' }
    const hasResume = !!applicantProfile.resumeFileName
    const hasEducation = Array.isArray(applicantProfile.education) && applicantProfile.education.some(ed => ed.degree && ed.institution)
    if (!hasResume || !hasEducation) {
      return { ok: false, reason: 'profile_requirements_missing' }
    }
    try {
      await apiRequest('/api/applications', {
        method: 'POST',
        body: { jobId: parseInt(jobId) },
        token
      })
      setApplicantApplications((prev) => {
        const next = { ...prev }
        // Store as both number and string for compatibility
        next[jobId] = true
        next[String(jobId)] = true
        writeJson(STORAGE_KEYS.applicantApplications, next)
        return next
      })
      // Remove from saved when applied
      setApplicantSavedJobs((prev) => {
        if (!prev[jobId]) return prev
        const next = { ...prev }
        delete next[jobId]
        writeJson(STORAGE_KEYS.applicantSavedJobs, next)
        return next
      })
      // Refresh applications from backend to ensure sync
      setTimeout(() => fetchApplicantData(), 500)
      return { ok: true }
    } catch (err) {
      console.error('Apply error:', err)
      return { ok: false, message: err?.message || 'Failed to apply' }
    }
  }

  const toggleSaveJob = async (jobId) => {
    if (!applicantAuth.isLoggedIn) return { ok: false, reason: 'not_logged_in' }
    try {
      const res = await apiRequest(`/api/applications/save/${jobId}`, {
        method: 'POST',
        token
      })
      const isSaved = res.saved
      setApplicantSavedJobs((prev) => {
        const next = { ...prev }
        if (isSaved) {
          // Store as both number and string for compatibility
          next[jobId] = Date.now()
          next[String(jobId)] = Date.now()
        } else {
          delete next[jobId]
          delete next[String(jobId)]
        }
        writeJson(STORAGE_KEYS.applicantSavedJobs, next)
        return next
      })
      // Refresh saved jobs from backend to ensure sync
      setTimeout(() => fetchApplicantData(), 500)
      return { ok: true }
    } catch (err) {
      console.error('Toggle save job error:', err)
      // Fallback to local storage
      setApplicantSavedJobs((prev) => {
        const next = { ...prev }
        if (next[jobId] || next[String(jobId)]) {
          delete next[jobId]
          delete next[String(jobId)]
        } else {
          next[jobId] = Date.now()
          next[String(jobId)] = Date.now()
        }
        writeJson(STORAGE_KEYS.applicantSavedJobs, next)
        return next
      })
      return { ok: true }
    }
  }

  const logout = () => {
    setAuth(defaultAuth)
    setApplicantAuth(defaultApplicantAuth)
    setApplicantProfile(defaultApplicantProfile)
    setApplicantApplications({})
    setToken('')
    tokenService.clear()
    setUser(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.auth)
      window.localStorage.removeItem(STORAGE_KEYS.applicantAuth)
      window.localStorage.removeItem(STORAGE_KEYS.applicantProfile)
      window.localStorage.removeItem(STORAGE_KEYS.applicantApplications)
      window.localStorage.removeItem(STORAGE_KEYS.user)
    }
  }

  const getToken = () => token

  // Fetch jobs from backend
  const fetchJobs = async () => {
    setJobsLoading(true)
    setJobsError('')
    try {
      // If HR is logged in, fetch all jobs (including disabled)
      const endpoint = auth.isLoggedIn && auth.role === 'HR' ? '/api/jobs/all' : '/api/jobs'
      const data = await apiRequest(endpoint, { method: 'GET', token: auth.isLoggedIn ? token : undefined })
      if (Array.isArray(data)) setJobs(data)
      else if (data && Array.isArray(data.jobs)) setJobs(data.jobs)
      else setJobs([])
    } catch (err) {
      setJobsError(err?.message || 'Failed to load jobs')
    } finally {
      setJobsLoading(false)
    }
  }

  useEffect(() => {
    // Clear any legacy locally stored jobs to avoid showing mock data
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEYS.jobs)
      }
    } catch {}
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch jobs when auth state changes (to get all jobs for HR)
  useEffect(() => {
    if (auth.isLoggedIn || applicantAuth.isLoggedIn) {
      fetchJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoggedIn, applicantAuth.isLoggedIn])

  // Fetch applicant data when logged in
  useEffect(() => {
    if (applicantAuth.isLoggedIn && token) {
      fetchApplicantData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantAuth.isLoggedIn, token])

  // Admin: add a job (best-effort). If backend supports it, create and refresh list.
  const addJob = async (job) => {
    try {
      await apiRequest('/api/jobs', { method: 'POST', body: job, token })
      await fetchJobs()
    } catch (err) {
      console.error('Add job error:', err)
    }
  }

  const setJobEnabled = async (jobId, isEnabled) => {
    if (!token) {
      // Fallback to local update
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, enabled: isEnabled } : j)))
      return
    }
    try {
      await apiRequest(`/api/jobs/${jobId}/enabled`, {
        method: 'PATCH',
        body: { enabled: isEnabled },
        token
      })
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, enabled: isEnabled } : j)))
    } catch (err) {
      console.error('Set job enabled error:', err)
      // Fallback to local update
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, enabled: isEnabled } : j)))
    }
  }

  const updateJob = async (jobId, updates) => {
    if (!token) {
      // Fallback to local update
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)))
      return
    }
    try {
      const updated = await apiRequest(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: updates,
        token
      })
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...updated } : j)))
      await fetchJobs() // Refresh to get latest data
    } catch (err) {
      console.error('Update job error:', err)
      // Fallback to local update
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)))
    }
  }

  const value = useMemo(() => ({
    jobs,
    jobsLoading,
    jobsError,
    fetchJobs,
    addJob,
    setJobEnabled,
    updateJob,
    auth,
    authLoading,
    authError,
    loginHR,
    applicantAuth,
    applicantProfile,
    applicantApplications,
    applicantSavedJobs,
    loginApplicant,
    signupApplicant,
    signupHR,
    saveApplicantProfile,
    markApplicantProfileCompleted,
    applyToJobAsApplicant,
    toggleSaveJob,
    getToken,
    logout,
    user,
    fetchApplicantData,
  }), [jobs, jobsLoading, jobsError, auth, authLoading, authError, applicantAuth, applicantProfile, applicantApplications, applicantSavedJobs, user])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}



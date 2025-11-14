import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function SignupAdmin() {
    const { signupHR } = useApp()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [company, setCompany] = useState('')
    const [created, setCreated] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        const res = await signupHR({ fullName, email, password, company })
        if (res.ok) {
            setCreated(true)
        } else {
            setError(res.message || 'Registration failed')
        }
        setSubmitting(false)
    }

    return (
        <section className="relative min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-10 overflow-hidden">
            {/* Decorative background graphics */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="w-full max-w-xl relative">
                <div className="rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/50 p-[1px] shadow-2xl">
                    <div className="rounded-2xl bg-zinc-950/70 backdrop-blur-md p-6 sm:p-8">
                        <h2 className="text-2xl font-semibold text-white">Sign Up as Admin</h2>
                        <p className="mt-1 text-sm text-zinc-400">Create an HR/Admin account to manage jobs</p>
                        <form onSubmit={onSubmit} className="mt-6">
                            <label className="block text-sm font-medium text-zinc-300">Full Name (Admin)</label>
                            <input
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 text-gray-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/70 focus:border-emerald-600/70"
                                placeholder="Your name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                            <label className="block text-sm font-medium text-zinc-300 mt-4">Company</label>
                            <div className="mt-1 relative">
                                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500">
                                    {/* building icon */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" stroke="currentColor" strokeWidth="1.5" /></svg>
                                </span>
                                <input
                                    className="w-full bg-transparent border-0 border-b border-zinc-700 pl-7 pr-3 py-2.5 text-gray-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-white"
                                    placeholder="Company name"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    required
                                />
                            </div>
                            <label className="block text-sm font-medium text-zinc-300 mt-4">Work Email</label>
                            <div className="mt-1 relative">
                                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="1.5" /><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" /></svg>
                                </span>
                                <input
                                    type="email"
                                    className="w-full bg-transparent border-0 border-b border-zinc-700 pl-7 pr-3 py-2.5 text-gray-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-white"
                                    placeholder="hr@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <label className="block text-sm font-medium text-zinc-300 mt-4">Password</label>
                            <div className="mt-1 relative">
                                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>
                                </span>
                                <input
                                    type="password"
                                    className="w-full bg-transparent border-0 border-b border-zinc-700 pl-7 pr-3 py-2.5 text-gray-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`mt-6 w-full ${submitting ? 'bg-zinc-300' : 'bg-white hover:bg-zinc-100'} text-black font-medium py-2.5 rounded-lg transition-colors shadow-sm hover:shadow`}
                            >
                                {submitting ? 'Creating...' : 'Create Admin Account'}
                            </button>
                            {created && (
                                <div className="mt-3 text-sm text-green-400">Admin account created. You can log in from the Admin section.</div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}



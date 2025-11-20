import React, { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import MonthYearPicker from '../components/MonthYearPicker.jsx'

export default function ApplicantProfile() {
	const { applicantProfile, saveApplicantProfile, markApplicantProfileCompleted, applyToJobAsApplicant, fetchApplicantData } = useApp()
	const navigate = useNavigate()
	const location = useLocation()
  const firstErrorRef = useRef(null)

	const [form, setForm] = useState({
		experienceLevel: applicantProfile.experienceLevel || '',
		servingNotice: applicantProfile.servingNotice || '',
		noticePeriod: applicantProfile.noticePeriod || '',
		lastWorkingDay: applicantProfile.lastWorkingDay || '',
		fullName: applicantProfile.fullName || '',
		email: applicantProfile.email || '',
		phone: applicantProfile.phone || '',
		linkedinUrl: applicantProfile.linkedinUrl || '',
		portfolioUrl: applicantProfile.portfolioUrl || '',
		currentLocation: applicantProfile.currentLocation || '',
		preferredLocation: applicantProfile.preferredLocation || '',
		resumeFile: null, // Store the actual file object
		resumeFileName: applicantProfile.resumeFileName || '',
		education: applicantProfile.education.length ? applicantProfile.education : [{ degree: '', institution: '', cgpa: '', startMonth: '', endMonth: '' }],
		certifications: applicantProfile.certifications && applicantProfile.certifications.length ? applicantProfile.certifications : [{ name: '', issuer: '', validTill: '', validationUrl: '', status: '' }],
		experiences: applicantProfile.experiences.length ? applicantProfile.experiences : [{ company: '', role: '', startMonth: '', endMonth: '', isCurrent: false }],
	})
	const [saved, setSaved] = useState('')
	const [errors, setErrors] = useState({})

	const validate = (f) => {
		const e = {}
		if (!f.fullName?.trim()) e.fullName = 'Full name is required'
		if (!f.email?.trim()) e.email = 'Email is required'
		if (!f.phone?.trim()) e.phone = 'Phone is required'
		if (!f.currentLocation?.trim()) e.currentLocation = 'Current location is required'
		if (!f.preferredLocation?.trim()) e.preferredLocation = 'Preferred location is required'
		if (!f.resumeFileName) e.resumeFileName = 'Resume is required'
		const hasEducation = Array.isArray(f.education) && f.education.some(ed => ed.degree?.trim() && ed.institution?.trim())
		if (!hasEducation) {
			e.education = 'At least one education entry with Degree and Institution is required'
		} else {
			// Check for 10th standard
			const has10th = f.education.some(ed => 
				ed.degree?.toLowerCase().includes('10') || 
				ed.degree?.toLowerCase().includes('tenth') || 
				ed.degree?.toLowerCase().includes('ssc') ||
				ed.degree?.toLowerCase().includes('secondary')
			)
			// Check for 12th/Diploma
			const has12thOrDiploma = f.education.some(ed => 
				ed.degree?.toLowerCase().includes('12') || 
				ed.degree?.toLowerCase().includes('twelfth') || 
				ed.degree?.toLowerCase().includes('hsc') ||
				ed.degree?.toLowerCase().includes('senior secondary') ||
				ed.degree?.toLowerCase().includes('diploma') ||
				ed.degree?.toLowerCase().includes('intermediate')
			)
			
			if (!has10th) {
				e.education = 'Please add your 10th standard education details'
			} else if (!has12thOrDiploma) {
				e.education = 'Please add your 12th standard or Diploma education details'
			}
		}
		
		if (!f.experienceLevel) e.experienceLevel = 'Select fresher or experienced'
		if (f.experienceLevel === 'experienced') {
			if (!f.servingNotice) e.servingNotice = 'Please select an option'
			if (!f.noticePeriod) e.noticePeriod = 'Notice period is required'
			// Require last working day if serving notice OR notice period is Immediate
			if ((f.servingNotice === 'yes' || f.noticePeriod === 'Immediate') && !f.lastWorkingDay) e.lastWorkingDay = 'Last working day is required'
		}
		return e
	}

	const isComplete = useMemo(() => Object.keys(validate(form)).length === 0, [form])

	const updateField = (key, val) => setForm((f) => ({ ...f, [key]: val }))
	const updateListItem = (listKey, idx, key, val) => {
		setForm((f) => {
			const next = f[listKey].slice()
			next[idx] = { ...next[idx], [key]: val }
			return { ...f, [listKey]: next }
		})
	}

	const addListItem = (listKey) => setForm((f) => ({
		...f,
		[listKey]: [
			...f[listKey],
			listKey === 'education'
				? { degree: '', institution: '', cgpa: '', startMonth: '', endMonth: '' }
			: listKey === 'certifications'
				? { name: '', issuer: '', validTill: '', validationUrl: '', status: '' }
				: { company: '', role: '', startMonth: '', endMonth: '', isCurrent: false },
		],
	}))
	const removeListItem = (listKey, idx) => setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== idx) }))

	const onSave = (e) => {
		e.preventDefault()
		console.log('DEBUG: onSave - form.resumeFile:', form.resumeFile)
		console.log('DEBUG: onSave - form keys:', Object.keys(form))
		saveApplicantProfile(form)
		setSaved('Profile saved')
		setTimeout(() => setSaved(''), 1200)
	}

	const onComplete = async (e) => {
		e.preventDefault()
		const eMap = validate(form)
		setErrors(eMap)
		if (Object.keys(eMap).length > 0) {
			if (firstErrorRef.current) firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
			return
		}
		await saveApplicantProfile(form)
		await markApplicantProfileCompleted()
		
		// Check if there's a job to apply for
		const sp = new URLSearchParams(location.search)
		let redirectTo = sp.get('redirect') || '/jobs'
		let applyForJobId = sp.get('applyFor')
		
		// If applyFor is in the redirect URL, extract it
		if (!applyForJobId && redirectTo) {
			try {
				const redirectUrl = new URL(redirectTo, window.location.origin)
				applyForJobId = redirectUrl.searchParams.get('applyFor')
				// Clean up redirect URL
				redirectUrl.searchParams.delete('applyFor')
				redirectTo = redirectUrl.pathname + redirectUrl.search
			} catch (err) {
				// If redirectTo is not a full URL, try parsing as relative path
				const redirectParams = new URLSearchParams(redirectTo.split('?')[1] || '')
				applyForJobId = redirectParams.get('applyFor') || applyForJobId
				redirectTo = redirectTo.split('?')[0] || '/jobs'
			}
		}
		
		// If applyFor parameter exists, apply to that job
		if (applyForJobId) {
			const applyResult = await applyToJobAsApplicant(applyForJobId)
			if (applyResult.ok) {
				// Refresh applications data
				if (fetchApplicantData) {
					await fetchApplicantData()
				}
			}
		}
		
		navigate(redirectTo)
	}

	return (
		<section className="relative min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-10 overflow-hidden">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
				<div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize:'24px 24px'}} />
			</div>

			<div className="w-full max-w-3xl relative">
				<div className="rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/50 p-[1px] shadow-2xl">
					<div className="rounded-2xl bg-zinc-950/70 backdrop-blur-md p-6 sm:p-8">
						<h2 className="text-2xl font-semibold text-white">Complete Your Profile</h2>
						<p className="mt-1 text-sm text-zinc-400">We’ll use this info when you apply to jobs</p>

						<form onSubmit={onSave} className="mt-6 space-y-6">
							{saved && <div className="text-sm text-green-400">{saved}</div>}

							<div>
								<label className="block text-sm font-medium text-zinc-300">Resume (PDF) <span className="text-red-400">*</span></label>
								<input
									type="file"
									accept="application/pdf"
									className={`mt-1 w-full text-sm file:bg-zinc-700 file:text-gray-100 file:px-3 file:py-2 file:rounded-md ${errors.resumeFileName ? 'border border-red-500 rounded-md' : ''}`}
									onChange={(e) => {
										const file = e.target.files?.[0]
										if (file) {
											updateField('resumeFile', file)
											updateField('resumeFileName', file.name)
										} else {
											updateField('resumeFile', null)
											updateField('resumeFileName', '')
										}
										if (errors.resumeFileName) setErrors((er)=>({ ...er, resumeFileName: undefined }))
									}}
								/>
								{(form.resumeFileName || form.resumeFile) && <div className="mt-1 text-xs text-zinc-400">Selected: {form.resumeFileName || form.resumeFile?.name || 'resume.pdf'}</div>}
								{errors.resumeFileName && <div className="mt-1 text-xs text-red-400">{errors.resumeFileName}</div>}
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-zinc-300">Full name <span className="text-red-400">*</span></label>
									<input ref={errors.fullName ? firstErrorRef : undefined} className={`mt-1 w-full bg-transparent border-0 border-b py-2.5 text-gray-100 focus:outline-none ${errors.fullName ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-white'}`} value={form.fullName} onChange={(e) => { updateField('fullName', e.target.value); if (errors.fullName) setErrors((er)=>({ ...er, fullName: undefined })) }} />
									{errors.fullName && <div className="mt-1 text-xs text-red-400">{errors.fullName}</div>}
								</div>
								<div>
									<label className="block text-sm font-medium text-zinc-300">Email <span className="text-red-400">*</span></label>
									<input type="email" className={`mt-1 w-full bg-transparent border-0 border-b py-2.5 text-gray-100 focus:outline-none ${errors.email ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-white'}`} value={form.email} onChange={(e) => { updateField('email', e.target.value); if (errors.email) setErrors((er)=>({ ...er, email: undefined })) }} />
									{errors.email && <div className="mt-1 text-xs text-red-400">{errors.email}</div>}
								</div>
								<div>
									<label className="block text-sm font-medium text-zinc-300">Phone <span className="text-red-400">*</span></label>
									<input className={`mt-1 w-full bg-transparent border-0 border-b py-2.5 text-gray-100 focus:outline-none ${errors.phone ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-white'}`} value={form.phone} onChange={(e) => { updateField('phone', e.target.value); if (errors.phone) setErrors((er)=>({ ...er, phone: undefined })) }} />
									{errors.phone && <div className="mt-1 text-xs text-red-400">{errors.phone}</div>}
								</div>
							</div>

							<div className="border border-zinc-800 rounded-xl p-4 sm:p-5 bg-zinc-900/40">
								<h3 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">Experience Details</h3>
								<p className="mt-1 text-xs text-zinc-400">Tell us about your current experience and availability.</p>

								<div className="mt-4 space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300">Are you a fresher or experienced? <span className="text-red-400">*</span></label>
										<div className="mt-3 flex flex-wrap gap-3">
											<label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${form.experienceLevel === 'fresher' ? 'border-white/70 text-white bg-white/5' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
												<input
													type="radio"
													name="experienceLevel"
													value="fresher"
													onChange={(e) => setForm((prev) => ({
														...prev,
														experienceLevel: e.target.value,
														servingNotice: '',
														noticePeriod: '',
														lastWorkingDay: '',
													}))}

													className="accent-white"
													checked={form.experienceLevel === 'fresher'}
												/>
												<span>Fresher</span>
											</label>
											<label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${form.experienceLevel === 'experienced' ? 'border-white/70 text-white bg-white/5' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
												<input
													type="radio"
													name="experienceLevel"
													value="experienced"
													onChange={(e) => setForm((prev) => ({
														...prev,
														experienceLevel: e.target.value,
													}))}
													className="accent-white"
													checked={form.experienceLevel === 'experienced'}
												/>
												<span>Experienced</span>
											</label>
										</div>
										{errors.experienceLevel && <div className="mt-1 text-xs text-red-400">{errors.experienceLevel}</div>}
									</div>

									{form.experienceLevel === 'experienced' && (
										<div className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-zinc-300">Are you currently serving your notice period? <span className="text-red-400">*</span></label>
												<div className="mt-3 flex flex-wrap gap-3">
													<label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${form.servingNotice === 'yes' ? 'border-white/70 text-white bg-white/5' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
														<input
															type="radio"
															name="servingNotice"
															value="yes"
															onChange={(e) => setForm((prev) => ({
																...prev,
																servingNotice: e.target.value,
															}))}
															className="accent-white"
															checked={form.servingNotice === 'yes'}
														/>
														<span>Yes</span>
													</label>
													<label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${form.servingNotice === 'no' ? 'border-white/70 text-white bg-white/5' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
														<input
															type="radio"
															name="servingNotice"
															value="no"
															onChange={(e) => setForm((prev) => ({
																...prev,
																servingNotice: e.target.value,
															}))}
															className="accent-white"
															checked={form.servingNotice === 'no'}
														/>
														<span>No</span>
													</label>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-zinc-300">What is your notice period? <span className="text-red-400">*</span></label>
												<select
													className="mt-1 w-full border-0 border-b border-zinc-700 bg-zinc-900/80 py-2.5 text-zinc-100 focus:outline-none focus:border-white focus:bg-zinc-900"
													value={form.noticePeriod}
													onChange={(e) => updateField('noticePeriod', e.target.value)}

												>
													<option value="" className="text-zinc-900">Select</option>
													<option>Immediate</option>
													<option>&lt; 30 days</option>
													<option>&lt; 45 days</option>
													<option>&lt; 60 days</option>
													<option>&lt; 90 days</option>
													<option>Serving Notice Period</option>
												</select>
												{errors.noticePeriod && <div className="mt-1 text-xs text-red-400">{errors.noticePeriod}</div>}
											</div>

											{(form.servingNotice === 'yes' || form.noticePeriod === 'Immediate') && (
												<div>
													<label className="block text-sm font-medium text-zinc-300">
														{form.noticePeriod === 'Immediate' ? 'Joining date' : 'Last working day'} <span className="text-red-400">*</span>
													</label>
													<input
														type="date"
														className="mt-1 w-full bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:outline-none focus:border-white"
														value={form.lastWorkingDay}
														onChange={(e) => updateField('lastWorkingDay', e.target.value)}
														max={form.noticePeriod === 'Immediate' ? new Date().toISOString().split('T')[0] : undefined}
													/>
													{form.noticePeriod === 'Immediate' && (
														<div className="mt-1 text-xs text-zinc-400">As an immediate joiner, you cannot select a future date</div>
													)}
													{errors.lastWorkingDay && <div className="mt-1 text-xs text-red-400">{errors.lastWorkingDay}</div>}
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-zinc-300">Current location <span className="text-red-400">*</span></label>
									<input className={`mt-1 w-full bg-transparent border-0 border-b py-2.5 text-gray-100 focus:outline-none ${errors.currentLocation ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-white'}`} value={form.currentLocation} onChange={(e) => { updateField('currentLocation', e.target.value); if (errors.currentLocation) setErrors((er)=>({ ...er, currentLocation: undefined })) }} />
									{errors.currentLocation && <div className="mt-1 text-xs text-red-400">{errors.currentLocation}</div>}
								</div>
								<div>
									<label className="block text-sm font-medium text-zinc-300">Preferred location <span className="text-red-400">*</span></label>
									<input className={`mt-1 w-full bg-transparent border-0 border-b py-2.5 text-gray-100 focus:outline-none ${errors.preferredLocation ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-white'}`} value={form.preferredLocation} onChange={(e) => { updateField('preferredLocation', e.target.value); if (errors.preferredLocation) setErrors((er)=>({ ...er, preferredLocation: undefined })) }} />
									{errors.preferredLocation && <div className="mt-1 text-xs text-red-400">{errors.preferredLocation}</div>}
								</div>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-zinc-300">LinkedIn URL</label>
									<input type="url" className="mt-1 w-full bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:outline-none focus:border-white" placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={(e) => updateField('linkedinUrl', e.target.value)} />
								</div>
								<div>
									<label className="block text-sm font-medium text-zinc-300">Website/Portfolio</label>
									<input type="url" className="mt-1 w-full bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:outline-none focus:border-white" placeholder="https://your-portfolio.com" value={form.portfolioUrl} onChange={(e) => updateField('portfolioUrl', e.target.value)} />
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium text-zinc-300">Education <span className="text-red-400">*</span></label>
									<button type="button" className="text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-md px-3 py-1" onClick={() => { addListItem('education'); if (errors.education) setErrors((er)=>({ ...er, education: undefined })) }}>Add</button>
								</div>
								<p className="mt-1 text-xs text-zinc-400">Please include all your education starting from 10th standard, 12th/Diploma, and higher degrees</p>
								{errors.education && <div className="mt-2 text-xs text-red-400">{errors.education}</div>}
								<div className="mt-3 space-y-4">
									{form.education.map((ed, i) => (
										<div key={i} className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/30">
											<div className="grid sm:grid-cols-5 gap-3">
												<input placeholder="Degree" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ed.degree || ''} onChange={(e) => updateListItem('education', i, 'degree', e.target.value)} />
												<input placeholder="Institution" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ed.institution || ''} onChange={(e) => updateListItem('education', i, 'institution', e.target.value)} />
												<input placeholder="CGPA/Percentage" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ed.cgpa || ''} onChange={(e) => updateListItem('education', i, 'cgpa', e.target.value)} />
												<MonthYearPicker placeholder="Start" value={ed.startMonth || ''} onChange={(v) => updateListItem('education', i, 'startMonth', v)} />
												<MonthYearPicker placeholder="End" value={ed.endMonth || ''} onChange={(v) => updateListItem('education', i, 'endMonth', v)} />
											</div>
											<div className="mt-2 flex justify-end">
												<button type="button" className="text-xs text-zinc-400 hover:text-zinc-200" onClick={() => removeListItem('education', i)}>Remove</button>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Certifications */}
							<div>
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium text-zinc-300">Certifications</label>
									<button type="button" className="text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-md px-3 py-1" onClick={() => addListItem('certifications')}>Add</button>
								</div>
								<div className="mt-3 space-y-4">
									{form.certifications.map((ce, i) => (
										<div key={i} className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/30">
											<div className="grid sm:grid-cols-2 gap-3">
												<input placeholder="Certification Name" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ce.name || ''} onChange={(e) => updateListItem('certifications', i, 'name', e.target.value)} />
												<input placeholder="Issuer" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ce.issuer || ''} onChange={(e) => updateListItem('certifications', i, 'issuer', e.target.value)} />
											</div>
											<div className="grid sm:grid-cols-3 gap-3 mt-3">
												<div>
													<input 
														type="date" 
														placeholder="Valid Till" 
														className={`bg-transparent border-0 border-b py-2.5 text-gray-100 focus:border-white ${
															ce.validTill && new Date(ce.validTill) < new Date() && ce.status !== 'pursuing' ? 'border-red-500' : 'border-zinc-700'
														}`} 
														value={ce.validTill || ''} 
														onChange={(e) => {
															const date = e.target.value;
															if (date && new Date(date) < new Date() && ce.status !== 'pursuing') {
																alert('Cannot save an expired certification. Please select a future date or mark as Pursuing.');
																return;
															}
															updateListItem('certifications', i, 'validTill', date);
														}}
														disabled={ce.status === 'pursuing'}
													/>
													{ce.validTill && new Date(ce.validTill) < new Date() && ce.status !== 'pursuing' && (
														<div className="text-xs text-red-400 mt-1">Expired certification</div>
													)}
													{ce.status === 'pursuing' && (
														<div className="text-xs text-zinc-400 mt-1">Valid Till is optional for pursuing</div>
													)}
												</div>
												<select 
													className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white"
													value={ce.status || ''}
													onChange={(e) => updateListItem('certifications', i, 'status', e.target.value)}
												>
													<option value="" className="text-zinc-900">Status</option>
													<option value="completed" className="text-zinc-900">Completed</option>
													<option value="pursuing" className="text-zinc-900">Pursuing</option>
												</select>
												<input 
													type="url" 
													placeholder="Validation URL (optional)" 
													className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" 
													value={ce.validationUrl || ''} 
													onChange={(e) => updateListItem('certifications', i, 'validationUrl', e.target.value)}
												/>
											</div>
											<div className="mt-2 flex items-center justify-between">
												<span className="text-xs text-zinc-500">Valid Till (required unless pursuing), Status, and Validation URL</span>
												<button type="button" className="text-xs text-zinc-400 hover:text-zinc-200" onClick={() => removeListItem('certifications', i)}>Remove</button>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Experience */}
							<div>
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium text-zinc-300">Experience</label>
									<button type="button" className="text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-md px-3 py-1" onClick={() => addListItem('experiences')}>Add</button>
								</div>
								<div className="mt-3 space-y-4">
									{form.experiences.map((ex, i) => (
										<div key={i} className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/30">
											<div className="grid sm:grid-cols-5 gap-3">
												<input placeholder="Company" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ex.company || ''} onChange={(e) => updateListItem('experiences', i, 'company', e.target.value)} />
												<input placeholder="Role" className="bg-transparent border-0 border-b border-zinc-700 py-2.5 text-gray-100 focus:border-white" value={ex.role || ''} onChange={(e) => updateListItem('experiences', i, 'role', e.target.value)} />
												<MonthYearPicker placeholder="Start" value={ex.startMonth || ''} onChange={(v) => updateListItem('experiences', i, 'startMonth', v)} />
												{!ex.isCurrent ? (
													<MonthYearPicker placeholder="End" value={ex.endMonth || ''} onChange={(v) => {
														updateListItem('experiences', i, 'endMonth', v)
														// If end date is selected, clear isCurrent
														if (v) updateListItem('experiences', i, 'isCurrent', false)
													}} />
												) : (
													<div className="flex items-center text-zinc-300 border-b border-zinc-700">
														<span className="py-2.5">Present</span>
													</div>
												)}
												<label className="flex items-center gap-2 text-sm text-zinc-300 select-none">
													<input
														type="checkbox"
														className="accent-white"
														checked={!!ex.isCurrent}
														onChange={(e) => {
															const val = e.target.checked
															updateListItem('experiences', i, 'isCurrent', val)
															// If present is checked, clear endMonth
															if (val) updateListItem('experiences', i, 'endMonth', '')
														}}
													/>
													<span>Present</span>
												</label>
											</div>
											<div className="mt-2 flex items-center justify-between">
												<span className="text-xs text-zinc-500">Toggle Present if this is your current role</span>
												<button type="button" className="text-xs text-zinc-400 hover:text-zinc-200" onClick={() => removeListItem('experiences', i)}>Remove</button>
											</div>
										</div>
									))}
								</div>
							</div>

							<div className="flex items-center justify-end gap-3">
								<button type="submit" className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">Save</button>
								<button onClick={onComplete} disabled={!isComplete} className={`px-4 py-2 rounded-lg ${isComplete ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-600 text-zinc-300 cursor-not-allowed'}`}>Save & Complete</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</section>
	)
}



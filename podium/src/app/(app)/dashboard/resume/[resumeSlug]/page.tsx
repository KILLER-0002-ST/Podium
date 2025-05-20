'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ResumeEditor from './_components/resume-editor'
import { Chatbot } from './_components/chatbot'

type ResumeDetailsProps = {
  params: Promise<{ resumeSlug: string }>
}

export default function ResumeDetails({ params }: ResumeDetailsProps) {
  const searchParams = useSearchParams()
  const template = searchParams.get('template') || 'base'
  const [resumeSlug, setResumeSlug] = useState<string | null>(null)
  
  useEffect(() => {
    // Always treat params as a Promise
    Promise.resolve(params).then(resolvedParams => {
      setResumeSlug(resolvedParams.resumeSlug)
    })
  }, [params])

  // Don't render until we have the resumeSlug
  if (!resumeSlug) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <ResumeEditor slug={resumeSlug} initialTemplate={template} />
      <Chatbot />
    </div>
  )
}


// 'use client'

// import { useQuery } from '@tanstack/react-query'
// import { getResumeDetails } from './queries'
// import { match } from 'ts-pattern'
// import { Spinner } from '@react-pdf-viewer/core'
// import { ResumeEditor } from './_components/resume-editor'
// import { PasswordProtection } from './_components/password-protection'
// import { useState } from 'react'

// import '@react-pdf-viewer/core/lib/styles/index.css'

// export default function PublicResume({ params }: { params: { slug: string } }) {
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const resumeQuery = useQuery({
//     queryKey: ['public-resume', params.slug],
//     queryFn: () => getResumeDetails(params.slug),
//     enabled: isAuthenticated,
//   })

//   if (!isAuthenticated) {
//     return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />
//   }

//   return match(resumeQuery)
//     .with({ status: 'pending' }, () => (
//       <div className="flex h-screen w-full items-center justify-center">
//         <Spinner />
//       </div>
//     ))
//     .with({ status: 'error' }, () => (
//       <div className="flex h-screen w-full items-center justify-center">
//         <p className="text-red-500">Failed to load resume. Please try again later.</p>
//       </div>
//     ))
//     .with({ status: 'success' }, ({ data }) => <ResumeEditor resume={data} />)
//     .otherwise(() => null)
// }
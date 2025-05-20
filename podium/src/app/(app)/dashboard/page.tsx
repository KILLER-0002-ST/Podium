'use client'

import { ResumeList } from './_components/resume-list'
import ResumeUploader from './_components/resume-uploader'
import { Button } from '~/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

// export default function Dashboard() {
//   return (
//     <div className="p-4">
//       <h1 className="mb-4 flex text-3xl font-bold">My Library</h1>
//       <div className="mb-4 flex items-center justify-end gap-2">
//         <ResumeUploader />
//         {/* <Button variant="outline">
//           <PlusIcon className="mr-2 h-4 w-4" />
//           New Resume
//         </Button> */}
//       </div>
//       <ResumeList />
//     </div>
//   )
// }
export default function Dashboard() {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ paddingLeft: '10px' }}>My Library</h1>
        <div className="flex items-center gap-3">
          {isUploading && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading resume...</span>
            </div>
          )}
          <ResumeUploader onUploadStart={() => setIsUploading(true)} onUploadEnd={() => setIsUploading(false)} />
        </div>
      </div>
      <ResumeList />
    </div>
  )
}
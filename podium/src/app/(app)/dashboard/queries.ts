import { apiClient } from '~/lib/client'
import { Resume, UploadResumeSchema } from './utils'

export async function getAllResume() {
  const { data } = await apiClient.get<Array<Resume>>('/channels/resume/')
  return data
}

export async function uploadResume(payload: UploadResumeSchema) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('resume_file', payload.resume_file)

  const { data } = await apiClient.post<Resume>('/channels/resume/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function deleteResume(resumeSlug: string) {
  await apiClient.delete(`/channels/resume/${resumeSlug}/`)
  return true
}

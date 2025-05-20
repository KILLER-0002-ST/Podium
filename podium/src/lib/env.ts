import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().min(1).url(),
    NEXT_PUBLIC_ENCRYPTION_KEY: z.string().min(1),
    NEXT_PUBLIC_ORIGIN_URL: z.string().min(1).url(),
    NEXT_PUBLIC_REFERER_URL: z.string().min(1).url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ENCRYPTION_KEY: process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
    NEXT_PUBLIC_ORIGIN_URL: process.env.NEXT_PUBLIC_ORIGIN_URL,
    NEXT_PUBLIC_REFERER_URL: process.env.NEXT_PUBLIC_REFERER_URL,
  },
})

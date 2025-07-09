import { inngest } from "@/services/inngest/client"
import { sendEmailVerification } from "@/services/inngest/functions/email"
import { serve } from "inngest/next"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailVerification,
  ],
})

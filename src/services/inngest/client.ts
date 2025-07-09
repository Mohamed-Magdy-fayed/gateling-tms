import { EventSchemas, Inngest } from "inngest"

type Events = {
  "app/org.created": {
    data: {
      orgId: string
      name: string
      email: string
      locale: string
    }
  }
}

export const inngest = new Inngest({
  id: "gateling-tms",
  schemas: new EventSchemas().fromRecord<Events>(),
})

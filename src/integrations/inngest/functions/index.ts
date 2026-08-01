import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onFormMediaImported } from "./on-form-media-imported";
import { onGoogleIntegrationDisconnected } from "./on-google-integration-disconnected";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onSessionBackfillScheduled } from "./on-session-backfill-scheduled";
import { onUsageReconciliationRequested } from "./on-usage-reconciliation-requested";
import { onUsageReconciliationScheduled } from "./on-usage-reconciliation-scheduled";
import { onUserRegistered } from "./on-user-registered";

/**
 * Live classes deliberately contribute nothing here (STATE.md D143): onMeeting
 * meetings are created inline while the teacher waits for the link, and
 * onMeeting has no webhooks — so there is neither an outbound job to offload
 * nor an inbound delivery to process. The five Zoom functions that used to be
 * in this list went with the Zoom integration.
 */
export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onSessionBackfillScheduled,
  onGoogleIntegrationDisconnected,
  onFormMediaImported,
  onUsageReconciliationScheduled,
  onUsageReconciliationRequested,
];

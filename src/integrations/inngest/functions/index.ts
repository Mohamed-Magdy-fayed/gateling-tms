import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onFormMediaImported } from "./on-form-media-imported";
import { onGoogleIntegrationDisconnected } from "./on-google-integration-disconnected";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onMeetingsWebhook } from "./on-meetings-webhook";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onSessionBackfillScheduled } from "./on-session-backfill-scheduled";
import { onUsageReconciliationRequested } from "./on-usage-reconciliation-requested";
import { onUsageReconciliationScheduled } from "./on-usage-reconciliation-scheduled";
import { onUserRegistered } from "./on-user-registered";

/**
 * Live classes contribute exactly one function (STATE.md D143): meetings are
 * created inline while the teacher waits for the link, so there is no
 * outbound job to offload — but Gateling Meetings sends a signed webhook when
 * a room closes, and `onMeetingsWebhook` is what turns that into a completed
 * session.
 */
export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onSessionBackfillScheduled,
  onMeetingsWebhook,
  onGoogleIntegrationDisconnected,
  onFormMediaImported,
  onUsageReconciliationScheduled,
  onUsageReconciliationRequested,
];

import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onFormMediaImported } from "./on-form-media-imported";
import { onGoogleIntegrationDisconnected } from "./on-google-integration-disconnected";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onMeetingsParticipantJoined } from "./on-meetings-participant-joined";
import { onMeetingsWebhook } from "./on-meetings-webhook";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onOrganizationPlanGranted } from "./on-organization-plan-granted";
import { onSessionBackfillScheduled } from "./on-session-backfill-scheduled";
import { onUsageReconciliationRequested } from "./on-usage-reconciliation-requested";
import { onUsageReconciliationScheduled } from "./on-usage-reconciliation-scheduled";
import { onUserRegistered } from "./on-user-registered";

/**
 * Live classes contribute two functions (STATE.md D143): meetings are created
 * inline while the teacher waits for the link, so there is no outbound job to
 * offload — but Gateling Meetings sends signed webhooks. `onMeetingsWebhook`
 * turns a closed room into a completed session and settles its register;
 * `onMeetingsParticipantJoined` marks a student present as they walk in.
 */
export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onOrganizationPlanGranted,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onSessionBackfillScheduled,
  onMeetingsWebhook,
  onMeetingsParticipantJoined,
  onGoogleIntegrationDisconnected,
  onFormMediaImported,
  onUsageReconciliationScheduled,
  onUsageReconciliationRequested,
];

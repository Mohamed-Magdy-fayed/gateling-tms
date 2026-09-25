import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onFormMediaImported } from "./on-form-media-imported";
import { onGoogleIntegrationDisconnected } from "./on-google-integration-disconnected";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onOrganizationPlanGranted } from "./on-organization-plan-granted";
import { onSessionBackfillScheduled } from "./on-session-backfill-scheduled";
import { onUsageReconciliationRequested } from "./on-usage-reconciliation-requested";
import { onUsageReconciliationScheduled } from "./on-usage-reconciliation-scheduled";
import { onUserRegistered } from "./on-user-registered";

/**
 * Live classes contribute no functions: meetings are created inline while the
 * teacher waits for the link (STATE.md D143), and Gateling Meetings' webhooks
 * are processed inline by `/api/meetings-webhook` (D181).
 */
export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onOrganizationPlanGranted,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onSessionBackfillScheduled,
  onGoogleIntegrationDisconnected,
  onFormMediaImported,
  onUsageReconciliationScheduled,
  onUsageReconciliationRequested,
];

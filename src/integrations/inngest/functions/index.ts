import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onGoogleIntegrationDisconnected } from "./on-google-integration-disconnected";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onOrganizationZoomConnected } from "./on-organization-zoom-connected";
import { onSessionMeetingCancelled } from "./on-session-meeting-cancelled";
import { onSessionMeetingSyncRequested } from "./on-session-meeting-sync-requested";
import { onUsageReconciliationRequested } from "./on-usage-reconciliation-requested";
import { onUsageReconciliationScheduled } from "./on-usage-reconciliation-scheduled";
import { onUserRegistered } from "./on-user-registered";
import { onZoomClientDisconnected } from "./on-zoom-client-disconnected";
import { onZoomWebhookReceived } from "./on-zoom-webhook-received";

export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onGoogleIntegrationDisconnected,
  onZoomClientDisconnected,
  onOrganizationZoomConnected,
  onSessionMeetingSyncRequested,
  onSessionMeetingCancelled,
  onZoomWebhookReceived,
  onUsageReconciliationScheduled,
  onUsageReconciliationRequested,
];

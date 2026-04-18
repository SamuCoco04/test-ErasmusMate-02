classDiagram
direction TB

class UserAccount {
  <<entity>>
}

class Institution {
  <<entity>>
  displayName
}

class MobilityRecord {
  <<entity>>
}

class MobilityContext {
  <<value_object>>
  mobilityType
  mobilityPeriod
}

class Destination {
  <<value_object>>
  destinationLabel
  city
}

class SocialSupportProfile {
  <<entity>>
}

class SocialConnection {
  <<entity>>
  initiatedAt
  respondedAt
}

class MessageThread {
  <<entity>>
  retentionState
}

class Message {
  <<entity>>
  sentAt
  messageText
}

class Recommendation {
  <<entity>>
}

class Opinion {
  <<entity>>
  rating
}

class ModerationReport {
  <<entity>>
  reportedAt
  reportReason
}

class ModerationCase {
  <<entity>>
  outcomeSummary
  thresholdTriggered
}

class SocialVisibilitySettings {
  <<value_object>>
  fieldVisibilityRules
  directContactExposed
}

class SocialConsentSettings {
  <<value_object>>
  discoverabilityConsent
  contactabilityConsent
  consentRevokedAt
}

class SocialScopeRule {
  <<value_object>>
  userPopulation
}

class PlatformRole {
  <<enumeration>>
  Student
  Coordinator
  Administrator
}

class MobilityLifecycleStage {
  <<enumeration>>
  pre_departure
  during_mobility
  end_of_mobility
}

class SocialProfileState {
  <<enumeration>>
  unavailable
  profile_active_private
  discoverable
  contactable
  consent_revoked_or_restricted
}

class SocialConnectionState {
  <<enumeration>>
  pending
  accepted
  rejected
  cancelled
  expired
  blocked
  closed
}

class MessagingPermissionState {
  <<enumeration>>
  not_permitted
  permitted
  blocked
  expired_or_closed_retained
}

class SocialContentState {
  <<enumeration>>
  draft_or_editing
  published_visible
  updated_visible
  author_deleted
  hidden_or_restricted
  removed
}

class SocialContentCategory {
  <<enumeration>>
  accommodation
  transport
  bureaucracy
  academics
  daily_living
}

class ModerationCaseState {
  <<enumeration>>
  reported
  threshold_hidden_pending_review
  in_review
  resolved_hidden
  resolved_removed
  resolved_restricted
  cleared
}

class ModerationTargetType {
  <<enumeration>>
  social_profile
  message
  recommendation
  opinion
  social_interaction
}

UserAccount "1" --> "0..1" SocialSupportProfile : owns
UserAccount --> PlatformRole : assignedRoles

SocialSupportProfile "1" --> "1" MobilityRecord : eligibilityContext
SocialSupportProfile "1" *-- "1" SocialVisibilitySettings : visibilitySettings
SocialSupportProfile "1" *-- "1" SocialConsentSettings : consentSettings
SocialSupportProfile --> SocialProfileState : profileState

MobilityRecord "1" *-- "1" MobilityContext : context
MobilityContext --> "1" Institution : hostInstitution
MobilityContext *-- "1" Destination : destination

SocialScopeRule --> "1" Institution : institution
SocialScopeRule *-- "1" Destination : destination
SocialScopeRule --> MobilityLifecycleStage : mobilityStage

SocialSupportProfile "1" --> "0..*" SocialConnection : requester
SocialSupportProfile "1" --> "0..*" SocialConnection : recipient
SocialConnection --> SocialConnectionState : connectionState

SocialConnection "1" --> "0..1" MessageThread : thread
MessageThread "1" *-- "0..*" Message : messages
MessageThread --> MessagingPermissionState : permissionState
Message "1" --> "1" SocialSupportProfile : sender

SocialSupportProfile "1" --> "0..*" Recommendation : authors
SocialSupportProfile "1" --> "0..*" Opinion : authors
Recommendation --> "1" Destination : destination
Opinion --> "1" Destination : destination
Recommendation --> SocialContentCategory : category
Recommendation --> SocialContentState : contentState
Opinion --> SocialContentState : contentState

SocialSupportProfile "1" --> "0..*" ModerationReport : reporter
ModerationReport --> ModerationTargetType : targetType
ModerationCase "1" --> "1..*" ModerationReport : consolidates
ModerationCase --> ModerationTargetType : targetType
ModerationCase --> ModerationCaseState : caseState

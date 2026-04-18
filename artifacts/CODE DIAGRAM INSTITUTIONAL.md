classDiagram
direction TB

class UserAccount {
  <<entity>>
  verificationRequired
}

class Institution {
  <<entity>>
  institutionIdentifier
  displayName
}

class MobilityRecord {
  <<entity>>
  closureReached
}

class ProcedureDefinition {
  <<entity>>
  versionIdentifier
}

class DocumentSubmission {
  <<entity>>
  latestDecisionOutcome
  submittedAt
  reopeningRationale
}

class SubmittedDocumentVersion {
  <<entity>>
  versionIdentifier
  versionStatus
  submissionMetadata
}

class SignatureRequirementSet {
  <<entity>>
  currentStageIdentifier
  stageCompletionState
}

class SignatureRequirement {
  <<entity>>
  signerRoleOrParticipant
  stageOrder
}

class OfficialObligation {
  <<entity>>
  obligationCategory
  fulfillmentState
}

class ExceptionRequest {
  <<entity>>
  decisionRationale
  appliedEffectSummary
}

class DelegationGrant {
  <<entity>>
  effectivePeriod
}

class PersonalDataRightsRequest {
  <<entity>>
  requestedScope
}

class ConsentAcknowledgement {
  <<entity>>
  acknowledgementType
  recordedAt
  requiredByPolicy
}

class OfficialNotificationRecord {
  <<entity>>
  notificationCategory
  recipientContext
  recordedAt
  deliveryOutcome
}

class AuditRecord {
  <<entity>>
  actionType
  targetType
  timestamp
  outcome
  priorState
  newState
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

class ProcedureApplicabilityRule {
  <<value_object>>
  mobilityType
}

class ReviewScope {
  <<value_object>>
  coveredMobilityRecords
  coveredInstitutions
  coveredDestinations
  coveredProcedureSet
}

class Deadline {
  <<value_object>>
  officialDueDate
  effectiveDueDate
  overrideBasis
}

class SubmissionValidationRule {
  <<value_object>>
  mandatoryDocumentTypes
  requiredStructuredFields
  requiredSubmissionMetadata
  fileAcceptanceCriteria
  consistencyControlEnabled
}

class NotificationPreferenceSet {
  <<value_object>>
  preferenceContext
  supportedChannels
  optionalChannelSettings
}

class PlatformRole {
  <<enumeration>>
  Student
  Coordinator
  Administrator
}

class UserAccountState {
  <<enumeration>>
  registration_started
  registered
  pending_verification
  verified
  active
}

class AuthenticationState {
  <<enumeration>>
  valid
  expired
  revoked
}

class MobilityRecordState {
  <<enumeration>>
  draft
  submitted
  in_review
  approved
  active
  completed
  closed
  terminated
}

class MobilityLifecycleStage {
  <<enumeration>>
  pre_departure
  during_mobility
  end_of_mobility
}

class ProcedureDefinitionState {
  <<enumeration>>
  draft
  published
  locked
  superseded
}

class ProcedureKind {
  <<enumeration>>
  nomination
  application
  acceptance
  learning_agreement_or_ola
  la_change
  pre_departure_check
  arrival_confirmation
  during_mobility_update
  end_of_mobility_confirmation
  transcript_reception
  final_report
}

class DocumentSubmissionState {
  <<enumeration>>
  draft
  submitted
  in_review
  approved
  rejected
  reopened
  resubmitted
  archived
}

class OfficialDocumentType {
  <<enumeration>>
  learning_agreement_or_ola
  la_change
  grant_agreement
  certificate_of_arrival
  confirmation_of_stay
  end_of_mobility_certificate
  transcript_of_records
  insurance_proof
  identity_document
  visa_document
  residence_document
  bank_details
}

class SignatureStatus {
  <<enumeration>>
  pending
  signed
  rejected
  expired
  cancelled
}

class SignatureRoutingMode {
  <<enumeration>>
  sequential
  parallel
}

class ExceptionRequestState {
  <<enumeration>>
  submitted
  in_review
  approved
  rejected
  applied
  closed
}

class ExceptionScopeType {
  <<enumeration>>
  deadline
  document_obligation
  procedure_condition
}

class PersonalDataRightsRequestType {
  <<enumeration>>
  export
  deletion
}

class PersonalDataRightsRequestState {
  <<enumeration>>
  export_requested
  export_fulfilled
  export_limited_or_denied
  deletion_requested
  deletion_fulfilled
  deletion_limited_or_denied
  closed
}

UserAccount "1" --> "0..*" MobilityRecord : student
UserAccount "1" --> "0..*" PersonalDataRightsRequest : requests
UserAccount "1" --> "0..*" ConsentAcknowledgement : accepts
UserAccount "1" o-- "0..1" NotificationPreferenceSet : officialNotificationPreferences
UserAccount "1" --> "0..*" OfficialNotificationRecord : receives
UserAccount "1" --> "0..*" AuditRecord : actor
UserAccount "1" --> "0..*" DelegationGrant : grantor
UserAccount "1" --> "0..*" DelegationGrant : grantee

MobilityRecord "1" *-- "1" MobilityContext : context
MobilityRecord "1" --> "0..*" DocumentSubmission : submissions
MobilityRecord "1" --> "0..*" OfficialObligation : obligations
MobilityRecord "1" --> "0..*" ExceptionRequest : exceptionRequests
MobilityRecord "1" --> "0..*" OfficialNotificationRecord : notifications
MobilityRecord "1" --> "0..*" AuditRecord : auditTrail

MobilityContext --> "1" Institution : homeInstitution
MobilityContext --> "1" Institution : hostInstitution
MobilityContext *-- "1" Destination : destination
MobilityContext --> MobilityLifecycleStage : lifecycleStage

ProcedureDefinition "1" *-- "1" ProcedureApplicabilityRule : applicabilityRule
ProcedureDefinition "1" *-- "0..1" SubmissionValidationRule : validationRule
ProcedureDefinition "1" --> "0..*" DocumentSubmission : governs
ProcedureDefinition --> ProcedureKind : procedureKind
ProcedureDefinition --> ProcedureDefinitionState : definitionState

ProcedureApplicabilityRule --> "1" Institution : institution
ProcedureApplicabilityRule *-- "1" Destination : destination
ProcedureApplicabilityRule --> MobilityLifecycleStage : lifecycleStage

DocumentSubmission "1" *-- "0..*" SubmittedDocumentVersion : versions
DocumentSubmission "1" o-- "0..*" SignatureRequirementSet : signatureStages
DocumentSubmission --> DocumentSubmissionState : submissionState
SubmittedDocumentVersion --> OfficialDocumentType : documentType

SignatureRequirementSet "1" *-- "1..*" SignatureRequirement : requirements
SignatureRequirementSet "0..*" --> "0..1" SubmittedDocumentVersion : appliesToVersion
SignatureRequirementSet --> SignatureRoutingMode : routingMode
SignatureRequirement --> SignatureStatus : signatureStatus

OfficialObligation "1" *-- "1" Deadline : deadline
ExceptionRequest "1" --> "0..1" OfficialObligation : affects
ExceptionRequest --> ExceptionScopeType : exceptionScopeType
ExceptionRequest --> ExceptionRequestState : exceptionState

DelegationGrant "1" *-- "1" ReviewScope : delegatedScope

UserAccount --> PlatformRole : assignedRoles
UserAccount --> UserAccountState : accountState
UserAccount --> AuthenticationState : authenticationState
MobilityRecord --> MobilityRecordState : recordState
PersonalDataRightsRequest --> PersonalDataRightsRequestType : requestType
PersonalDataRightsRequest --> PersonalDataRightsRequestState : requestState

1. Final Assumptions
A1. A mobility record remains the primary official processing anchor, and the institutional workflow baseline is organized around mobility lifecycle, procedure applicability, submission and review, signatures, exceptions, deadlines, and closure.
A2. Procedure applicability is configuration-driven by institution, destination, mobility type, and lifecycle phase, so workflow guards may depend on approved institutional configuration but may not invent new applicability logic.
A3. Coordinator decisions remain institutionally authoritative even when the platform performs validation, deadline control, signature synchronization, or incident surfacing.
A4. Reopening, resubmission, exception handling, deadline override, and delegation are exceptional but governed institutional actions and therefore must remain explicitly traceable.
A5. Account registration, verification, and controlled credential recovery belong to the institutional identity lifecycle, but they do not alter the later role-based access and protected-data authorization model.
A6. Synchronous read actions, such as viewing already-authorized personal data, are not modeled as workflow states unless the approved baseline defines a governed lifecycle around the request itself.
A7. Social-support workflows operate only inside eligible Erasmus scope and never override institutional permissions, validation gates, deadlines, review authority, or closure conditions.
A8. Where integrations are involved, workflow outcomes must remain unambiguous: the authoritative state is the pre-action state when an integration-dependent action fails or times out.
A9. Auditability is cross-cutting across institutional and social workflows. Status-changing and governance-significant actions are assumed to produce preserved traceability.
2. Final Constraints
C1. This catalog derives workflows only from the approved workflow brief, final requirements, final business rules, the consolidated workflow baseline, and the final review, and does not reopen requirements scope or business-rules scope.
C2. Each workflow remains a stateful operational model with actors, triggers, preconditions, states, transitions, guard conditions, outcomes, and exception paths, but without domain model design, acceptance criteria, architecture, API design, database design, or UI design.
C3. Institutional workflows remain primary; social-support workflows remain secondary and must not distort official lifecycle governance.
C4. Only transitions permitted by the approved baseline or by explicitly authorized exceptional actions are modeled as valid. Where the approved baseline defines a minimum state set, extra exception states are used conservatively and only to clarify lifecycle handling already implied by authorized actions.
C5. Configuration-dependent behavior is modeled only where the approved baseline already establishes configurability, including procedure applicability, signature routing, deadlines, social scope, moderation thresholds, consent requirements, and integration enablement.
C6. Pure notification behavior is not treated as a workflow state transition unless the approved baseline explicitly defines the notification itself as the lifecycle object.
C7. Social workflows remain separate from official institutional record search, official procedure navigation, official review authority, and official privacy access control.
3. Final Workflows
WF-001
Workflow name: Mobility Record Lifecycle
Scope layer: institutional_core
Purpose: Govern the official lifecycle of a student mobility record from initial official creation through operational use, exceptional early termination, and formal closure.
Primary entity or record: Mobility record
Actors: Student, Coordinator, Administrator, System
Trigger: Creation or activation of a mobility record for an Erasmus mobility process.
Preconditions:
User authentication and role are valid.
Mobility context exists or is synchronized or entered under allowed policy.
Access to the mobility record is authorized for the acting user.
Main states: draft, submitted, in_review, approved, active, completed, closed, terminated
Main flow:
A mobility record is created in draft.
Permitted mobility-context data is populated or synchronized.
When the record enters official handling, it moves to submitted.
Assigned coordinator review moves it to in_review.
If institutionally accepted for governed processing, it moves to approved.
When the mobility enters its operational execution phase, it moves to active.
When the mobility period and core execution phase are finished, it moves to completed.
The transition from completed to closed is governed by WF-007.
Alternate / exception flows:
Unauthorized access or action is blocked.
Invalid state transitions are blocked.
Missing required official context prevents advancement.
Before completed, an authorized exceptional action may move the record to terminated when the mobility is formally ended early.
Formal closure is blocked while mandatory end-of-mobility procedures or final obligations remain incomplete.
Guard conditions / business rule references:
Access is limited to permitted role and mobility context.
Reserved lifecycle actions require explicit authorization.
Only valid configured state transitions are allowed.
Early termination is valid only as an authorized lifecycle action under the configured mobility state model.
Closure requires completion of mandatory end-of-mobility obligations.
Authentication and session validity are required for protected access.
BR refs: BR-003, BR-004, BR-006, BR-014, BR-039, BR-045, BR-049, BR-083
Source requirement IDs: REQ-002, REQ-007, REQ-008, REQ-011, REQ-022, REQ-026, REQ-027, REQ-028, REQ-036, REQ-077, REQ-101, REQ-102
Source business rule IDs: BR-003, BR-004, BR-006, BR-014, BR-039, BR-045, BR-049, BR-083
End conditions: The mobility record remains in a valid non-final state for ongoing processing, reaches closed through WF-007, or reaches terminated through an authorized early-exit path.
WF-002
Workflow name: Procedure Definition, Publication, Locking, and Supersession
Scope layer: institutional_core
Purpose: Govern how official procedure definitions become operational, stable, and historically traceable.
Primary entity or record: Procedure definition
Actors: Authorized staff, Coordinator, Administrator
Trigger: Creation of a new official procedure definition or revision of an existing one.
Preconditions:
Acting user is authorized to manage procedure definitions.
Institutional context for the procedure is identified.
Main states: draft, published, locked, superseded
Main flow:
Authorized staff create a procedure definition in draft.
The draft is configured with applicable documents, signers, deadlines, review responsibilities, validations, and configured reference materials.
When ready for operational use, the procedure moves to published.
If institutional control requires stability, the published procedure may move to locked.
If revision is later needed, a newer version is prepared and published.
The prior governing version becomes superseded but remains historically traceable.
Alternate / exception flows:
A draft that has not been published cannot govern student obligations.
A locked procedure cannot be modified through ordinary maintenance actions.
A superseded procedure remains inspectable for historical audit but does not govern new applicability.
For submissions or decisions already made, the governing version remains the version in effect when that submission or decision occurred.
For future governed actions that have not yet produced a submission or decision, the currently published applicable version governs; a superseded version does not continue to govern new applicability.
Guard conditions / business rule references:
Only published procedures govern active obligations.
Locked procedures are not ordinarily modifiable.
Superseded procedures remain historical references only.
The governing version for later inspection and audit is frozen at the version in effect when the relevant submission or decision occurred.
Procedure configuration may impose only the configured documents, deadlines, signers, review responsibilities, and validations.
BR refs: BR-007, BR-008, BR-009, BR-010, BR-011, BR-012, BR-044, BR-045
Source requirement IDs: REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-021, REQ-023, REQ-054, REQ-072, REQ-074, REQ-103
Source business rule IDs: BR-007, BR-008, BR-009, BR-010, BR-011, BR-012, BR-044, BR-045
End conditions: The procedure definition ends in a stable governing state (published or locked) or in a historical non-governing state (superseded).
WF-003
Workflow name: Official Document Submission, Validation, Review, Rejection, Reopening, and Resubmission
Scope layer: institutional_core
Purpose: Govern the full lifecycle of an official submission from draft preparation through approval, rejection, reopening, resubmission, and archival history.
Primary entity or record: Document submission or document package
Actors: Student, Coordinator, System
Trigger: A student starts work on an applicable official procedure submission.
Preconditions:
The governing procedure is applicable and published.
The student is authorized for the mobility context.
The relevant deadline has not passed, unless an approved override applies.
Main states: draft, submitted, in_review, approved, rejected, reopened, resubmitted, archived
Main flow:
The student creates or opens the submission in draft.
The student uploads required documents and completes required structured fields and metadata.
The student may save progress while the submission remains in draft.
Final submission is attempted.
If all blocking validations pass, the submission moves to submitted.
Coordinator review moves it to in_review.
The coordinator may record comments or deficiency notes.
If valid and review-ready, the coordinator approves it and it moves to approved.
Superseded, rejected, reopened-prior, or completed historical versions remain retrievable in archived, while the latest accepted version remains authoritative.
Alternate / exception flows:
A draft does not satisfy the obligation and does not stop deadline lateness.
Upload is blocked if file format, file size, or required technical quality criteria fail.
Final submission is blocked if mandatory documents, structured fields, or required metadata are incomplete.
Finalization is blocked if configured cross-document consistency checks detect unresolved blocking inconsistencies.
Submission after deadline is blocked unless an approved extension or exception applies.
Coordinator rejection with rationale moves the submission to rejected.
After rejection, the student may correct and resubmit, moving the submission to resubmitted and then back into review.
A locked or finalized submission cannot be resubmitted unless authorized staff reopen it.
Authorized reopening moves the submission to reopened, preserves the prior submitted version as immutable history, and creates a correction-capable path.
If a submit, review, storage, or integration-dependent action fails or times out, the action halts, the prior status remains authoritative, and no partial status update is applied.
Guard conditions / business rule references:
draft is non-fulfilling.
Submitted versions are immutable unless formally reopened.
Resubmission is limited to valid rejected or reopened paths.
Final submission requires all mandatory documents, all mandatory structured fields, and all required submission metadata.
Uploaded files must satisfy configured format and size constraints.
Where required, uploaded files must satisfy configured technical quality criteria.
Where configured, cross-document consistency must pass before finalization.
Approval requires all blocking validations and stage-required signatures to be satisfied.
Integration-dependent failures preserve the pre-action state and surface a blocking condition to authorized users.
BR refs: BR-009, BR-012, BR-015, BR-016, BR-017, BR-018, BR-019, BR-021, BR-022, BR-023, BR-024, BR-025, BR-030, BR-031, BR-032, BR-034, BR-047, BR-048, BR-081
Source requirement IDs: REQ-018, REQ-021, REQ-024, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-037, REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-044, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-053, REQ-055, REQ-059, REQ-061, REQ-063, REQ-072, REQ-073, REQ-074, REQ-075, REQ-083, REQ-084, REQ-095, REQ-096, REQ-098, REQ-099, REQ-104, REQ-105
Source business rule IDs: BR-009, BR-012, BR-015, BR-016, BR-017, BR-018, BR-019, BR-021, BR-022, BR-023, BR-024, BR-025, BR-030, BR-031, BR-032, BR-034, BR-047, BR-048, BR-081
End conditions: The submission reaches a governed non-final state (draft, in_review, rejected, reopened, resubmitted) or a stable accepted or historical state (approved, archived).
WF-004
Workflow name: Signature Routing and Signature-Gated Advancement
Scope layer: institutional_core
Purpose: Govern how signature-required submissions are routed, synchronized, and released to the next workflow stage.
Primary entity or record: Signature requirement set for a submission
Actors: Required signer or signers, Coordinator, System, External e-signature provider
Trigger: A submission reaches a stage where configured signatures are mandatory.
Preconditions:
The governing procedure explicitly requires signatures for the current stage.
The relevant submission exists and is at a signature-gated stage.
Main states: waiting_for_signature_stage, signer pending, signer signed, signer rejected, signer expired, signer cancelled, stage_complete, stage_blocked
Main flow:
The submission reaches a signature-gated stage.
The system routes signature requests to the configured required signers in sequential or parallel order.
Each signer holds an explicit signature status.
Signed results are synchronized when external e-signature is used.
When all signatures required for the current routing stage are completed, the stage becomes stage_complete.
The submission may then advance to the next workflow state.
Alternate / exception flows:
Only the signer with current pending responsibility may perform the signature action.
A signer state of rejected, expired, or cancelled does not satisfy the obligation and leaves the submission blocked at the signature gate.
If external signature synchronization fails, the prior valid workflow state remains in force and the blocking condition is surfaced.
Guard conditions / business rule references:
Signature obligations exist only when explicitly configured.
Advancement past the signature gate requires all required current-stage signatures.
Only the current pending signer may act.
Rejected, expired, or cancelled signatures do not fulfill the requirement.
BR refs: BR-026, BR-027, BR-028, BR-029, BR-047, BR-048
Source requirement IDs: REQ-021, REQ-033, REQ-034, REQ-035, REQ-042, REQ-060, REQ-079, REQ-082, REQ-083, REQ-084, REQ-095, REQ-096, REQ-098
Source business rule IDs: BR-026, BR-027, BR-028, BR-029, BR-047, BR-048
End conditions: The signature gate is either satisfied and released, or remains blocked pending valid signature completion or a later correction path.
WF-005
Workflow name: Exception Request Review and Application
Scope layer: institutional_core
Purpose: Govern how a student requests an exception and how that request is reviewed, decided, applied, and closed.
Primary entity or record: Exception request
Actors: Student, Authorized staff, Coordinator, System
Trigger: A student submits an exception request related to a deadline, document obligation, or procedure condition.
Preconditions:
The request concerns a supported official exception scope.
The student has an applicable mobility obligation.
Main states: submitted, in_review, approved, rejected, applied, closed
Main flow:
The student submits an exception request and it enters submitted.
Authorized staff review it and move it to in_review.
If the request is accepted, it moves to approved.
The approved effect is then applied to the covered deadline, obligation, or condition, moving it to applied.
Once the approved effect has been operationalized and no further workflow action remains, the request moves to closed.
Alternate / exception flows:
If the request is rejected, rationale is recorded and the request enters rejected.
A rejected request may later be administratively ended in closed when no further processing remains.
Unsupported exception scope is blocked before approval.
Unauthorized staff cannot approve or reject the request.
Approval does not alter unrelated obligations.
Guard conditions / business rule references:
Exception decisions require authorized staff and recorded rationale.
Approved exceptions may modify only the explicitly covered obligation, deadline, or condition.
Blocking inconsistencies can remain unresolved only through approved exception or reopening logic.
BR refs: BR-024, BR-035, BR-036, BR-037, BR-045
Source requirement IDs: REQ-025, REQ-026, REQ-027, REQ-028, REQ-055, REQ-069, REQ-070, REQ-071, REQ-072, REQ-075
Source business rule IDs: BR-024, BR-035, BR-036, BR-037, BR-045
End conditions: The request ends as closed after approved application or administrative completion, or remains in a valid intermediate decision state.
WF-006
Workflow name: Deadline Governance and Override Effect
Scope layer: institutional_core
Purpose: Govern how deadlines are set, applied, overridden, and used to distinguish upcoming versus overdue obligations.
Primary entity or record: Deadline-controlled obligation
Actors: Authorized staff, Student, Coordinator, System
Trigger: Creation or update of an official deadline, or evaluation of an obligation against its effective due date.
Preconditions:
An applicable procedure, submission, review item, or resubmission obligation exists.
The acting staff member is authorized to manage the relevant deadline when making changes.
Main states: upcoming, overridden, overdue, fulfilled
Main flow:
Authorized staff define or update the official due date for the obligation.
The obligation remains upcoming while it is unfulfilled and its effective due date has not passed.
If an approved extension or approved exception-linked override applies, the obligation moves through an overridden path with a revised effective due date.
If the obligation is fulfilled by its effective due date, it reaches fulfilled.
If the effective due date passes while the obligation remains unfulfilled and no approved override applies, it becomes overdue.
Alternate / exception flows:
Late submission or related late action is blocked when no approved override applies.
Unauthorized users cannot define or change official deadlines.
An override affects only the specifically covered obligation and does not cascade to unrelated items.
Coordinator ordering and filtering of pending items follow the effective deadline state, but do not change the lifecycle itself.
Guard conditions / business rule references:
Configured due dates are authoritative.
Post-deadline action is barred unless an approved extension or exception applies.
Approved overrides are narrow in effect.
Overdue status arises when the due date passes without fulfillment and without approved override.
BR refs: BR-033, BR-034, BR-035, BR-038, BR-040, BR-041
Source requirement IDs: REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, REQ-055, REQ-056, REQ-060, REQ-062, REQ-063
Source business rule IDs: BR-033, BR-034, BR-035, BR-038, BR-040, BR-041
End conditions: The obligation is either fulfilled under its effective due date, remains governed as upcoming, or becomes overdue under official control.
WF-007
Workflow name: Mobility Closure
Scope layer: institutional_core
Purpose: Govern the terminal official closure of a mobility record after end-of-mobility obligations have been completed.
Primary entity or record: Mobility record
Actors: Coordinator, Authorized staff, System
Trigger: Attempt to formally close a mobility record.
Preconditions:
The mobility record has reached the post-execution part of its lifecycle.
Mandatory end-of-mobility procedures and final document obligations are checkable.
Main states: active, completed, closed
Main flow:
The mobility record reaches completed after the mobility execution phase ends.
Authorized staff verify fulfillment of all mandatory end-of-mobility procedures and final document obligations.
If the closure condition is satisfied, authorized staff move the record to closed.
Alternate / exception flows:
Closure is blocked while any mandatory end-of-mobility obligation remains incomplete.
Unauthorized closure attempts are blocked.
Invalid transitions are blocked.
Guard conditions / business rule references:
Formal closure is reserved to authorized actors.
Only valid lifecycle transitions are allowed.
Closure requires all mandatory end-of-mobility procedures and final document obligations to be fulfilled.
BR refs: BR-006, BR-014, BR-039, BR-045
Source requirement IDs: REQ-022, REQ-027, REQ-028, REQ-036, REQ-072, REQ-073, REQ-075
Source business rule IDs: BR-006, BR-014, BR-039, BR-045
End conditions: The mobility record is either retained in a non-final institutional state pending remaining obligations, or reaches formal closed.
WF-008
Workflow name: Personal Data Export and Deletion Request Handling
Scope layer: institutional_core
Purpose: Govern user-facing privacy-rights request processing for personal-data export and deletion without violating authorization, confidentiality, or retention constraints.
Primary entity or record: Personal-data rights request
Actors: User, Authorized processing staff, Administrator, System
Trigger: A user requests personal-data export or deletion.
Preconditions:
The acting user is authenticated for self-service privacy actions.
The requested data concerns that same user.
Main states: export_requested, export_fulfilled, export_limited_or_denied, deletion_requested, deletion_fulfilled, deletion_limited_or_denied, closed
Main flow:
The user requests export of that user’s personal data, moving the request to export_requested.
The export request is evaluated against institutional confidentiality and legal constraints.
If permitted, a compliant export is produced and the request moves to export_fulfilled.
The user requests deletion of account or personal data, moving the request to deletion_requested.
The deletion request is evaluated against mandatory retention obligations.
If deletion is permitted for the requested scope, the request moves to deletion_fulfilled.
Fulfilled or limited or denied requests move to closed when no further request handling remains.
Alternate / exception flows:
Export of another user’s data is blocked.
Export may be limited or denied where disclosure is restricted by institutional confidentiality or legal constraints.
Deletion may be limited or denied where mandatory retention obligations prevent full deletion.
Viewing personal data remains an authorized direct-access function and is not modeled as a lifecycle state in this workflow.
Where acknowledgement recording is required, consent or policy acceptance is recorded as authoritative proof, but that acknowledgement does not create a separate request lifecycle here.
Guard conditions / business rule references:
Protected data is accessible only to authorized users.
Export is limited to the requesting user’s own data and excludes restricted disclosures.
Deletion cannot conflict with mandatory retention obligations.
A recorded acknowledgement is authoritative proof where required.
BR refs: BR-049, BR-050, BR-051, BR-085
Source requirement IDs: REQ-085, REQ-086, REQ-087, REQ-088, REQ-089
Source business rule IDs: BR-049, BR-050, BR-051, BR-085
End conditions: The request is fulfilled within permitted scope, limited or denied for valid governance reasons, and then closed.
WF-009
Workflow name: Social Profile, Visibility, Discoverability, and Consent Lifecycle
Scope layer: social_support
Purpose: Govern when a student can participate in the social-support layer and under what visibility, discoverability, and contactability settings.
Primary entity or record: Social-support profile
Actors: Student, Administrator, System
Trigger: An eligible student creates or updates a social profile, or changes social visibility or consent settings.
Preconditions:
Social-support features are enabled for the student’s eligible Erasmus context.
The student is authenticated and eligible for social participation.
Main states: unavailable, profile_active_private, discoverable, contactable, consent_revoked_or_restricted
Main flow:
An eligible student creates and maintains a permitted social-support profile.
The profile begins in a private or non-exposed state unless settings and required consent permit more visibility.
The student configures field visibility.
If policy requires explicit consent and consent is given, the profile may become discoverable.
If contactability is enabled under permitted settings, the profile may also become contactable.
Alternate / exception flows:
If social features are not enabled for the user’s scope, the profile remains unavailable.
Revocation of discovery or messaging consent moves the profile to consent_revoked_or_restricted and stops new matching exposure and new contact attempts.
Direct personal contact details remain hidden unless explicitly exposed through permitted settings.
Administrative scoping or moderation restrictions may reduce or suspend social-access privileges.
Guard conditions / business rule references:
Social access is limited to eligible users in active social scope.
Field visibility is governed by student settings.
Discoverability or contactability requires explicit consent where policy requires it.
Direct personal contact details are visible only when explicitly exposed.
Consent revocation stops new exposure and new contact attempts but does not erase retained history by itself.
BR refs: BR-054, BR-055, BR-056, BR-057, BR-058, BR-059, BR-075, BR-076, BR-079
Source requirement IDs: REQ-106, REQ-107, REQ-124, REQ-125, REQ-133, REQ-134, REQ-135, REQ-136
Source business rule IDs: BR-054, BR-055, BR-056, BR-057, BR-058, BR-059, BR-075, BR-076, BR-079
End conditions: The profile is either unavailable by scope, active under controlled visibility or contactability, or restricted after consent or governance changes.
WF-010
Workflow name: Social Discovery and Connection Lifecycle
Scope layer: social_support
Purpose: Govern Erasmus-context peer discovery and the lifecycle of a social connection request.
Primary entity or record: Social connection
Actors: Student sender, Student recipient, System
Trigger: A student searches for eligible peers and sends a connection request.
Preconditions:
Both students are eligible within active social scope.
Discoverability and contactability settings permit the action.
No active block prevents the pair from interacting.
Main states: pending, accepted, rejected, cancelled, expired, blocked, closed
Main flow:
A student discovers eligible peers using supported Erasmus-context attributes and supported search, filter, and sort criteria.
Discovery remains separate from official institutional record search and official procedure navigation.
The sender sends a connection request and the connection enters pending.
The recipient accepts the request and the connection moves to accepted.
The accepted connection appears in the student’s connection views and enables downstream messaging permission.
When mobility validity conditions end, the connection automatically moves to expired or closed.
Alternate / exception flows:
The recipient may reject the request, moving it to rejected.
The sender may cancel a pending request, moving it to cancelled.
Either student may block the other, moving the relationship to blocked.
Consent revocation or loss of active scope prevents new matching and new connection attempts.
Inaccessible profiles are not returned by discovery, search, or filtering.
Guard conditions / business rule references:
Discovery, search, and sorting may use only supported Erasmus-context or permitted text criteria.
Sending a request requires eligibility, active scope, allowed discoverability and contact settings, and no active block.
Only the recipient may accept or reject; only the sender may cancel while pending.
Messaging permission exists only after acceptance.
Expired, closed, or blocked relationships do not restore active contactability.
BR refs: BR-056, BR-057, BR-060, BR-061, BR-062, BR-063, BR-064, BR-065, BR-066, BR-069, BR-075, BR-077, BR-078, BR-080
Source requirement IDs: REQ-108, REQ-109, REQ-110, REQ-111, REQ-112, REQ-113, REQ-114, REQ-115, REQ-116, REQ-125, REQ-126, REQ-128, REQ-129, REQ-130, REQ-134, REQ-135, REQ-136
Source business rule IDs: BR-056, BR-057, BR-060, BR-061, BR-062, BR-063, BR-064, BR-065, BR-066, BR-069, BR-075, BR-077, BR-078, BR-080
End conditions: The connection remains in a valid active or historical lifecycle state, with accepted, rejected, cancelled, expired, blocked, and closed acting as controlled outcomes.
WF-011
Workflow name: Student Messaging Permission and Post-Closure Retention
Scope layer: social_support
Purpose: Govern when student-to-student messaging is permitted, stopped, and historically retained.
Primary entity or record: Messaging permission context or message thread
Actors: Connected students, System, Administrator in approved moderation or legal process
Trigger: A connection becomes accepted, a message is sent, or the connection, consent, or block status changes.
Preconditions:
The students are linked by a valid accepted connection.
No active block or restriction prevents messaging.
Main states: not_permitted, permitted, blocked, expired_or_closed_retained
Main flow:
Messaging starts in not_permitted.
When the connection reaches accepted, messaging becomes permitted.
Students may exchange messages while the accepted connection remains valid.
If the connection later expires or closes, the permission ends and the conversation moves into retained historical status.
Alternate / exception flows:
Attempted messaging before connection acceptance is blocked.
An active user block immediately ends messaging permission and prevents further messaging or new connection actions.
Consent revocation stops new contact attempts going forward.
Coordinators involved only in institutional processing cannot access private messages unless an approved moderation, safeguarding, or legal-access process explicitly authorizes access.
Retained message history remains governed by configured post-closure visibility and retention rules.
Guard conditions / business rule references:
Messaging is permitted only after accepted connection.
Blocked, rejected, cancelled, expired, or closed states do not grant messaging permission.
Private message access is restricted from institutional coordinators absent approved exceptional process.
Retained history does not restore active messaging rights.
BR refs: BR-063, BR-064, BR-065, BR-074, BR-076, BR-077, BR-078, BR-079
Source requirement IDs: REQ-114, REQ-115, REQ-116, REQ-117, REQ-127, REQ-132, REQ-134, REQ-136
Source business rule IDs: BR-063, BR-064, BR-065, BR-074, BR-076, BR-077, BR-078, BR-079
End conditions: Messaging is either actively permitted under an accepted connection, stopped by governance or lifecycle change, or retained as non-restorative history after closure or blocking.
WF-012
Workflow name: Recommendation and Opinion Publication Lifecycle
Scope layer: social_support
Purpose: Govern how Erasmus-relevant recommendations and opinions are created, published, edited, deleted, discovered, and favorited under visibility and moderation controls.
Primary entity or record: Recommendation or opinion content item
Actors: Student author, Viewing student, System
Trigger: A student creates, edits, deletes, searches, or favorites a recommendation or opinion.
Preconditions:
Social-support scope is enabled for the acting user.
The acting student is eligible for the social-support layer.
Main states: draft_or_editing, published_visible, updated_visible, author_deleted, hidden_or_restricted, removed
Main flow:
The author creates Erasmus-relevant recommendation or opinion content with supported contextual metadata.
If valid and in scope, the item becomes published_visible.
Other students may discover only content that is currently accessible under scope, visibility, and moderation conditions.
Accessible content may be searched, filtered, and favorited for later retrieval.
The author may edit the content, moving it through updated_visible.
The author may delete the content, moving it to author_deleted, unless moderation or retention prevents that action.
Alternate / exception flows:
Out-of-scope or invalid content cannot be published as valid social-support content.
Hidden, restricted, or removed content is not discoverable to ordinary students.
Content later affected by moderation moves to the moderation-controlled path rather than remaining ordinarily visible.
Guard conditions / business rule references:
Content must remain Erasmus-relevant and use supported categories or metadata.
Only the author may edit or delete unless moderation or retention limits that action.
Only currently accessible content may be searchable, favoritable, or viewable.
BR refs: BR-067, BR-068, BR-069, BR-072, BR-079, BR-080
Source requirement IDs: REQ-119, REQ-120, REQ-121, REQ-122, REQ-123, REQ-131, REQ-135, REQ-136
Source business rule IDs: BR-067, BR-068, BR-069, BR-072, BR-079, BR-080
End conditions: The content remains visible and governable, is author-deleted where permitted, or is moved into moderation-controlled hidden, removed, or restricted outcomes.
WF-013
Workflow name: Moderation Report, Threshold Obscuring, Review, and Outcome
Scope layer: social_support
Purpose: Govern how social content or interactions are reported, automatically threshold-hidden when configured, reviewed by authorized moderators, and resolved.
Primary entity or record: Moderation report or reported social entity
Actors: Reporting student, Authorized administrator or moderator, System
Trigger: A student files a report against a supported social entity, or a configured report threshold is reached.
Preconditions:
The target is a supported reportable social entity.
The acting moderator is authorized for moderation actions.
Main states: reported, threshold_hidden_pending_review, in_review, resolved_hidden, resolved_removed, resolved_restricted, cleared
Main flow:
A student reports a supported social entity and the case enters reported.
If the configured report threshold is reached, the content is automatically obscured or temporarily suspended and enters threshold_hidden_pending_review.
An authorized moderator reviews the report and the target enters in_review.
The moderator records the outcome.
If moderation action is required, the target moves to resolved_hidden, resolved_removed, or resolved_restricted depending on the decision.
If the content is cleared, it moves to cleared, restoring ordinary visibility where appropriate.
Alternate / exception flows:
Unsupported entities cannot be reported through the moderation workflow.
Unauthorized users cannot perform moderation review or action.
Moderation may restrict social-access privileges as well as specific content visibility.
Private message access remains restricted unless the approved moderation, safeguarding, or legal-access path explicitly authorizes access for the review.
Guard conditions / business rule references:
Only supported social entities are reportable.
Only authorized moderation actors may review and act.
Threshold-hidden content stays ineligible for ordinary student visibility until a clearing moderation decision is recorded.
Moderation may hide, remove, or restrict content or privileges.
Sensitive moderation and consent or block lifecycle changes must remain auditable.
BR refs: BR-070, BR-071, BR-072, BR-073, BR-074, BR-079
Source requirement IDs: REQ-117, REQ-118, REQ-131, REQ-132, REQ-136, REQ-137
Source business rule IDs: BR-070, BR-071, BR-072, BR-073, BR-074, BR-079
End conditions: The report is resolved with a recorded moderation outcome, or the target is cleared and restored to ordinary access conditions where applicable.
WF-014
Workflow name: User Account Registration, Verification, and Controlled Credential Recovery
Scope layer: institutional_core
Purpose: Govern how a student registers, completes required verification when applicable, becomes eligible for first full account access, and uses controlled password recovery when that authentication mode is enabled.
Primary entity or record: User account
Actors: Student, System, External institutional identity provider when enabled
Trigger: A student starts account registration using an institutionally permitted authentication method, or an eligible user initiates credential recovery when password-based authentication is enabled.
Preconditions:
A permitted registration or authentication method is available.
Where external institutional authentication is used, the integration is enabled.
Password recovery applies only when password-based authentication is enabled.
Main states: registration_started, registered, pending_verification, verified, active
Main flow:
The student initiates registration through an institutionally permitted method.
When the required registration data or identity handoff is accepted, the account enters registered.
If institutional policy requires verification before first full access, the account moves to pending_verification.
Once the required verification is completed, the account moves to verified.
On first full successful access after required verification gates are satisfied, the account becomes active.
If institutional policy does not require verification, the account may move directly from registered to active.
Alternate / exception flows:
Registration through a non-permitted method is blocked.
Incomplete required verification prevents first full access.
If external identity integration fails during registration, the action halts and no ambiguous activation outcome is applied.
When password-based authentication is enabled, a user may initiate a controlled password-recovery path for lost credentials.
Recovery does not bypass required verification, role controls, or authentication-state controls.
Until the controlled recovery process is satisfied, protected access remains unavailable; after successful reset, the account returns to the access-valid state allowed by its verification and authentication status.
Authentication after activation remains governed by the platform’s normal access-control rules and is outside the registration portion of this workflow.
Guard conditions / business rule references:
Registration is permitted only through institutionally permitted authentication methods.
First full access is not permitted until required verification is completed where policy requires it.
Password recovery is permitted only when password-based authentication is enabled and only through a controlled recovery process.
Controlled recovery cannot activate an account that has not satisfied required verification or whose authentication state is expired or revoked.
Protected functions remain inaccessible until the account reaches an access-valid state.
Integration-dependent registration failures must not create partial active status.
BR refs: BR-001, BR-002, BR-003, BR-047, BR-083
Source requirement IDs: REQ-001, REQ-002, REQ-004, REQ-005, REQ-006, REQ-083, REQ-090
Source business rule IDs: BR-001, BR-002, BR-003, BR-047, BR-083
End conditions: The account reaches active for first full access, or remains blocked in a pre-access state until required verification, identity conditions, or controlled recovery conditions are satisfied.
WF-015
Workflow name: Delegation of Review Authority
Scope layer: institutional_core
Purpose: Govern how authorized staff delegate review responsibility for selected records, procedures, or submissions to another authorized coordinator, and how that delegation remains traceable over time.
Primary entity or record: Delegation grant
Actors: Delegating authorized staff, Delegate coordinator, System, Administrator where governance requires it
Trigger: An authorized staff member initiates delegation of review responsibility.
Preconditions:
The delegator is authorized to perform delegation.
The intended delegate is another authorized coordinator.
The delegated scope is explicitly defined.
Main states: proposed, active, revoked, expired, closed
Main flow:
Authorized staff initiate a delegation grant and define the delegated scope.
The system validates that the intended delegate is another authorized coordinator for the permitted institutional context.
Once the delegation is accepted as valid under governance rules, the grant becomes active.
While active, the delegate may perform review actions only within the delegated scope.
When the delegation reaches its end condition, it becomes revoked or expired.
Historical delegation records then move to closed for retained traceability.
Alternate / exception flows:
Delegation is blocked if the recipient is not an authorized coordinator.
Delegation is blocked if the delegated scope is missing or not explicit.
Delegation does not enlarge the delegate’s authority outside the delegated scope.
Revocation ends future delegated authority but preserves prior traceability.
If the delegator’s own underlying authorization or institutional access is revoked or suspended, any active downstream delegation grant moves to revoked and no further delegated review action is permitted.
Guard conditions / business rule references:
Delegation is a reserved action and requires explicit role authorization.
Delegation is valid only when the recipient is another authorized coordinator and the delegated scope is explicitly defined.
Delegation must preserve traceability of delegator, delegate, delegated scope, and effective time.
Review authority exercised under delegation remains bounded to the delegated scope and auditable as a critical official-processing action.
Loss of the delegator’s own governing authorization invalidates future downstream delegated authority.
BR refs: BR-005, BR-006, BR-007, BR-042, BR-043, BR-045
Source requirement IDs: REQ-009, REQ-010, REQ-011, REQ-067, REQ-068, REQ-072
Source business rule IDs: BR-005, BR-006, BR-007, BR-042, BR-043, BR-045
End conditions: The delegation remains active within its defined scope, or ends as revoked or expired with preserved historical closure and traceability.
4. Scope Notes
institutional_core
The institutional core includes identity and authentication lifecycle, mobility records, official procedure catalog management, procedure versioning and publication, lifecycle and status control, document submission and validation, required signatures, deadlines and exceptions, coordinator review and delegation, privacy-rights request handling, auditability, integrations, and formal mobility closure. It remains the authoritative workflow backbone for ErasmusMate.
social_support
The social-support layer includes eligible student profiles, privacy-controlled discoverability, Erasmus-context discovery, connection requests and lifecycle, mutual-opt-in messaging, recommendations, opinions, reporting, blocking, moderation actions, social notification preferences, and social audit traceability. It remains explicitly secondary and bounded by institutional controls.
explicitly_out_of_scope
This catalog does not introduce business rules discovery, domain model design, acceptance criteria, architecture, API design, database design, or UI design. It also does not reopen requirements scope or business-rules scope and does not add new product features beyond the approved baseline.
5. Readiness Note
This frozen workflow catalog is ready for the next phase because it now covers the approved lifecycle families, preserves stable workflow IDs, incorporates the final low-risk corrections from the freeze-stage review, remains traceable to the approved requirements and business rules, and stays cleanly separated from both business rules and implementation design.

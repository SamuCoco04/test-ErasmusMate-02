Below is the frozen final business rules catalog for ErasmusMate. It preserves the approved requirements scope, keeps stable IDs wherever possible, applies the final low-risk fixes from Gemini’s final review, and remains separated from workflows and implementation design.
1. Final Assumptions
These assumptions remain bounded by the approved requirements baseline and the business-rules brief.
A1. A mobility record represents one governed mobility process for one student and is the primary unit of official processing.
A2. Procedure applicability is determined from configured Erasmus context, including institution, destination, mobility type, and lifecycle phase.
A3. Procedure definitions may vary by institution and context, and may include documents, deadlines, signatures, validations, and review responsibility.
A4. Coordinator decisions remain institutionally authoritative even when the platform performs automated validation or status control.
A5. Reopening, resubmission, exception handling, and deadline extension are part of the official mobility lifecycle and must remain traceable.
A6. When a requirement says “when configured,” “when enabled,” or “when required,” the governing business condition is institutionally configurable rather than universally mandatory.
A7. Social-support features are available only within an Erasmus-relevant context and do not replace official institutional processing.
A8. Social visibility, contactability, moderation, retention, and post-closure access are governed independently from official mobility obligations, except where legal or institutional controls require overlap.
A9. External identity, notification, document-storage, reference-data, and e-signature services may exist, but their use is conditional on institutional enablement.
A10. Approved moderation, safeguarding, or legal-access processes may exist outside ErasmusMate and may condition exceptional access to restricted social data.
2. Final Constraints
These constraints preserve the approved scope boundary and the intended use of the catalog as a baseline for later derivation work.
C1. The FINAL REQUIREMENTS DOCUMENT prevails over convenience assumptions or prior drafts if conflict appears.
C2. The catalog derives only domain constraints, decision logic, validation logic, permission logic, lifecycle restrictions, moderation/privacy rules, retention rules, and closure conditions.
C3. No new product scope is introduced.
C4. Workflows, state diagrams, domain model, acceptance criteria, architecture, API design, UI design, and database design remain out of scope.
C5. Institutional-core rules take precedence over social-support rules where both touch the same user or record.
C6. Social-support rules must not weaken official permissions, deadlines, validation, auditability, or closure requirements.
C7. Rules must be independently testable and must govern a concrete decision, constraint, permission, restriction, or condition.
C8. Configuration-dependent behavior is allowed only where the approved requirements already establish configurability.
C9. The catalog keeps institutional-core and social-support rules clearly distinguishable.
C10. Retention, traceability, and auditability constraints apply even when user-facing access, visibility, or active processing ends.
3. Final Business Rules
BR-020 remains retired and merged into BR-019 to preserve stable numbering while avoiding duplication. The only freeze-stage changes from the consolidated baseline are the tighter wording of BR-047 and the addition of BR-085 for REQ-086.
BR-001
Rule statement: Student account registration is permitted only through institutionally permitted authentication methods.
Rule type: eligibility
Source requirement IDs: REQ-001, REQ-006
Scope layer: institutional_core
Rationale: Constrains who may enter the official platform.
BR-002
Rule statement: First full account access is not permitted until required verification has been completed when institutional policy requires verification.
Rule type: eligibility
Source requirement IDs: REQ-005
Scope layer: institutional_core
Rationale: Separates registration from verified operational access.
BR-003
Rule statement: A user may access only the functions explicitly permitted to the user’s assigned platform role.
Rule type: permission
Source requirement IDs: REQ-002, REQ-007
Scope layer: institutional_core
Rationale: Formal RBAC control.
BR-004
Rule statement: Access to a mobility record is restricted to users authorized for that mobility context.
Rule type: permission
Source requirement IDs: REQ-008, REQ-089
Scope layer: institutional_core
Rationale: Protects record-level confidentiality.
BR-005
Rule statement: A coordinator’s review and decision authority is valid only within the coordinator’s assigned records, institutions, destinations, or procedure sets.
Rule type: permission
Source requirement IDs: REQ-010
Scope layer: institutional_core
Rationale: Prevents overreach of review authority.
BR-006
Rule statement: Approval, rejection, publication, locking, delegation, reopening, and formal closure are reserved actions and require explicit role authorization.
Rule type: permission
Source requirement IDs: REQ-011
Scope layer: institutional_core
Rationale: Governs sensitive lifecycle actions.
BR-007
Rule statement: Platform role assignment, role update, role revocation, and institutional configuration management are administrator-governed actions only.
Rule type: governance
Source requirement IDs: REQ-009, REQ-064
Scope layer: institutional_core
Rationale: Centralizes security and operational control.
BR-008
Rule statement: Official procedure applicability is determined by the configured institution, destination, mobility type, and lifecycle phase of the student’s mobility record.
Rule type: applicability
Source requirement IDs: REQ-012, REQ-019, REQ-020, REQ-021
Scope layer: institutional_core
Rationale: Defines how obligations become applicable.
BR-009
Rule statement: Only a published procedure definition may govern active student obligations.
Rule type: applicability
Source requirement IDs: REQ-013, REQ-014, REQ-018, REQ-023
Scope layer: institutional_core
Rationale: Draft procedures are not operational.
BR-010
Rule statement: A superseded procedure definition remains traceable for historical actions but does not become the governing definition for new applicability.
Rule type: governance
Source requirement IDs: REQ-015, REQ-016, REQ-074
Scope layer: institutional_core
Rationale: Preserves historical integrity while allowing revision.
BR-011
Rule statement: A locked procedure definition may not be modified further unless a separately authorized governance action changes its status.
Rule type: governance
Source requirement IDs: REQ-017, REQ-023
Scope layer: institutional_core
Rationale: Protects institutional procedure stability.
BR-012
Rule statement: Each applicable procedure may impose only the documents, signers, deadlines, review responsibilities, and validations that are explicitly configured for that procedure.
Rule type: applicability
Source requirement IDs: REQ-021
Scope layer: institutional_core
Rationale: Keeps obligations configuration-bound and testable.
BR-013
Rule statement: A student’s official obligation set is limited to the procedures applicable to that student’s mobility record.
Rule type: applicability
Source requirement IDs: REQ-018
Scope layer: institutional_core
Rationale: Prevents unrelated obligations from appearing.
BR-014
Rule statement: Only state transitions permitted by the configured mobility, procedure, document, signature, or exception state model are valid.
Rule type: state_transition
Source requirement IDs: REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
Scope layer: institutional_core
Rationale: Formalizes lifecycle constraints.
BR-015
Rule statement: A submitted document version becomes immutable after submission unless it is formally reopened for correction or resubmission.
Rule type: state_transition
Source requirement IDs: REQ-024, REQ-038, REQ-047
Scope layer: institutional_core
Rationale: Protects the boundary between draft and submitted document versions.
BR-016
Rule statement: Resubmission is permitted only for a previously rejected submission after correction.
Rule type: state_transition
Source requirement IDs: REQ-031
Scope layer: institutional_core
Rationale: Prevents unrestricted repeated resubmission.
BR-017
Rule statement: A locked or finalized submission may not be resubmitted unless it has been formally reopened by authorized staff.
Rule type: state_transition
Source requirement IDs: REQ-032, REQ-105
Scope layer: institutional_core
Rationale: Adds a hard lifecycle gate.
BR-018
Rule statement: Reopening a submission or obligation requires authorized staff action and a recorded rationale.
Rule type: exception
Source requirement IDs: REQ-105
Scope layer: institutional_core
Rationale: Reopening is exceptional and traceable.
BR-019
Rule statement: Final submission is not allowed unless all mandatory documents, all mandatory structured fields, and all required submission metadata configured for the procedure are present and complete.
Rule type: validation
Source requirement IDs: REQ-037, REQ-040, REQ-041
Scope layer: institutional_core
Rationale: Establishes one complete and testable submission-completeness gate.
BR-021
Rule statement: A file may not be accepted as a valid uploaded document for an official submission unless it satisfies the configured format and size constraints.
Rule type: validation
Source requirement IDs: REQ-039
Scope layer: institutional_core
Rationale: Makes file admissibility explicit at upload acceptance.
BR-022
Rule statement: When technical file-quality criteria are required for an official submission, a file may not be accepted for that submission unless it satisfies the configured criteria.
Rule type: validation
Source requirement IDs: REQ-104
Scope layer: institutional_core
Rationale: Makes file-quality control objective and testable.
BR-023
Rule statement: When cross-document consistency control is configured, shared data fields across related mobility documents must be mutually consistent.
Rule type: validation
Source requirement IDs: REQ-043
Scope layer: institutional_core
Rationale: Prevents contradictory official records.
BR-024
Rule statement: A detected blocking inconsistency prevents finalization of the affected submission until the inconsistency is corrected or otherwise resolved through approved exception or reopening logic.
Rule type: validation
Source requirement IDs: REQ-044, REQ-069, REQ-070, REQ-071, REQ-105
Scope layer: institutional_core
Rationale: Converts validation findings into operational restriction.
BR-025
Rule statement: The latest accepted version of an official document is the authoritative version for current processing, while prior versions remain historical and auditable.
Rule type: governance
Source requirement IDs: REQ-046, REQ-049
Scope layer: institutional_core
Rationale: Distinguishes current authority from history.
BR-026
Rule statement: Signature obligations exist only for documents and stages whose governing procedure configuration explicitly requires signatures.
Rule type: signature
Source requirement IDs: REQ-021, REQ-033, REQ-042
Scope layer: institutional_core
Rationale: Prevents implicit signature requirements.
BR-027
Rule statement: A submission may not advance beyond a signature-gated stage until all signatures required for the current routing stage are completed.
Rule type: signature
Source requirement IDs: REQ-033, REQ-035, REQ-042
Scope layer: institutional_core
Rationale: Governs advancement under multi-signer logic.
BR-028
Rule statement: Only a signer with current pending signature responsibility may perform the corresponding signature action.
Rule type: signature
Source requirement IDs: REQ-033, REQ-034
Scope layer: institutional_core
Rationale: Prevents unauthorized signature completion.
BR-029
Rule statement: A required signature in rejected, expired, or cancelled state does not satisfy a mandatory signature obligation.
Rule type: signature
Source requirement IDs: REQ-034, REQ-042
Scope layer: institutional_core
Rationale: Clarifies which signature status counts.
BR-030
Rule statement: A coordinator may approve a submission only if all configured blocking validations have passed and all mandatory signature conditions for that stage are satisfied.
Rule type: validation
Source requirement IDs: REQ-029, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-044
Scope layer: institutional_core
Rationale: Binds approval to objective readiness.
BR-031
Rule statement: A rejection decision must record a rationale, and any later correction path must follow the permitted reopening or resubmission rules.
Rule type: state_transition
Source requirement IDs: REQ-030, REQ-031, REQ-105
Scope layer: institutional_core
Rationale: Separates rejection from subsequent correction rights.
BR-032
Rule statement: Review comments or deficiency notes supplement formal review decisions but do not replace approval, rejection, or reopening as governing actions.
Rule type: governance
Source requirement IDs: REQ-048, REQ-029, REQ-030, REQ-105
Scope layer: institutional_core
Rationale: Keeps notes non-authoritative by themselves.
BR-033
Rule statement: When a deadline is configured, the corresponding procedure, submission, review, or resubmission obligation is governed by that official due date.
Rule type: deadline
Source requirement IDs: REQ-050, REQ-054
Scope layer: institutional_core
Rationale: Establishes the authoritative due date.
BR-034
Rule statement: Submission after the applicable due date is not permitted unless an approved extension or approved exception changes that obligation.
Rule type: deadline
Source requirement IDs: REQ-053, REQ-055
Scope layer: institutional_core
Rationale: Formal lateness control.
BR-035
Rule statement: An approved deadline extension or approved exception affects only the specific deadline, document obligation, or procedure condition it explicitly covers.
Rule type: exception
Source requirement IDs: REQ-055, REQ-071
Scope layer: institutional_core
Rationale: Prevents blanket override effects.
BR-036
Rule statement: Only authorized staff may approve or reject an exception request, and each exception decision must record rationale.
Rule type: exception
Source requirement IDs: REQ-070
Scope layer: institutional_core
Rationale: Governs exception authority.
BR-037
Rule statement: Exception requests may modify only deadlines, document obligations, or procedure conditions that are within the approved exception scope.
Rule type: exception
Source requirement IDs: REQ-069, REQ-071
Scope layer: institutional_core
Rationale: Limits exception reach.
BR-038
Rule statement: An obligation becomes overdue when its applicable due date passes and it remains unfulfilled without an approved override.
Rule type: deadline
Source requirement IDs: REQ-053, REQ-056
Scope layer: institutional_core
Rationale: Defines lateness state.
BR-039
Rule statement: Formal closure of a mobility record is permitted only after all mandatory end-of-mobility procedures and final document obligations have been fulfilled.
Rule type: closure
Source requirement IDs: REQ-036
Scope layer: institutional_core
Rationale: Protects end-of-lifecycle completeness.
BR-040
Rule statement: Users may manage official notification delivery preferences only for supported official channels that are not mandatory institutional communications.
Rule type: governance
Source requirement IDs: REQ-062
Scope layer: institutional_core
Rationale: Preserves mandatory institutional communication.
BR-041
Rule statement: Official system-generated notifications related to mobility processing form part of the official processing history and must remain traceable.
Rule type: retention
Source requirement IDs: REQ-057, REQ-058, REQ-059, REQ-060, REQ-061, REQ-063
Scope layer: institutional_core
Rationale: Makes official communications auditable.
BR-042
Rule statement: Delegation of review responsibility is valid only when the recipient is another authorized coordinator and the delegated scope is explicitly defined.
Rule type: permission
Source requirement IDs: REQ-067
Scope layer: institutional_core
Rationale: Prevents invalid delegation.
BR-043
Rule statement: Delegation does not remove the need to preserve traceability of the delegator, delegate, delegated scope, and effective time.
Rule type: governance
Source requirement IDs: REQ-068, REQ-072
Scope layer: institutional_core
Rationale: Keeps delegated responsibility auditable.
BR-044
Rule statement: The procedure version in effect when a submission or decision occurs remains the governing reference for later inspection and audit of that action.
Rule type: governance
Source requirement IDs: REQ-015, REQ-016, REQ-074
Scope layer: institutional_core
Rationale: Freezes historical governance context.
BR-045
Rule statement: Critical official-processing actions must generate auditable records containing actor, action type, target record, timestamp, outcome, and relevant prior/new state where applicable.
Rule type: governance
Source requirement IDs: REQ-072, REQ-075
Scope layer: institutional_core
Rationale: Formal auditability policy.
BR-046
Rule statement: Later operational or integration failures do not invalidate previously accepted records or previously preserved audit history.
Rule type: retention
Source requirement IDs: REQ-095, REQ-096, REQ-099
Scope layer: institutional_core
Rationale: Preserves institutional record continuity.
BR-047
Rule statement: An integration-dependent official action that fails or times out must halt the affected transaction, retain the status that existed immediately before the action began, and apply no partial status updates.
Rule type: governance
Source requirement IDs: REQ-061, REQ-083, REQ-095, REQ-096, REQ-098
Scope layer: institutional_core
Rationale: Prevents ambiguous outcomes after integration failure and makes the failure-state rule strictly testable.
BR-048
Rule statement: When an integration failure blocks submission, review, signature collection, synchronization, or document retrieval, the blocking condition must be visible to authorized operational users.
Rule type: governance
Source requirement IDs: REQ-084, REQ-097, REQ-098
Scope layer: institutional_core
Rationale: Makes blocked processing operationally actionable.
BR-049
Rule statement: Access to personal data and submitted official documents is restricted to users authorized for the relevant mobility context and role.
Rule type: privacy
Source requirement IDs: REQ-085, REQ-089
Scope layer: institutional_core
Rationale: Formal personal-data access restriction.
BR-050
Rule statement: Account deletion or personal-data deletion is not permitted where it conflicts with mandatory institutional or legal retention obligations.
Rule type: retention
Source requirement IDs: REQ-087
Scope layer: institutional_core
Rationale: Prevents unlawful deletion.
BR-051
Rule statement: Consent acknowledgements and policy acknowledgements are mandatory only where institutional or legal policy requires them, and a recorded acknowledgement is the authoritative proof of acceptance.
Rule type: privacy
Source requirement IDs: REQ-088
Scope layer: institutional_core
Rationale: Formalizes required acknowledgements.
BR-052
Rule statement: Student self-service updates are limited to the profile fields and mobility-context fields that institutional policy permits the student to maintain.
Rule type: permission
Source requirement IDs: REQ-101, REQ-102
Scope layer: institutional_core
Rationale: Prevents student modification of restricted data.
BR-053
Rule statement: Where institutional synchronization is enabled, manual completion or correction of mobility-profile fields is permitted only for fields and cases that institutional policy allows.
Rule type: governance
Source requirement IDs: REQ-077, REQ-102
Scope layer: institutional_core
Rationale: Aligns synchronization behavior to the requirements without asserting unsupported data-authority precedence.
BR-054
Rule statement: Social-support access is limited to eligible users within the permitted Erasmus context and within any active feature scope configured by administration.
Rule type: eligibility
Source requirement IDs: REQ-106, REQ-108, REQ-135
Scope layer: social_support
Rationale: Defines who may participate socially.
BR-055
Rule statement: A social-support profile may contain only permitted Erasmus-context data and optional user-supplied fields allowed by platform policy.
Rule type: validation
Source requirement IDs: REQ-106
Scope layer: social_support
Rationale: Constrains social profile content.
BR-056
Rule statement: Discoverability or contactability through the social-support layer requires explicit consent whenever institutional or legal policy requires that consent.
Rule type: privacy
Source requirement IDs: REQ-107, REQ-124
Scope layer: social_support
Rationale: Formal consent gate.
BR-057
Rule statement: Revocation of social discovery or messaging consent immediately stops new matching exposure and new contact attempts, while retained historical records remain subject to retention rules.
Rule type: privacy
Source requirement IDs: REQ-125, REQ-136
Scope layer: social_support
Rationale: Separates forward-facing access from retained history.
BR-058
Rule statement: Visibility of each social-support profile field is governed by the student’s configured visibility settings, and non-exposed fields must not be disclosed to other students.
Rule type: privacy
Source requirement IDs: REQ-107
Scope layer: social_support
Rationale: Formalizes field-level visibility control.
BR-059
Rule statement: A student’s direct personal contact details are visible to other students only if the student has explicitly exposed those details through permitted profile settings.
Rule type: privacy
Source requirement IDs: REQ-133
Scope layer: social_support
Rationale: Prevents implicit disclosure of direct contact data.
BR-060
Rule statement: Social discovery, search, and sorting may use only supported Erasmus-context attributes and permitted text criteria, and must remain separate from official procedure navigation and official institutional record search.
Rule type: applicability
Source requirement IDs: REQ-108, REQ-109, REQ-129, REQ-130
Scope layer: social_support
Rationale: Preserves scope separation and testability.
BR-061
Rule statement: Sending a connection request is permitted only when both students are eligible, within active social scope, permitted by discoverability/contact settings, and not prevented by an active block.
Rule type: permission
Source requirement IDs: REQ-108, REQ-110, REQ-116, REQ-124, REQ-125, REQ-135
Scope layer: social_support
Rationale: Governs valid connection initiation.
BR-062
Rule statement: Only the recipient may accept or reject a pending connection request, and only the sender may cancel it while it remains pending.
Rule type: permission
Source requirement IDs: REQ-111, REQ-112, REQ-113
Scope layer: social_support
Rationale: Defines authority over pending requests.
BR-063
Rule statement: Student-to-student messaging is permitted only after the connection reaches accepted state.
Rule type: permission
Source requirement IDs: REQ-114
Scope layer: social_support
Rationale: Enforces strict mutual opt-in.
BR-064
Rule statement: An active block between two students prohibits further messaging and new connection actions between that pair while the block remains active.
Rule type: moderation
Source requirement IDs: REQ-116
Scope layer: social_support
Rationale: Converts blocking into enforceable restriction.
BR-065
Rule statement: A rejected, cancelled, expired, blocked, or closed connection does not grant active messaging permission.
Rule type: state_transition
Source requirement IDs: REQ-113, REQ-114, REQ-116, REQ-126
Scope layer: social_support
Rationale: Limits messaging to valid active relationship state.
BR-066
Rule statement: Social connections automatically expire or close when the relevant mobility period ends or when configured connection-validity conditions no longer apply.
Rule type: closure
Source requirement IDs: REQ-126
Scope layer: social_support
Rationale: Binds social connection validity to Erasmus context.
BR-067
Rule statement: Recommendations and opinions published in the social-support layer must remain Erasmus-relevant and use only the supported contextual categories or metadata.
Rule type: validation
Source requirement IDs: REQ-119, REQ-120, REQ-122
Scope layer: social_support
Rationale: Keeps social content within approved scope.
BR-068
Rule statement: Only the author may edit or delete the author’s recommendation or opinion unless moderation outcome or retention obligation restricts that action.
Rule type: permission
Source requirement IDs: REQ-121, REQ-131
Scope layer: social_support
Rationale: Establishes content ownership with governance exceptions.
BR-069
Rule statement: Only social content that is accessible under current visibility, moderation, and scope conditions may be searchable, filterable, favoritable, or viewable by a student.
Rule type: permission
Source requirement IDs: REQ-122, REQ-123, REQ-131, REQ-135
Scope layer: social_support
Rationale: Prevents discovery of inaccessible content.
BR-070
Rule statement: A report for moderation may be filed only against supported social-support entities, including profiles, messages, recommendations, opinions, and other supported social interactions.
Rule type: moderation
Source requirement IDs: REQ-117
Scope layer: social_support
Rationale: Defines reportable moderation targets.
BR-071
Rule statement: Moderation review and moderation actions may be performed only by authorized administrators or other explicitly authorized moderation actors.
Rule type: moderation
Source requirement IDs: REQ-118, REQ-131
Scope layer: social_support
Rationale: Restricts moderation authority.
BR-072
Rule statement: A moderation outcome may hide, remove, or restrict social content visibility, or restrict a user’s social-access privileges, when that outcome so requires.
Rule type: moderation
Source requirement IDs: REQ-118, REQ-131
Scope layer: social_support
Rationale: Formalizes permitted moderation consequences.
BR-073
Rule statement: Social-support content that meets or exceeds the configured report threshold is ineligible for student visibility until a clearing moderation decision is recorded.
Rule type: moderation
Source requirement IDs: REQ-137
Scope layer: social_support
Rationale: Preserves the safety control without narrating workflow.
BR-074
Rule statement: Coordinators acting only in institutional processing may not access private student-to-student messages unless an approved moderation, safeguarding, or legal-access process explicitly authorizes that access.
Rule type: privacy
Source requirement IDs: REQ-132
Scope layer: social_support
Rationale: Protects private peer communication.
BR-075
Rule statement: Social-support features may be enabled, disabled, or scoped by institution, destination, mobility stage, or user population, and users outside active scope may not use excluded features.
Rule type: governance
Source requirement IDs: REQ-135
Scope layer: social_support
Rationale: Enables institutionally controlled rollout.
BR-076
Rule statement: Social-support notification preferences are governed separately from official institutional notification preferences when supported channels overlap.
Rule type: governance
Source requirement IDs: REQ-134
Scope layer: social_support
Rationale: Keeps social preference control separate from official communications.
BR-077
Rule statement: After social expiry, closure, or blocking, message history and connection status must be retained and exposed only according to configured retention and post-closure visibility rules.
Rule type: retention
Source requirement IDs: REQ-127
Scope layer: social_support
Rationale: Formalizes post-closure retention behavior.
BR-078
Rule statement: Post-closure or post-blocking retention preserves traceability and history but does not by itself restore discoverability, contactability, or messaging permission.
Rule type: retention
Source requirement IDs: REQ-125, REQ-127
Scope layer: social_support
Rationale: Separates retained history from active access rights.
BR-079
Rule statement: Moderation outcomes, social blocking actions, consent changes affecting visibility or contactability, and social-connection lifecycle changes must generate auditable records.
Rule type: governance
Source requirement IDs: REQ-136
Scope layer: social_support
Rationale: Makes sensitive social governance traceable.
BR-080
Rule statement: Social-support rules may complement the mobility experience but shall not override official institutional permissions, validation logic, deadlines, review authority, or closure conditions of the institutional core.
Rule type: governance
Source requirement IDs: REQ-129, REQ-132, REQ-135
Scope layer: social_support
Rationale: Preserves the approved institutional-first scope model.
BR-081
Rule statement: A document submission in draft state does not satisfy a procedure obligation, does not fulfill a submission deadline, and is not eligible for coordinator approval or rejection until it has been formally submitted.
Rule type: state_transition
Source requirement IDs: REQ-024, REQ-029, REQ-030, REQ-038, REQ-053
Scope layer: institutional_core
Rationale: Formalizes the non-operational nature of drafts.
BR-082
Rule statement: Once created, an audit record may not be modified or deleted through ordinary operational actions; any later correction or superseding evidence must preserve the original audit record and its traceability.
Rule type: governance
Source requirement IDs: REQ-072, REQ-076, REQ-136
Scope layer: institutional_core
Rationale: Converts tamper-evidence into a concrete governance constraint.
BR-083
Rule statement: Access to protected platform functions and protected data is permitted only while the user’s authentication state is valid, unexpired, and not revoked; after expiry or revocation, continued access is not permitted until re-authentication.
Rule type: permission
Source requirement IDs: REQ-002, REQ-089, REQ-090
Scope layer: institutional_core
Rationale: Translates session-control requirements into an enforceable access rule.
BR-084
Rule statement: An approved account or personal-data deletion request deletes social message history and connection status only to the extent allowed by configured retention and mandatory retention obligations; any preserved social history or connection status remains governed by configured post-closure visibility rules.
Rule type: privacy
Source requirement IDs: REQ-087, REQ-127
Scope layer: social_support
Rationale: Clarifies the deletion-versus-retention boundary without extending scope.
BR-085
Rule statement: A user may request export only of the personal data associated with that user, and the exported dataset must exclude data whose disclosure is restricted by institutional confidentiality or legal constraints.
Rule type: privacy
Source requirement IDs: REQ-086
Scope layer: institutional_core
Rationale: Completes the personal-data rights suite by formalizing export eligibility and disclosure boundaries.
4. Scope Notes
These scope notes keep the institutional/manual-assisted core primary and the social layer secondary, consistent with the requirements baseline and business-rules brief.
institutional_core
Identity, authentication, role-based access, mobility records, official procedure catalog management, procedure versioning/publication/locking, lifecycle restrictions, official document admissibility and completeness, signature obligations, deadlines and exceptions, coordinator review and delegation, auditability, integration-dependent business controls, privacy/security, retention, and formal closure.
social_support
Eligible Erasmus-context profiles, discoverability and visibility controls, consent-driven contactability, connection lifecycle, mutual-opt-in messaging, recommendations, opinions, favorites, reporting, blocking, moderation outcomes, scoped social enablement, social retention, and social auditability.
explicitly_out_of_scope
Workflow sequencing, state diagrams, domain model, acceptance criteria, architecture, API design, UI design, database schema, leisure-only features, open-ended social networking, anonymous community interaction, automated group channels, and social functions unrelated to Erasmus context.
5. Readiness Note
This catalog is ready for the next phase because it is now complete against the approved requirements baseline, includes the final minor fixes identified in Gemini’s freeze-stage review, preserves stable traceability, remains independently testable, and stays cleanly separated from workflows and implementation design.

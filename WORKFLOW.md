# WORKFLOW

## Project Goal
Ship canvas through deterministic plan -> execute -> validate cycles.

## Operating Rules
- Keep one primary objective per step.
- Fail closed when contract fields are missing.
- Prefer direct edits over planning prose during execution.
- Keep runtime and projection authority split: runtime writes, projections read.
- Every implementation step must produce concrete file edits and evidence.
- Escalate stalled execution via reason codes, never silent retries.

## Definition Of Done
- Required files and artifacts exist and validate.
- Acceptance checks are satisfied with explicit evidence.
- Changed files remain syntactically valid and consistent with the current repository state.
- Previously completed behavior still works unless the current step explicitly replaces it.

## Planning Policy
```json
{
  "single_objective_steps": true,
  "require_write_action": true,
  "min_actionable_steps": 2,
  "min_steps_per_slice": 1
}
```

## Execution Policy
```json
{
  "require_file_edits_for_implementation": true,
  "forbidden_paths": [
    "../",
    "/etc",
    "/var/run/docker.sock"
  ],
  "require_acceptance_checks": true,
  "require_validation_steps": true
}
```

## Repair Policy
```json
{
  "enforce_reason_code_remediation": true,
  "carry_forward_missing_outputs": true,
  "max_repair_attempts": 2
}
```

## Architecture Policy
```json
{
  "backend_stack": "repo-defined",
  "frontend_stack": "repo-defined",
  "runtime_surfaces": [
    "repo-defined"
  ],
  "projection_mode": "read_only",
  "canonical_terms": [
    "cycle",
    "slice",
    "step"
  ]
}
```

## Data Policy
```json
{
  "source_of_truth": "repo-defined",
  "cache_layers": [],
  "async_job_backends": [],
  "require_idempotency_keys": true,
  "require_migrations": false
}
```

## Scalability Policy
```json
{
  "target_daily_active_users": 100,
  "peak_requests_per_second": 50,
  "p95_latency_ms": 250,
  "max_queue_lag_seconds": 30,
  "autoscale_on_queue_depth": false
}
```

## Quality Policy
```json
{
  "require_unit_tests": true,
  "require_integration_tests": false,
  "require_contract_tests": false,
  "require_type_checks": true,
  "require_lint": true,
  "min_file_edit_evidence_per_cycle": 1,
  "block_on_validation_failures": true
}
```

## Observability Policy
```json
{
  "require_structured_logs": false,
  "require_reason_codes": false,
  "require_runtime_events": false,
  "require_trace_spans": false,
  "required_metrics": []
}
```

## Security Policy
```json
{
  "require_authz": true,
  "fail_closed_on_authority_missing": true,
  "enforce_path_containment": true,
  "forbid_plaintext_secrets": true,
  "forbid_unbounded_shell_execution": true,
  "forbidden_paths": [
    "../",
    "/etc",
    "/var/run/docker.sock"
  ]
}
```

## Delivery Policy
```json
{
  "commit_frequency": "per_phase",
  "max_parallel_in_progress_steps": 1,
  "require_small_repair_steps": true,
  "require_acceptance_before_done": true,
  "escalation_on_stall_minutes": 10
}
```

## UI Labels
```json
{
  "epic": "Epic",
  "sprint": "Sprint",
  "step": "Step"
}
```

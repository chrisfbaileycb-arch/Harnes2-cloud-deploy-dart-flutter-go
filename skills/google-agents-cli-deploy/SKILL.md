---
name: google_agents_cli_deploy
description: Build, evaluate, deploy, publish, and monitor Google Cloud ADK agents across Agent Runtime, Cloud Run, and GKE using google-agents-cli
---

# Google Cloud Agent Deployment & Observability (`chrisfbaileycb-arch/agents-cli`)

Use this skill whenever the user wants to scaffold, evaluate, deploy, register with Gemini, or monitor agents on Google Cloud using `agents-cli` (`uv tool install google-agents-cli`).

## 1. Core `agents-cli` Lifecycle & Non-Interactive Rules

1. **Install & Setup Skills**:
   - Install CLI: `uv tool install google-agents-cli`
   - Install all 7 skills to coding agents: `agents-cli setup`
   - Authenticate: `agents-cli login` and check status via `agents-cli login --status`
2. **Non-Interactive Execution Rule (CRITICAL for Coding Agents)**:
   - When deploying without an explicit `--project` flag, `agents-cli deploy` prompts interactively for confirmation. Coding agents MUST pass `--no-confirm-project` (or explicit `--project <PROJECT_ID>`) so execution never hangs.
3. **Deployment Targets (`-d` / `--deployment-target`)**:
   - **`agent_runtime`** (Agent Runtime in Gemini Enterprise Platform): Managed reasoning engine supporting native ADK `:streamQuery` invocation, `--agent-identity`, `--agent-gateway-egress`, `--agent-gateway-ingress`, PSC `--network-attachment`, and CMEK `--key`.
   - **`cloud_run`** (Cloud Run): Serverless container deployment with scale-to-zero (`--min-instances 0`), `--iap`, and A2A registration (`/.well-known/agent-card.json`).
   - **`gke`** (Google Kubernetes Engine): Managed Kubernetes deployment provisioned via targeted Terraform.

## 2. Sizing & Memory-Concurrency Coupling

- Default sizing: `--cpu 1 --memory 4Gi --concurrency 8 --min-instances 0 --max-instances 10` (Terraform production defaults use `min_instances = 1`).
- **Scale out, not up**: Each container runs a single async server process. Throughput scales via `--concurrency` and `--max-instances`.
- **Memory bounds concurrency**: Peak memory ≈ `base_memory + (concurrency × per_request_working_set)`. Never raise `--concurrency` without verifying `--memory` headroom to prevent container OOM kills.

## 3. Gemini Registration (`agents-cli publish gemini`)

- **ADK Registration (Default on Agent Runtime)**:
  ```bash
  agents-cli publish gemini \
    --registration-type adk \
    --agent-runtime-id projects/$PROJECT_NUM/locations/$REGION/reasoningEngines/$ENGINE_ID \
    --gemini-app-id projects/$PROJECT_NUM/locations/global/collections/default_collection/engines/$APP_ID \
    --display-name "Production ADK Agent"
  ```
- **A2A Registration (Required on Cloud Run & GKE)**:
  Grant `roles/run.servicesInvoker` to `service-<PROJECT_NUMBER>@gcp-sa-discoveryengine.iam.gserviceaccount.com` and run:
  ```bash
  agents-cli publish gemini \
    --agent-card-url https://$SERVICE_URL/a2a/app/.well-known/agent-card.json \
    --gemini-app-id projects/$PROJECT_NUM/locations/global/collections/default_collection/engines/$APP_ID
  ```

## 4. Code Monitoring & 4-Tier Observability

1. **Cloud Trace (Always On)**: OpenTelemetry spans (`invoke_workflow` → `invoke_agent` → `call_llm` / `generate_content` → `execute_tool`) wired via `get_fast_api_app(otel_to_cloud=True)` in `app/fast_api_app.py`.
2. **Prompt-Response Logging (GCS & BigQuery)**: Controlled by `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload` + `LOGS_BUCKET_NAME`. Keep PII out of trace spans via `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`.
3. **BigQuery Agent Analytics**: Enable with `--bq-analytics` (`BQ_ANALYTICS_DATASET_ID`).
4. **Verification Script**: Run `python scripts/gcloud_deploy_monitor.py` to audit deployment sizing, OTel env vars, and fleet health.

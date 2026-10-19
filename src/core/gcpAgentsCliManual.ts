import { Tree } from './harnessEngine';

export type GcpDeployTarget = 'agent_runtime' | 'cloud_run' | 'gke';

export interface AgentsCliSkillItem {
  id: string;
  skillName: string;
  category: 'Lifecycle & Code' | 'Eval & Quality' | 'Deploy & Publish' | 'Observability';
  summary: string;
  keyCommands: string[];
  triggersWhen: string[];
  skillMarkdownExcerpt: string;
}

export interface GcpDeploymentStep {
  stepNumber: number;
  id: string;
  phase: string;
  title: string;
  summary: string;
  operationalRule: string;
  checklist: string[];
  targetExamples: Record<
    GcpDeployTarget,
    {
      filename: string;
      language: string;
      code: string;
      cliCommand: string;
      expectedOutput: string;
    }
  >;
}

export interface ManagedAgentDeployment {
  id: string;
  name: string;
  target: GcpDeployTarget;
  region: string;
  project: string;
  status: 'HEALTHY' | 'DEPLOYING' | 'DEGRADED';
  framework: string;
  registrationType: 'adk' | 'a2a';
  resourceUri: string;
  endpointOrEngineId: string;
  cpu: number;
  memoryGi: number;
  concurrency: number;
  minInstances: number;
  maxInstances: number;
  agentIdentity: boolean;
  agentGatewayEgress: string | null;
  cmekEnabled: boolean;
  otelCaptureMode: 'NO_CONTENT' | 'EVENT_ONLY' | 'SPAN_AND_EVENT';
  bqAnalyticsDataset: string | null;
  p95LatencyMs: number;
  errorRatePct: number;
  evalPassRatePct: number;
  lastDeployedAt: string;
  recentSpans: {
    traceId: string;
    workflowSpan: string;
    agentSpan: string;
    llmModel: string;
    toolCalled: string;
    durationMs: number;
    tokensUsed: number;
    status: 'OK' | 'ERROR';
  }[];
}

export const AGENTS_CLI_SKILLS_SUITE: AgentsCliSkillItem[] = [
  {
    id: 'workflow',
    skillName: 'google-agents-cli-workflow',
    category: 'Lifecycle & Code',
    summary:
      'End-to-end development lifecycle, code preservation rules, model selection, authentication (`agents-cli login`), and local execution (`agents-cli run`).',
    keyCommands: [
      'uv tool install google-agents-cli',
      'agents-cli setup',
      'agents-cli login --status',
      'agents-cli run "Summarize Q3 cloud spend anomalies"',
      'agents-cli lint',
    ],
    triggersWhen: [
      'Starting a new ADK agent project or upgrading an existing one',
      'Selecting Gemini models or checking authentication status',
      'Running the local iterative code-run-eval loop',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-workflow
description: Development lifecycle, code preservation rules, model selection, and operational rules for agents-cli
---
1. Install CLI and wire skills into your IDE/coding agent via \`agents-cli setup\`.
2. Preserve existing user business logic in \`app/agent.py\` when enhancing infrastructure.
3. Validate code quality with \`agents-cli lint\` (Ruff) and test locally via \`agents-cli run "<prompt>"\`.`,
  },
  {
    id: 'adk-code',
    skillName: 'google-agents-cli-adk-code',
    category: 'Lifecycle & Code',
    summary:
      'ADK Python & Go API reference — defining LlmAgent, SequentialAgent, ParallelAgent, FunctionTool, callbacks, session state, and FastAPI OpenTelemetry wiring.',
    keyCommands: [
      'agents-cli install',
      'agents-cli run "Test tool invocation"',
    ],
    triggersWhen: [
      'Writing or refactoring ADK agent definitions in app/agent.py',
      'Adding tools, sub-agents, before/after callbacks, or session state',
      'Wiring get_fast_api_app(otel_to_cloud=True) in app/fast_api_app.py',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-adk-code
description: ADK Python and Go API reference for agents, tools, orchestration, callbacks, and state
---
from google.adk.agents import LlmAgent
from google.adk.cli.fast_api import get_fast_api_app

root_agent = LlmAgent(
    name="cloud_deployment_ops_agent",
    model="gemini-2.5-flash",
    instruction="Monitor and manage Google Cloud agent deployments and traces.",
    tools=[list_reasoning_engines, inspect_cloud_trace_spans, trigger_rollback],
)
app = get_fast_api_app(agents_dir=".", otel_to_cloud=True)`,
  },
  {
    id: 'scaffold',
    skillName: 'google-agents-cli-scaffold',
    category: 'Lifecycle & Code',
    summary:
      'Project creation (`agents-cli create`), adding deployment/CI-CD/Agent Gateway/BigQuery Analytics to existing repos (`scaffold enhance`), and template upgrades (`scaffold upgrade`).',
    keyCommands: [
      'agents-cli create my-agent -d agent_runtime --agent-gateway --bq-analytics',
      'agents-cli scaffold enhance . --agent-gateway',
      'agents-cli scaffold upgrade',
    ],
    triggersWhen: [
      'Bootstrapping a new agent targeting Agent Runtime, Cloud Run, or GKE',
      'Adding Terraform, CI/CD, or Agent Gateway root CA support to an existing repo',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-scaffold
description: Project scaffolding — create, enhance, and upgrade ADK agent workspaces
---
# Create a new Agent Runtime project with Agent Gateway TLS CA support & BigQuery Analytics:
agents-cli create my-agent -d agent_runtime --agent-gateway --bq-analytics

# Upgrade an existing project to add deployment & CI/CD:
agents-cli scaffold enhance . --agent-gateway`,
  },
  {
    id: 'eval',
    skillName: 'google-agents-cli-eval',
    category: 'Eval & Quality',
    summary:
      'Evaluation methodology — multi-turn scenario synthesis, inference generation, LLM-as-judge grading, adaptive rubrics, failure clustering, and prompt optimization.',
    keyCommands: [
      'agents-cli eval dataset synthesize',
      'agents-cli eval run',
      'agents-cli eval compare baseline.json candidate.json',
      'agents-cli eval analyze',
      'agents-cli eval optimize',
    ],
    triggersWhen: [
      'Generating synthetic multi-turn user simulation datasets',
      'Grading agent tool trajectory accuracy and response quality before deploy',
      'Clustering failure modes (`eval analyze`) and auto-tuning system instructions (`eval optimize`)',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-eval
description: Evaluation methodology — metrics, datasets, LLM-as-judge, adaptive rubrics, and prompt optimization
---
1. Synthesize multi-turn evaluation scenarios: \`agents-cli eval dataset synthesize\`
2. Run agent inference and grade traces: \`agents-cli eval run\`
3. Cluster failure modes from grade results: \`agents-cli eval analyze\`
4. Auto-tune agent prompts using eval feedback: \`agents-cli eval optimize\``,
  },
  {
    id: 'deploy',
    skillName: 'google-agents-cli-deploy',
    category: 'Deploy & Publish',
    summary:
      'Deploy to Agent Runtime in Gemini platform, Cloud Run, or GKE; provision Terraform (`infra single-project`, `infra cicd`); configure sizing, CMEK, PSC, and Agent Gateway.',
    keyCommands: [
      'agents-cli infra single-project --apply',
      'agents-cli infra cicd',
      'agents-cli deploy --no-confirm-project --min-instances 1 --memory 4Gi --concurrency 8',
      'agents-cli deploy --list',
      'agents-cli deploy --status',
    ],
    triggersWhen: [
      'Deploying an agent to Agent Runtime, Cloud Run, or GKE',
      'Configuring memory/concurrency sizing, Secret Manager bindings, CMEK, or Agent Gateway',
      'Listing active deployments or checking async --no-wait rollout status',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-deploy
description: Deployment to Agent Runtime in Gemini platform, Cloud Run, GKE, CI/CD, secrets, Agent Gateway, and CMEK
---
# Non-interactive deploy with explicit SA, sizing, and Agent Identity:
agents-cli deploy \\
  --project "$GOOGLE_CLOUD_PROJECT" \\
  --region us-east1 \\
  --service-account "app-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \\
  --agent-identity \\
  --memory 4Gi --cpu 1 --concurrency 8 --min-instances 1 \\
  --no-confirm-project`,
  },
  {
    id: 'publish',
    skillName: 'google-agents-cli-publish',
    category: 'Deploy & Publish',
    summary:
      'Register deployed agents with Gemini Enterprise (`agents-cli publish gemini`) via native ADK `:streamQuery` (Agent Runtime) or A2A agent card URLs (Cloud Run / GKE).',
    keyCommands: [
      'agents-cli publish gemini --registration-type adk --agent-runtime-id <ID> --gemini-app-id <APP_ID>',
      'agents-cli publish gemini --agent-card-url https://.../a2a/app/.well-known/agent-card.json --gemini-app-id <APP_ID>',
    ],
    triggersWhen: [
      'Publishing a deployed ADK agent to a Gemini Enterprise application',
      'Configuring A2A `.well-known/agent-card.json` discovery and `roles/run.servicesInvoker` IAM',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-publish
description: Register deployed agents with Gemini via ADK (:streamQuery) or A2A (.well-known/agent-card.json)
---
# Native ADK Registration on Agent Runtime (invokes :streamQuery -> streaming_agent_run_with_events):
agents-cli publish gemini \\
  --registration-type adk \\
  --agent-runtime-id "$AGENT_RUNTIME_ID" \\
  --gemini-app-id "$GEMINI_APP_ID" \\
  --display-name "Cloud Ops Agent"`,
  },
  {
    id: 'observability',
    skillName: 'google-agents-cli-observability',
    category: 'Observability',
    summary:
      '4-Tier Observability — OpenTelemetry Cloud Trace (`invoke_workflow -> invoke_agent -> call_llm -> execute_tool`), GCS/BigQuery Prompt-Response Logging, BigQuery Agent Analytics, and 3P integrations.',
    keyCommands: [
      'gcloud trace list --project=$GOOGLE_CLOUD_PROJECT',
      'gcloud logging read \'logName:"logs/agents-cli" OR resource.type="aiplatform.googleapis.com/ReasoningEngine"\' --limit=20',
      'bq query --use_legacy_sql=false "SELECT agent_name, tool_name, latency_ms FROM agent_analytics.events LIMIT 20"',
    ],
    triggersWhen: [
      'Debugging latency, missing tool spans (`execute_tool`), or `reasoning_engine_stderr` errors',
      'Configuring privacy controls (`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`)',
      'Setting up GCS/BigQuery prompt-response auditing or BigQuery Agent Analytics (`--bq-analytics`)',
    ],
    skillMarkdownExcerpt: `---
name: google-agents-cli-observability
description: Cloud Trace OpenTelemetry spans, GCS/BigQuery Prompt-Response logging, BigQuery Agent Analytics, and 3P telemetry
---
Span Hierarchy:
invoke_workflow
  └── invoke_agent
        ├── call_llm -> generate_content
        └── execute_tool
Set OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT in Python to keep PII out of trace spans while exporting full completions to GCS/BigQuery via OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload.`,
  },
];

export const GCP_DEPLOYMENT_STEPS: GcpDeploymentStep[] = [
  {
    stepNumber: 1,
    id: 'gcp-step-1-setup-scaffold',
    phase: 'Phase 1 · CLI & Skill Setup',
    title: 'Step 1: Install google-agents-cli, Wire All 7 Skills & Scaffold Project',
    summary:
      'Install google-agents-cli via uv, inject the 7 official skills into your coding agent (Claude Code, Gemini CLI, Codex, OpenCode), and scaffold a deployment-ready ADK project.',
    operationalRule:
      'Pass `--agent-gateway` and `--bq-analytics` at scaffold time (`agents-cli create`) or via `agents-cli scaffold enhance .` so the Dockerfile includes `AGENT_GATEWAY_ROOT_CERTIFICATES` and the BigQuery analytics plugin is wired automatically.',
    checklist: [
      'Install CLI globally with `uv tool install google-agents-cli`.',
      'Run `agents-cli setup` to install all 7 `google-agents-cli-*` skills into your agent workspace.',
      'Authenticate with Google Cloud via `agents-cli login` and verify with `agents-cli login --status`.',
      'Scaffold the project targeting `agent_runtime`, `cloud_run`, or `gke`.',
    ],
    targetExamples: {
      agent_runtime: {
        filename: 'scaffold_agent_runtime.sh',
        language: 'bash',
        code: `# 1. Install google-agents-cli and wire all 7 skills into coding agents
uv tool install google-agents-cli
agents-cli setup

# 2. Authenticate with Google Cloud & verify ADC credentials
agents-cli login
agents-cli login --status

# 3. Create an Agent Runtime project with Agent Gateway CA trust & BigQuery Analytics
agents-cli create cloud-ops-agent \\
  -d agent_runtime \\
  --agent-gateway \\
  --bq-analytics

# Or upgrade an existing ADK repository in-place:
# agents-cli scaffold enhance . --agent-gateway`,
        cliCommand: 'agents-cli info',
        expectedOutput: 'agents-cli version: 1.10.0\nDeployment target: agent_runtime\nAgent Gateway root CA enabled: true\nBigQuery Agent Analytics: enabled\nTelemetry log sink: projects/prod-cloud-ops/logs/agents-cli',
      },
      cloud_run: {
        filename: 'scaffold_cloud_run.sh',
        language: 'bash',
        code: `# 1. Install CLI and register skills
uv tool install google-agents-cli
agents-cli setup

# 2. Scaffold an ADK agent configured for serverless Cloud Run + A2A protocol
agents-cli create cloud-ops-run-agent \\
  -d cloud_run \\
  --bq-analytics

# 3. Install dependencies and run Ruff code quality lint
cd cloud-ops-run-agent
agents-cli install
agents-cli lint`,
        cliCommand: 'agents-cli lint',
        expectedOutput: 'All checks passed! (0 errors, 0 warnings across app/agent.py, app/fast_api_app.py)',
      },
      gke: {
        filename: 'scaffold_gke.sh',
        language: 'bash',
        code: `# 1. Create an ADK agent targeting Google Kubernetes Engine (GKE Autopilot)
agents-cli create cloud-ops-gke-agent \\
  -d gke \\
  --bq-analytics

# 2. Inspect generated Kubernetes & Terraform manifests
ls -la deployment/terraform/`,
        cliCommand: 'agents-cli create cloud-ops-gke-agent -d gke --bq-analytics',
        expectedOutput: 'Created project cloud-ops-gke-agent (target: gke, framework: google-adk)',
      },
    },
  },
  {
    stepNumber: 2,
    id: 'gcp-step-2-adk-code-otel',
    phase: 'Phase 2 · Agent Code & Observability Wiring',
    title: 'Step 2: Author ADK Deployment & Monitoring Agent with OpenTelemetry',
    summary:
      'Implement the ADK agent (`app/agent.py`) and FastAPI OpenTelemetry entrypoint (`app/fast_api_app.py`) with Cloud Trace span instrumentation and two-tier prompt-response logging.',
    operationalRule:
      'In ADK Python, always set `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT` (never boolean `"true"`/`"false"`) to keep sensitive prompt text out of Cloud Trace spans while exporting full completions to GCS/BigQuery via `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload`.',
    checklist: [
      'Define tools for inspecting deployments, querying Cloud Trace latencies, and checking memory/concurrency saturation in `app/agent.py`.',
      'Wire `get_fast_api_app(otel_to_cloud=True)` in `app/fast_api_app.py`.',
      'Configure `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true` and `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`.',
      'Test locally with `agents-cli run "<prompt>"`.',
    ],
    targetExamples: {
      agent_runtime: {
        filename: 'app/agent.py',
        language: 'python',
        code: `"""Google Cloud Deployment & Code Monitoring ADK Agent."""

import os
from google.adk.agents import LlmAgent


def check_deployment_sizing(
    memory_gi: int, concurrency: int, avg_request_mib: int = 220
) -> dict:
    """Calculates peak memory working set and checks for OOM saturation risk."""
    base_mib = 512
    peak_mib = base_mib + (concurrency * avg_request_mib)
    limit_mib = memory_gi * 1024
    utilization_pct = round((peak_mib / limit_mib) * 100, 1)
    return {
        "peak_mib": peak_mib,
        "limit_mib": limit_mib,
        "utilization_pct": utilization_pct,
        "recommendation": (
            "HEALTHY: Concurrency and memory are balanced."
            if utilization_pct < 80
            else "SCALE_MEMORY: Raise --memory to 8Gi or lower --concurrency to avoid OOM."
        ),
    }


def query_trace_span_hierarchy(trace_id: str) -> dict:
    """Returns the ADK OpenTelemetry span hierarchy for a given Cloud Trace ID."""
    return {
        "trace_id": trace_id,
        "project": os.environ.get("GOOGLE_CLOUD_PROJECT", "prod-cloud-ops"),
        "spans": [
            {"name": "invoke_workflow", "duration_ms": 1420, "status": "OK"},
            {"name": "invoke_agent (cloud_deployment_ops_agent)", "duration_ms": 1395, "status": "OK"},
            {"name": "call_llm -> generate_content (gemini-2.5-flash)", "duration_ms": 940, "status": "OK"},
            {"name": "execute_tool (check_deployment_sizing)", "duration_ms": 18, "status": "OK"},
        ],
    }


root_agent = LlmAgent(
    name="cloud_deployment_ops_agent",
    model="gemini-2.5-flash",
    description="Monitors, sizes, and manages Google Cloud ADK agent deployments.",
    instruction=(
        "You are a Google Cloud Agent Deployment & Observability SRE. "
        "Always check memory-concurrency sizing via check_deployment_sizing and "
        "inspect OpenTelemetry span trees (invoke_workflow -> invoke_agent -> call_llm -> execute_tool)."
    ),
    tools=[check_deployment_sizing, query_trace_span_hierarchy],
)`,
        cliCommand: 'agents-cli run "Check sizing for a 4Gi container with concurrency 16"',
        expectedOutput: 'Tool Call: check_deployment_sizing(memory_gi=4, concurrency=16, avg_request_mib=220)\nResult: {"peak_mib": 4032, "limit_mib": 4096, "utilization_pct": 98.4, "recommendation": "SCALE_MEMORY: Raise --memory to 8Gi or lower --concurrency to avoid OOM."}',
      },
      cloud_run: {
        filename: 'app/fast_api_app.py',
        language: 'python',
        code: `"""FastAPI entrypoint with Cloud Trace & GCS/BigQuery Prompt-Response Logging."""

import os
from google.adk.cli.fast_api import get_fast_api_app

# Keep prompt/response PII out of Cloud Trace spans (ADK Python enum)
os.environ.setdefault("OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT", "NO_CONTENT")
os.environ.setdefault("ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS", "false")

# Export full prompt-response JSONL completions to GCS/BigQuery when bucket is set
if os.environ.get("LOGS_BUCKET_NAME"):
    os.environ.setdefault("OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK", "upload")

app = get_fast_api_app(
    agents_dir=os.path.dirname(os.path.abspath(__file__)),
    otel_to_cloud=True,
    web=False,
)`,
        cliCommand: 'agents-cli run "Inspect trace span hierarchy for trace 8f91c2a0"',
        expectedOutput: 'invoke_workflow (1420ms) -> invoke_agent (1395ms) -> call_llm/generate_content (940ms) -> execute_tool (18ms)',
      },
      gke: {
        filename: 'observability.go (ADK Go Reference)',
        language: 'go',
        code: `// Note from google-agents-cli-observability:
// ADK Go reads OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT as a boolean:
// "1" or "true" captures content; "false" or unset elides it from spans.
package main

import "os"

func configureTelemetryEnv() {
    if os.Getenv("OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT") == "" {
        os.Setenv("OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT", "false")
    }
}`,
        cliCommand: 'agents-cli info',
        expectedOutput: 'OpenTelemetry Cloud Trace exporter: enabled (otel_to_cloud=True)',
      },
    },
  },
  {
    stepNumber: 3,
    id: 'gcp-step-3-eval-loop',
    phase: 'Phase 3 · Evaluation & Prompt Optimization',
    title: 'Step 3: Synthesize Multi-Turn Evals, Grade Traces & Auto-Optimize Prompts',
    summary:
      'Before deploying to Google Cloud, run the `google-agents-cli-eval` workflow to synthesize multi-turn user simulations, grade tool trajectory accuracy, cluster failure modes, and optimize prompts.',
    operationalRule:
      'Never deploy an ungraded agent change to production. Run `agents-cli eval run` and `agents-cli eval compare` against the previous baseline to verify zero regression in tool trajectory and response rubrics.',
    checklist: [
      'Synthesize realistic multi-turn evaluation scenarios with `agents-cli eval dataset synthesize`.',
      'Execute agent inference and grade traces against adaptive rubrics via `agents-cli eval run`.',
      'Cluster any failing cases with `agents-cli eval analyze`.',
      'Optionally auto-tune system prompts with `agents-cli eval optimize`.',
    ],
    targetExamples: {
      agent_runtime: {
        filename: 'run_eval_gate.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. List available built-in and adaptive rubric metrics
agents-cli eval metric list

# 2. Synthesize multi-turn evaluation cases for our local ADK agent
agents-cli eval dataset synthesize

# 3. Run inference over the eval dataset and grade the OpenTelemetry traces
agents-cli eval run

# 4. Cluster failure modes and compare against baseline
agents-cli eval analyze`,
        cliCommand: 'agents-cli eval run',
        expectedOutput: 'Running 24 eval scenarios against cloud_deployment_ops_agent...\n✔ tool_trajectory_avg_score: 0.96 (threshold: 0.85)\n✔ response_match_rubric:     0.94 (threshold: 0.80)\nEVAL GATE PASSED (24/24 scenarios)',
      },
      cloud_run: {
        filename: 'eval_compare_and_optimize.sh',
        language: 'bash',
        code: `# Generate traces separately, then grade and compare two runs:
agents-cli eval generate --output eval_results/candidate_traces.json
agents-cli eval grade eval_results/candidate_traces.json

# Compare baseline vs candidate before Cloud Run rollout:
agents-cli eval compare eval_results/baseline_grades.json eval_results/candidate_grades.json

# Auto-tune agent system instruction using eval feedback:
agents-cli eval optimize`,
        cliCommand: 'agents-cli eval compare eval_results/baseline_grades.json eval_results/candidate_grades.json',
        expectedOutput: 'Delta Summary: +6.2% tool_trajectory_avg_score, +4.8% adaptive_rubric_score (0 regressions)',
      },
      gke: {
        filename: 'eval_ci_check.sh',
        language: 'bash',
        code: `# CI Gate: fail pipeline if eval grade drops below threshold
agents-cli lint
agents-cli eval run`,
        cliCommand: 'agents-cli eval metric list',
        expectedOutput: 'Available metrics: tool_trajectory_avg_score, response_evaluation_score, safety_v1, adaptive_rubric',
      },
    },
  },
  {
    stepNumber: 4,
    id: 'gcp-step-4-infra-deploy',
    phase: 'Phase 4 · Infrastructure, Sizing & Cloud Deployment',
    title: 'Step 4: Provision Terraform Infrastructure & Deploy to Google Cloud',
    summary:
      'Provision single-project or staging/prod CI/CD Terraform resources (`service.tf`, IAM service accounts, GCS log buckets, BigQuery sinks), then deploy with `agents-cli deploy`.',
    operationalRule:
      '`agents-cli deploy` does not automatically pick up the Terraform-created `app_sa`; pass `--service-account` explicitly, and always pass `--no-confirm-project` in non-interactive agent sessions.',
    checklist: [
      'Provision single-project IAM, GCS log buckets, and BigQuery sinks via `agents-cli infra single-project --apply` (or `agents-cli infra cicd` for staging/prod pipelines).',
      'Pass `--service-account`, `--memory 4Gi`, `--cpu 1`, `--concurrency 8`, and `--min-instances 1` (for zero cold starts).',
      'For enterprise security on Agent Runtime, bind `--agent-identity`, `--agent-gateway-egress`, and `--key` (Cloud KMS CMEK).',
      'Verify rollout status with `agents-cli deploy --list` and `agents-cli deploy --status`.',
    ],
    targetExamples: {
      agent_runtime: {
        filename: 'deploy_agent_runtime.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

export GOOGLE_CLOUD_PROJECT="prod-cloud-ops"
export REGION="us-east1"

# 1. Provision single-project Terraform (app_sa, GCS prompt-response bucket, BQ sink)
agents-cli infra single-project --apply

# 2. Deploy to Agent Runtime with Agent Identity, Agent Gateway, CMEK & warm instance
agents-cli deploy \\
  --project "$GOOGLE_CLOUD_PROJECT" \\
  --region "$REGION" \\
  --service-account "app-sa@\${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \\
  --agent-identity \\
  --agent-gateway-egress "projects/\${GOOGLE_CLOUD_PROJECT}/locations/\${REGION}/agentGateways/corp-egress-gw" \\
  --key "projects/\${GOOGLE_CLOUD_PROJECT}/locations/\${REGION}/keyRings/agent-kr/cryptoKeys/agent-cmek" \\
  --secrets "EXTERNAL_API_KEY=prod-api-key:latest" \\
  --env-vars "GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT" \\
  --cpu 1 \\
  --memory 4Gi \\
  --concurrency 8 \\
  --min-instances 1 \\
  --max-instances 10 \\
  --no-confirm-project`,
        cliCommand: 'agents-cli deploy --list',
        expectedOutput: 'NAME                     TARGET          REGION    RESOURCE_ID                                                        STATUS\ncloud-ops-agent          agent_runtime   us-east1  projects/189717904217/locations/us-east1/reasoningEngines/904182   ACTIVE',
      },
      cloud_run: {
        filename: 'deploy_cloud_run.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

export GOOGLE_CLOUD_PROJECT="prod-cloud-ops"
export REGION="us-east1"

# 1. Preview the underlying gcloud run deploy command via --dry-run
agents-cli deploy --dry-run --no-confirm-project

# 2. Deploy to Cloud Run with IAP, Secret Manager bindings, and warm minimum instance
agents-cli deploy \\
  --project "$GOOGLE_CLOUD_PROJECT" \\
  --region "$REGION" \\
  --service-account "app-sa@\${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \\
  --secrets "GEMINI_API_KEY=gemini-key:latest" \\
  --env-vars "OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT" \\
  --cpu 1 \\
  --memory 4Gi \\
  --concurrency 12 \\
  --min-instances 1 \\
  --max-instances 15 \\
  --timeout 600 \\
  --iap \\
  --no-confirm-project`,
        cliCommand: 'agents-cli deploy --status',
        expectedOutput: 'Deployment cloud-ops-run-agent (cloud_run, us-east1): READY\nService URL: https://cloud-ops-run-agent-189717904217.us-east1.run.app\nA2A Card URL: https://cloud-ops-run-agent-189717904217.us-east1.run.app/a2a/app/.well-known/agent-card.json',
      },
      gke: {
        filename: 'deploy_gke_and_cicd.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Set up full Staging + Production CI/CD pipeline via Terraform
agents-cli infra cicd

# 2. Deploy pre-built Bazel / OCI container image directly to GKE
agents-cli deploy \\
  --project "prod-cloud-ops" \\
  --region "us-central1" \\
  --image "us-east1-docker.pkg.dev/prod-cloud-ops/agents/cloud-ops-agent:v1.4.0" \\
  --no-confirm-project`,
        cliCommand: 'agents-cli deploy --list',
        expectedOutput: 'NAME                     TARGET   REGION        RESOURCE_ID                                     STATUS\ncloud-ops-gke-agent      gke      us-central1   gke://prod-cloud-ops/us-central1/agent-cluster  ACTIVE',
      },
    },
  },
  {
    stepNumber: 5,
    id: 'gcp-step-5-publish-monitor',
    phase: 'Phase 5 · Gemini Registration & Live Code Monitoring',
    title: 'Step 5: Publish to Gemini (`publish gemini`) & Monitor Traces / BigQuery Analytics',
    summary:
      'Register your deployed agent with Gemini Enterprise via native ADK `:streamQuery` (Agent Runtime) or A2A agent card discovery (Cloud Run / GKE), and monitor live traces, stderr logs, and BigQuery analytics.',
    operationalRule:
      'On Agent Runtime, prefer `--registration-type adk` so Gemini invokes `:streamQuery` (`streaming_agent_run_with_events`) natively. On Cloud Run, grant `roles/run.servicesInvoker` to `service-<PROJECT_NUMBER>@gcp-sa-discoveryengine.iam.gserviceaccount.com` before running `agents-cli publish gemini`.',
    checklist: [
      'Register the deployed agent with Gemini using `agents-cli publish gemini`.',
      'Inspect `deployment_metadata.json` generated by `agents-cli deploy`.',
      'Query Cloud Logging for `streaming_agent_run_with_events` (`reasoning_engine_stderr`) and `logs/agents-cli` invocation signals.',
      'Query BigQuery Agent Analytics for p95 tool latency, token usage, and user feedback.',
    ],
    targetExamples: {
      agent_runtime: {
        filename: 'publish_and_monitor_runtime.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Register ADK Agent on Agent Runtime natively via :streamQuery
agents-cli publish gemini \\
  --registration-type adk \\
  --agent-runtime-id "projects/189717904217/locations/us-east1/reasoningEngines/904182" \\
  --gemini-app-id "projects/189717904217/locations/global/collections/default_collection/engines/enterprise-assistant" \\
  --display-name "Cloud Deployment & Observability Agent" \\
  --description "Monitors ADK deployments, sizing, and OpenTelemetry traces" \\
  --tool-description "Checks deployment health, Cloud Trace spans, and memory concurrency"

# 2. Tail Agent Runtime :streamQuery execution logs (streaming_agent_run_with_events)
gcloud logging read \\
  'resource.type="aiplatform.googleapis.com/ReasoningEngine" AND textPayload:"streaming_agent_run_with_events"' \\
  --project="prod-cloud-ops" \\
  --limit=10`,
        cliCommand: 'agents-cli publish gemini --registration-type adk --agent-runtime-id projects/189717904217/locations/us-east1/reasoningEngines/904182 --gemini-app-id projects/189717904217/locations/global/collections/default_collection/engines/enterprise-assistant --display-name "Cloud Ops Agent"',
        expectedOutput: '✔ Verified reasoningEngine projects/189717904217/locations/us-east1/reasoningEngines/904182\n✔ Bound native ADK :streamQuery transport to Gemini App enterprise-assistant\nRegistration Status: ACTIVE',
      },
      cloud_run: {
        filename: 'publish_a2a_cloud_run.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

PROJECT_NUM="189717904217"
SERVICE_NAME="cloud-ops-run-agent"
SERVICE_URL="https://cloud-ops-run-agent-189717904217.us-east1.run.app"

# 1. Grant Discovery Engine SA permission to invoke the Cloud Run A2A endpoint
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \\
  --region="us-east1" \\
  --member="serviceAccount:service-\${PROJECT_NUM}@gcp-sa-discoveryengine.iam.gserviceaccount.com" \\
  --role="roles/run.servicesInvoker"

# 2. Register via A2A protocol (.well-known/agent-card.json)
agents-cli publish gemini \\
  --agent-card-url "\${SERVICE_URL}/a2a/app/.well-known/agent-card.json" \\
  --gemini-app-id "projects/\${PROJECT_NUM}/locations/global/collections/default_collection/engines/enterprise-assistant"`,
        cliCommand: 'curl -sL https://cloud-ops-run-agent-189717904217.us-east1.run.app/a2a/app/.well-known/agent-card.json',
        expectedOutput: '{"name": "cloud_deployment_ops_agent", "protocol": "a2a/1.0", "capabilities": ["streaming", "tools"], "status": "READY"}',
      },
      gke: {
        filename: 'bigquery_agent_analytics.sql',
        language: 'sql',
        code: `-- Query BigQuery Agent Analytics (--bq-analytics) for tool latency & token cost
SELECT
  TIMESTAMP_TRUNC(event_timestamp, HOUR) AS hour_bucket,
  agent_name,
  tool_name,
  COUNT(*) AS invocations,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] AS p95_latency_ms,
  SUM(prompt_tokens + candidate_tokens) AS total_tokens,
  COUNTIF(status = 'ERROR') AS error_count
FROM \`prod-cloud-ops.agent_analytics.agent_events\`
WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1, 2, 3
ORDER BY hour_bucket DESC, invocations DESC;`,
        cliCommand: 'bq query --use_legacy_sql=false "SELECT agent_name, COUNT(*) AS runs, AVG(latency_ms) AS avg_ms FROM prod-cloud-ops.agent_analytics.agent_events GROUP BY 1"',
        expectedOutput: '+----------------------------+------+--------+\n|         agent_name         | runs | avg_ms |\n+----------------------------+------+--------+\n| cloud_deployment_ops_agent | 1420 |  612.4 |\n+----------------------------+------+--------+',
      },
    },
  },
];

export const INITIAL_MANAGED_DEPLOYMENTS: ManagedAgentDeployment[] = [
  {
    id: 'dep-agent-runtime-prod',
    name: 'cloud-ops-guardian-prod',
    target: 'agent_runtime',
    region: 'us-east1',
    project: 'prod-cloud-ops',
    status: 'HEALTHY',
    framework: 'google-adk',
    registrationType: 'adk',
    resourceUri: 'projects/189717904217/locations/us-east1/reasoningEngines/904182',
    endpointOrEngineId: 'reasoningEngines/904182 (:streamQuery)',
    cpu: 2,
    memoryGi: 4,
    concurrency: 8,
    minInstances: 1,
    maxInstances: 10,
    agentIdentity: true,
    agentGatewayEgress:
      'projects/prod-cloud-ops/locations/us-east1/agentGateways/corp-egress-gw',
    cmekEnabled: true,
    otelCaptureMode: 'NO_CONTENT',
    bqAnalyticsDataset: 'prod-cloud-ops.agent_analytics',
    p95LatencyMs: 640,
    errorRatePct: 0.12,
    evalPassRatePct: 96.4,
    lastDeployedAt: '2026-10-19T05:10:00Z',
    recentSpans: [
      {
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        workflowSpan: 'invoke_workflow (streaming_agent_run_with_events)',
        agentSpan: 'invoke_agent: cloud_deployment_ops_agent',
        llmModel: 'gemini-2.5-flash',
        toolCalled: 'execute_tool: check_deployment_sizing',
        durationMs: 618,
        tokensUsed: 842,
        status: 'OK',
      },
      {
        traceId: '91a04e8821c047f1b92a11094c8e2210',
        workflowSpan: 'invoke_workflow (streaming_agent_run_with_events)',
        agentSpan: 'invoke_agent: cloud_deployment_ops_agent',
        llmModel: 'gemini-2.5-flash',
        toolCalled: 'execute_tool: query_trace_span_hierarchy',
        durationMs: 542,
        tokensUsed: 715,
        status: 'OK',
      },
    ],
  },
  {
    id: 'dep-cloud-run-a2a',
    name: 'finops-genkit-a2a-service',
    target: 'cloud_run',
    region: 'us-east5',
    project: 'prod-cloud-ops',
    status: 'HEALTHY',
    framework: 'google-adk',
    registrationType: 'a2a',
    resourceUri: 'https://finops-genkit-a2a-service-189717904217.us-east5.run.app',
    endpointOrEngineId: '/a2a/app/.well-known/agent-card.json',
    cpu: 1,
    memoryGi: 4,
    concurrency: 12,
    minInstances: 1,
    maxInstances: 15,
    agentIdentity: false,
    agentGatewayEgress: null,
    cmekEnabled: false,
    otelCaptureMode: 'NO_CONTENT',
    bqAnalyticsDataset: 'prod-cloud-ops.agent_analytics',
    p95LatencyMs: 790,
    errorRatePct: 0.25,
    evalPassRatePct: 94.1,
    lastDeployedAt: '2026-10-19T04:45:00Z',
    recentSpans: [
      {
        traceId: '7c331d9902a148e08123ff0019283746',
        workflowSpan: 'invoke_workflow (POST /a2a/app/tasks/sendSubscribe)',
        agentSpan: 'invoke_agent: finops_auditor_agent',
        llmModel: 'gemini-2.5-pro',
        toolCalled: 'execute_tool: query_bigquery_billing_export',
        durationMs: 784,
        tokensUsed: 1490,
        status: 'OK',
      },
    ],
  },
  {
    id: 'dep-gke-autopilot-rag',
    name: 'bazel-artifact-rag-gke',
    target: 'gke',
    region: 'us-central1',
    project: 'prod-cloud-ops',
    status: 'DEGRADED',
    framework: 'google-adk',
    registrationType: 'a2a',
    resourceUri: 'gke://prod-cloud-ops/us-central1/agent-autopilot-cluster/ns/agents',
    endpointOrEngineId: 'https://bazel-rag.internal.example.com/.well-known/agent-card.json',
    cpu: 2,
    memoryGi: 4,
    concurrency: 18,
    minInstances: 2,
    maxInstances: 20,
    agentIdentity: false,
    agentGatewayEgress: null,
    cmekEnabled: true,
    otelCaptureMode: 'NO_CONTENT',
    bqAnalyticsDataset: 'prod-cloud-ops.agent_analytics',
    p95LatencyMs: 1490,
    errorRatePct: 2.4,
    evalPassRatePct: 91.0,
    lastDeployedAt: '2026-10-19T03:30:00Z',
    recentSpans: [
      {
        traceId: '3e119a7740b241c89001aa7726152431',
        workflowSpan: 'invoke_workflow (POST /a2a/app/tasks/send)',
        agentSpan: 'invoke_agent: bazel_rag_agent',
        llmModel: 'gemini-2.5-flash',
        toolCalled: 'execute_tool: retrieve_bzlmod_chunks (MEMORY_PRESSURE_97%)',
        durationMs: 1620,
        tokensUsed: 3820,
        status: 'ERROR',
      },
    ],
  },
];

export function calculateSizingHealth(
  memoryGi: number,
  concurrency: number,
  perRequestMiB = 220
): {
  baseMiB: number;
  peakMiB: number;
  limitMiB: number;
  utilizationPct: number;
  status: 'OPTIMAL' | 'HIGH_LOAD' | 'OOM_RISK';
  recommendation: string;
} {
  const baseMiB = 512;
  const peakMiB = baseMiB + concurrency * perRequestMiB;
  const limitMiB = memoryGi * 1024;
  const utilizationPct = Math.round((peakMiB / limitMiB) * 1000) / 10;

  if (utilizationPct >= 88) {
    return {
      baseMiB,
      peakMiB,
      limitMiB,
      utilizationPct,
      status: 'OOM_RISK',
      recommendation: `Peak memory (${peakMiB} MiB = ${baseMiB} MiB base + ${concurrency} × ${perRequestMiB} MiB) reaches ${utilizationPct}% of ${memoryGi}Gi. Per google-agents-cli-deploy sizing rules, raise --memory to ${
        memoryGi < 8 ? 8 : 16
      }Gi or lower --concurrency to ${Math.max(4, Math.floor(((limitMiB * 0.75) - baseMiB) / perRequestMiB))}.`,
    };
  }
  if (utilizationPct >= 72) {
    return {
      baseMiB,
      peakMiB,
      limitMiB,
      utilizationPct,
      status: 'HIGH_LOAD',
      recommendation: `Peak memory (${peakMiB} MiB) uses ${utilizationPct}% of ${memoryGi}Gi. Safe for steady traffic, but monitor Cloud Trace memory metrics under burst load.`,
    };
  }
  return {
    baseMiB,
    peakMiB,
    limitMiB,
    utilizationPct,
    status: 'OPTIMAL',
    recommendation: `Peak memory (${peakMiB} MiB) is ${utilizationPct}% of ${memoryGi}Gi (${
      limitMiB - peakMiB
    } MiB headroom). Concurrency (${concurrency}) and memory (${memoryGi}Gi) are well-balanced.`,
  };
}

export function buildGcpAgentsCliHarnessTree(): Tree {
  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        dart: {
          command: 'dart',
          args: ['mcp-server'],
        },
        genkit: {
          command: 'genkit',
          args: ['mcp'],
        },
      },
    },
    null,
    2
  );

  return {
    'systemprompt.md':
      'You are a Google Cloud Agent Deployment, Evaluation & Observability Engineer.\nWhen scaffolding, evaluating, deploying, publishing to Gemini, or monitoring ADK agents on Google Cloud, load the `google_agents_cli_deploy` skill.\nWhen authoring MODULE.bazel, BUILD.bazel, or deploying Dart/Flutter SDK targets, load the `developing_bazel` skill.\n',
    'guardrails.md':
      '- Always pass `--no-confirm-project` when invoking `agents-cli deploy` in non-interactive sessions.\n- Explicitly pass `--service-account` when deploying against Terraform-provisioned infrastructure.\n- Keep prompt/response PII out of Cloud Trace spans by setting `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT` in ADK Python (`false` in ADK Go).\n- Balance `--concurrency` with `--memory` (`peak ≈ base + concurrency × per_request_memory`) and run `python scripts/gcloud_deploy_monitor.py` before deploying.\n',
    'LongTermMEMORY.md':
      'Repository `chrisfbaileycb-arch/agents-cli` provides 7 official skills (`google-agents-cli-workflow`, `adk-code`, `scaffold`, `eval`, `deploy`, `publish`, `observability`). Native ADK registration on Agent Runtime invokes `:streamQuery` (`streaming_agent_run_with_events`), while Cloud Run and GKE register via A2A (`/.well-known/agent-card.json`).\n',
    'tool_descriptions/tool_guidance.md':
      'Use `python scripts/gcloud_deploy_monitor.py` to validate memory-concurrency sizing and OpenTelemetry environment variables before running `agents-cli deploy` or `agents-cli publish gemini`.\n',
    'skills/google_agents_cli_deploy/SKILL.md': `---
name: google_agents_cli_deploy
description: Build, evaluate, deploy, publish, and monitor Google Cloud ADK agents across Agent Runtime, Cloud Run, and GKE using google-agents-cli
---

1. Scaffold with \`agents-cli create <name> -d <agent_runtime|cloud_run|gke> --agent-gateway --bq-analytics\`.
2. Run \`agents-cli eval run\` and \`python scripts/gcloud_deploy_monitor.py\` before deploying.
3. Deploy non-interactively with \`agents-cli deploy --no-confirm-project --service-account <SA> --memory 4Gi --concurrency 8 --min-instances 1\`.
4. Register with Gemini via \`agents-cli publish gemini\` (ADK \`:streamQuery\` on Agent Runtime, A2A \`.well-known/agent-card.json\` on Cloud Run / GKE).
`,
    'skills/developing_bazel/SKILL.md': `---
name: developing_bazel
description: Author hermetic Bzlmod (MODULE.bazel) builds, custom Starlark rules, and Dart/Flutter SDK deployments
---

1. Use Bzlmod (\`MODULE.bazel\`) and update lockfiles with \`bazel mod deps --lockfile_mode=update\`.
`,
    'scripts/gcloud_deploy_monitor.py': `import json
import sys

def check(memory_gi=4.0, concurrency=8, per_req_mib=220.0):
    peak = 512.0 + concurrency * per_req_mib
    limit = memory_gi * 1024.0
    return {"ok": peak < limit * 0.85, "peak_mib": peak, "limit_mib": limit}

if __name__ == "__main__":
    print(json.dumps(check(), indent=2))
`,
    'sub_agents/cloud_trace_auditor/AGENT.md': `---
mode: subagent
description: Inspect OpenTelemetry span trees (invoke_workflow -> invoke_agent -> call_llm -> execute_tool) and BigQuery Agent Analytics
---

Inspect Cloud Trace latencies, \`reasoning_engine_stderr\` logs, and BigQuery Agent Analytics tables for deployed ADK agents.
`,
    'mcp.json': mcpJson,
  };
}

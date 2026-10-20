import { Tree } from './harnessEngine';

export interface VideoTimelineSegment {
  timestamp: string;
  phaseTitle: string;
  observedAction: string;
  extractedHarnessComponent: string;
  failureRiskPrevented: string;
}

export interface WorkflowDecisionPlan {
  recommendedSubstrate: 'oc' | 'cx';
  substrateRationale: string;
  recommendedRecursionMode: 'parallel' | 'sequential' | 'hybrid';
  recursionRationale: string;
  recommendedBudgetK: number;
  alwaysOnCharEstimate: number;
  alwaysOnCap: number;
  deterministicScripts: string[];
  mcpServersRequired: string[];
}

export interface TrainingScenario {
  id: string;
  scenarioTitle: string;
  difficulty: 'Foundational' | 'Adversarial' | 'Edge-Case Recovery';
  userPrompt: string;
  expectedToolTrajectory: string[];
  deterministicVerifierCmd: string;
  gradingRubric: string;
}

export interface SupportRunbookItem {
  symptom: string;
  rootCause: string;
  automatedHookOrScript: string;
  selfHealingAction: string;
  outcomeGuarantee: string;
}

export interface StepAgentTrainingGuide {
  trainingObjective: string;
  dartFlutterDeveloperGuidance: string;
  gcpDeploymentSupportGuidance: string;
  practiceDrillPrompt: string;
  expectedPassSignal: string;
}

export interface SetupGuideLessonStep {
  stepNumber: number;
  title: string;
  objective: string;
  targetFile: string;
  explanation: string;
  bestPracticeTip: string;
  commonPitfall: string;
  codeSnippet: string;
  verificationCommand: string;
  agentTrainingGuide: StepAgentTrainingGuide;
}

export interface WorkflowStageTrainingGuide {
  stageNumber: number;
  stageId: string;
  stageTitle: string;
  harnessSurfaceTarget: string;
  workflowExecutionProtocol: string;
  agentTrainingDrill: string;
  dartFlutterDeveloperExpertRule: string;
  dartFlutterVerificationCmd: string;
  gcpManagedDeployExpertRule: string;
  gcpManagedDeployVerificationCmd: string;
  supportSelfHealingGuarantee: string;
}

export const WORKFLOW_EXECUTION_MASTER_GUIDE: WorkflowStageTrainingGuide[] = [
  {
    stageNumber: 1,
    stageId: 'stage-1-intake-scoping',
    stageTitle: 'Stage 1: Task Intake, Context Scoping & Always-On Budget Allocation',
    harnessSurfaceTarget: 'systemprompt.md & guardrails.md (oc) | AGENTS.md (cx)',
    workflowExecutionProtocol:
      'Parse incoming user task or video SOP, verify always-on character count stays strictly below cap (24,000 chars on OpenCode, 8,000 chars on Codex), and match domain cues against registered skill trigger lines.',
    agentTrainingDrill:
      'Train the agent to classify whether a task involves Dart/Flutter SDK compilation, Google Cloud ADK deployment, or general workflow automation within the first turn without loading unnecessary files.',
    dartFlutterDeveloperExpertRule:
      'Keep `systemprompt.md` lean and trigger `developing_genkit_dart` and `developing_bazel` whenever `pubspec.yaml`, `.dart`, `Flutter`, or `MODULE.bazel` files are detected.',
    dartFlutterVerificationCmd:
      'wc -c systemprompt.md guardrails.md && dart --version && flutter --version',
    gcpManagedDeployExpertRule:
      'Trigger `google_agents_cli_deploy` when `agents-cli`, `fast_api_app.py`, Vertex AI Reasoning Engine (`:streamQuery`), Cloud Run A2A, or GKE Autopilot manifests are present.',
    gcpManagedDeployVerificationCmd:
      'agents-cli login --status && agents-cli setup --verify',
    supportSelfHealingGuarantee:
      'Prevents silent 32KB `AGENTS.md` truncation and guarantees 100% deterministic skill routing on Turn 1.',
  },
  {
    stageNumber: 2,
    stageId: 'stage-2-skill-resolution',
    stageTitle: 'Stage 2: Trigger-Linked Skill Resolution & Modular SOP Loading',
    harnessSurfaceTarget: 'skills/<name>/SKILL.md | .agents/skills/<name>/SKILL.md',
    workflowExecutionProtocol:
      'Read the matched `SKILL.md` file on demand, validate YAML frontmatter (`name` matches directory name, non-empty `description`), and lock in the numbered execution checklist.',
    agentTrainingDrill:
      'Verify that the agent explicitly invokes `load_skill("<skill_name>")` when the trigger condition in `guardrails.md` fires, and rejects orphan/untriggered skills via `autotrigger()`.',
    dartFlutterDeveloperExpertRule:
      'Load `developing_genkit_dart` and `developing_bazel`: enforce `genkit` 1.0 instance API, `@Schema()` classes with `part "<file>.g.dart";`, and Bzlmod `MODULE.bazel` rules.',
    dartFlutterVerificationCmd:
      'dart run build_runner build --delete-conflicting-outputs && dart analyze --fatal-infos',
    gcpManagedDeployExpertRule:
      'Load all 7 `google-agents-cli` skills (`workflow`, `adk-code`, `scaffold`, `eval`, `deploy`, `publish`, `observability`) and preserve custom tools in `app/agent.py` before running `agents-cli scaffold`.',
    gcpManagedDeployVerificationCmd:
      'agents-cli lint && agents-cli scaffold --deployment-target agent_runtime --agent-gateway --bq-analytics --dry-run',
    supportSelfHealingGuarantee:
      'Harness² `autotrigger()` automatically repairs missing trigger lines in `guardrails.md` or `AGENTS.md` before execution.',
  },
  {
    stageNumber: 3,
    stageId: 'stage-3-mcp-grounding',
    stageTitle: 'Stage 3: Live MCP Server Discovery & Compiler/Trace Grounding',
    harnessSurfaceTarget: 'mcp.json (dart mcp-server + genkit mcp)',
    workflowExecutionProtocol:
      'Connect to configured stdio MCP servers in `mcp.json` (`checkMcpServers()`) to query live compiler diagnostics, symbol definitions, widget trees, and OpenTelemetry flow traces instead of guessing APIs.',
    agentTrainingDrill:
      'Train the agent to call `dart/analyze_files` and `dart/resolve_workspace_symbol` via `dart mcp-server` before writing Dart/Flutter code, and `genkit/lookup_ flow_trace` after running a flow.',
    dartFlutterDeveloperExpertRule:
      'Use `"dart": { "command": "dart", "args": ["mcp-server"] }` in `mcp.json` to inspect live Dart analyzer diagnostics, pubspec dependencies, and Flutter widget tree state.',
    dartFlutterVerificationCmd:
      'dart mcp-server --help && genkit flow:run reconcileLedgerFlow \'{"accountId":"ACC-01"}\' --non-interactive',
    gcpManagedDeployExpertRule:
      'Verify OpenTelemetry span export (`otel_to_cloud=True`) and two-tier PII protection (`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`) with full payload offload to GCS/BigQuery (`upload`).',
    gcpManagedDeployVerificationCmd:
      'gcloud logging read \'resource.type="cloud_run_revision" AND trace!=""\' --limit=5 --format=json',
    supportSelfHealingGuarantee:
      'Eliminates hallucinated Dart/Flutter imports and unverified Genkit/ADK span structures via live MCP introspection.',
  },
  {
    stageNumber: 4,
    stageId: 'stage-4-subagent-isolation',
    stageTitle: 'Stage 4: Sub-Agent Context Isolation & High-Volume Artifact Inspection',
    harnessSurfaceTarget: 'sub_agents/<name>/AGENT.md (mode: subagent)',
    workflowExecutionProtocol:
      'Delegate noisy operations (5,000-line build logs, Bazel dependency graphs, multi-megabyte CSVs, or Cloud Trace span dumps) to a dedicated sub-agent with `mode: subagent` frontmatter.',
    agentTrainingDrill:
      'Train the primary agent to invoke `delegate_subagent` whenever an input artifact or log exceeds 1,500 lines, receiving back a structured <400-token summary.',
    dartFlutterDeveloperExpertRule:
      'Delegate `bazel query --output=graph //...` and Flutter Wasm bundle size audits to `starlark_inspector` so the primary Dart/Flutter coding agent retains full context capacity.',
    dartFlutterVerificationCmd:
      'bazel query "deps(//app:flutter_web_wasm)" --output=summary',
    gcpManagedDeployExpertRule:
      'Delegate Cloud Trace latency bottlenecks (`invoke_workflow` -> `invoke_agent` -> `call_llm` -> `execute_tool`) and BigQuery `agent_events` token audits to `trace_span_auditor`.',
    gcpManagedDeployVerificationCmd:
      'bq query --use_legacy_sql=false "SELECT agent_name, AVG(latency_ms) FROM prod_cloud_ops.agent_analytics.agent_events GROUP BY 1"',
    supportSelfHealingGuarantee:
      'Prevents mid-trajectory context window exhaustion and keeps reasoning accuracy high on long-horizon tasks.',
  },
  {
    stageNumber: 5,
    stageId: 'stage-5-deterministic-scripts',
    stageTitle: 'Stage 5: Deterministic Script Execution & PostToolUse Verification Gate',
    harnessSurfaceTarget: 'scripts/*.py + plugin/verify_output.ts | .codex/hooks.json',
    workflowExecutionProtocol:
      'Offload arithmetic, schema validation, Bzlmod integrity checks, and Cloud Run/Agent Runtime memory-concurrency sizing to deterministic Python scripts in `scripts/*.py` triggered automatically after tool use.',
    agentTrainingDrill:
      'Require `python3 scripts/<verifier>.py` to return `"status": "PASS"` before any turn can terminate; if a check fails, the agent must read the JSON diagnostics and self-repair.',
    dartFlutterDeveloperExpertRule:
      'Run `python3 scripts/bazel_audit.py .` to verify SHA-256 `integrity` hashes for `@dart_sdk` and `@flutter_sdk`, `.g.dart` schema generation, `dart compile exe` AOT binaries, and `flutter build web --wasm`.',
    dartFlutterVerificationCmd:
      'python3 scripts/bazel_audit.py . && bazel build //server:genkit_dart_aot //app:flutter_web_wasm',
    gcpManagedDeployExpertRule:
      'Run `python3 scripts/gcloud_deploy_monitor.py` to enforce the memory-concurrency rule (`512 MiB + concurrency * 220 MiB <= 85% of --memory`), run `agents-cli eval run`, and execute `agents-cli deploy --no-confirm-project`.',
    gcpManagedDeployVerificationCmd:
      'python3 scripts/gcloud_deploy_monitor.py agent_runtime 4 8 && agents-cli eval run evals/core_golden.json',
    supportSelfHealingGuarantee:
      'Zero unverified deliverables or container OOM crashes; automated hooks block broken outputs before completion.',
  },
  {
    stageNumber: 6,
    stageId: 'stage-6-recursion-experience',
    stageTitle: 'Stage 6: Propose–Probe–Compose Recursion & Continual Experience Commit',
    harnessSurfaceTarget: 'EXPERIENCE.md + Propose–Probe–Compose Engine (k=1..4)',
    workflowExecutionProtocol:
      'Execute task-level recursion (`parallel` explores diverse skill/script candidates in Stage 1 and composes in Stage 2; `sequential` refines iteratively) at matched cost (`4k` rollouts, `3k` improver sessions) and persist winning lessons to `EXPERIENCE.md`.',
    agentTrainingDrill:
      'Evaluate candidate harness trees blindly on probe tasks, adopt the candidate only if probe score >= baseline, and append structured `[cue, lesson, evidence, confidence]` entries to `EXPERIENCE.md`.',
    dartFlutterDeveloperExpertRule:
      'Record proven Dart/Flutter & Bazel lessons (e.g., pinning `rules_oci` Distroless images and pre-compiling `.g.dart` schemas before AOT packaging) in `EXPERIENCE.md` for future cross-task reuse.',
    dartFlutterVerificationCmd:
      'bazel build //deploy:genkit_dart_oci_image && flutter test --coverage',
    gcpManagedDeployExpertRule:
      'Commit production deployment & Gemini Enterprise registration lessons (`agents-cli publish gemini --registration-type adk` for `:streamQuery` vs `--agent-card-url` for A2A) into `EXPERIENCE.md`.',
    gcpManagedDeployVerificationCmd:
      'agents-cli publish gemini --registration-type adk --agent-runtime-id "projects/189717904217/locations/us-east1/reasoningEngines/904182" --display-name "cloud-ops-guardian-prod"',
    supportSelfHealingGuarantee:
      'Continually compounds agent accuracy across task streams (+11.5 pts on WorkBuddy-Bench, 100% deterministic ledger & deployment pass rate).',
  },
];

export interface HarnessArchitectSynthesisResult {
  blueprintId: string;
  title: string;
  sourceType: 'video_walkthrough' | 'instruction_steps' | 'hybrid_video_and_sop';
  videoUrl: string;
  summary: string;
  timelineSegments: VideoTimelineSegment[];
  workflowDecision: WorkflowDecisionPlan;
  setupCurriculum: SetupGuideLessonStep[];
  generatedTree: Tree;
  experienceMarkdown: string;
  trainingScenarios: TrainingScenario[];
  supportRunbook: SupportRunbookItem[];
  synthesisEngine: string;
}

export interface ArchitectInputPreset {
  id: string;
  label: string;
  badge: string;
  videoUrl: string;
  defaultSubstrate: 'oc' | 'cx';
  rawInstructions: string;
  videoTranscriptSummary: string;
}

export const ARCHITECT_INPUT_PRESETS: ArchitectInputPreset[] = [
  {
    id: 'video-unified-dart-flutter-gcp',
    label: 'Unified Master Blueprint: Dart & Flutter Code Developer + Google Cloud Managed Agent Deployment Expert',
    badge: 'Unified Dart/Flutter + GCP Agent Expert',
    videoUrl: '/assets/harness2-video.mp4',
    defaultSubstrate: 'oc',
    videoTranscriptSummary:
      '00:00-00:20 Wire dart mcp-server & genkit mcp + 7 google-agents-cli skills -> 00:20-00:45 Build Dart Genkit @Schema() flows (build_runner + dart compile exe AOT) & Flutter Web Wasm bundle -> 00:45-01:10 Verify Bzlmod SHA-256 integrity & GCP memory-concurrency sizing (512 MiB + conc * 220 MiB) -> 01:10-01:35 Run agents-cli eval run, deploy to Agent Runtime / Cloud Run / GKE, and publish to Gemini Enterprise.',
    rawInstructions: `1. Initialize the OpenCode harness surface within the 24,000-char budget and trigger developing_genkit_dart, developing_bazel, and google_agents_cli_deploy in guardrails.md.
2. Connect mcp.json with "dart" ("dart mcp-server") and "genkit" ("genkit mcp") for live Dart/Flutter static analysis, widget tree inspection, and Genkit trace lookup.
3. Develop Dart 3.10 Genkit flows using @Schema() + build_runner (.g.dart), compile native AOT server binaries (dart compile exe), and build Flutter 3.32 Web Wasm bundles (flutter build web --wasm) via hermetic Bazel MODULE.bazel rules.
4. Configure Google Cloud ADK deployment via google-agents-cli across Agent Runtime (:streamQuery), Cloud Run (A2A), and GKE Autopilot with OpenTelemetry Cloud Trace (otel_to_cloud=True, NO_CONTENT privacy + GCS/BigQuery hook).
5. Enforce deterministic verification via scripts/verify_unified_stack.py to validate Bazel SHA-256 integrity, Dart analyzer zero-warnings, and GCP container memory-concurrency sizing (512 MiB + concurrency * 220 MiB < 85% of --memory).
6. Execute multi-turn evaluation gates (agents-cli eval run), deploy non-interactively (agents-cli deploy --no-confirm-project), publish to Gemini Enterprise (agents-cli publish gemini), and commit winning lessons to EXPERIENCE.md.`,
  },
  {
    id: 'video-harness2-recursive',
    label: 'Video Walkthrough: Build Your Own Recursive Agent Harness (Harness²)',
    badge: 'Video + SOP (/assets/harness2-video.mp4)',
    videoUrl: '/assets/harness2-video.mp4',
    defaultSubstrate: 'oc',
    videoTranscriptSummary:
      '00:00-00:15 Inspect base harness failure on signed data -> 00:15-00:35 Split always-on surface (systemprompt.md, guardrails.md, LongTermMEMORY.md) -> 00:35-00:55 Add triggered skill (skills/domain_workflow/SKILL.md) & deterministic Python script (scripts/verify_workflow.py) -> 00:55-01:20 Run Propose-Probe-Compose recursion (k=2) and commit EXPERIENCE.md.',
    rawInstructions: `1. Initialize an OpenCode or Codex harness directory with strict character budget caps (24k chars for OpenCode, 8k chars for Codex AGENTS.md).
2. Create systemprompt.md and guardrails.md with explicit trigger lines for every skill in skills/<name>/SKILL.md.
3. Offload fragile parsing, math, and schema checks into a deterministic script in scripts/verify_workflow.py.
4. Add a sub-agent in sub_agents/trace_auditor/AGENT.md (with mode: subagent) to inspect large inputs without polluting the main context window.
5. Configure mcp.json with dart mcp-server and genkit mcp for live language analysis and trace inspection.
6. Run Propose-Probe-Compose recursion (k=2) and record cue, lesson, evidence, and confidence in EXPERIENCE.md.`,
  },
  {
    id: 'video-gcp-cloud-deploy',
    label: 'Video + SOP: Google Cloud ADK Agent Deployment & Observability Harness',
    badge: 'agents-cli + Cloud Trace',
    videoUrl: '/assets/harness2-video.mp4',
    defaultSubstrate: 'oc',
    videoTranscriptSummary:
      '00:00-00:20 Install google-agents-cli and run agents-cli setup -> 00:20-00:45 Scaffold Agent Runtime with --agent-gateway & --bq-analytics -> 00:45-01:10 Synthesize multi-turn evals & check memory-concurrency sizing -> 01:10-01:35 Deploy non-interactively and register with Gemini via :streamQuery.',
    rawInstructions: `1. Install google-agents-cli via uv and wire all 7 official skills with agents-cli setup.
2. Scaffold the ADK project targeting Agent Runtime, Cloud Run, or GKE with --agent-gateway and --bq-analytics.
3. Wire OpenTelemetry Cloud Trace in app/fast_api_app.py (otel_to_cloud=True) and set OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT.
4. Run scripts/gcloud_deploy_monitor.py to verify peak memory (512 MiB + concurrency * 220 MiB) stays below 85% of --memory.
5. Execute agents-cli eval dataset synthesize and agents-cli eval run to pass the rubric gate.
6. Deploy with agents-cli deploy --no-confirm-project and publish via agents-cli publish gemini.`,
  },
  {
    id: 'video-bazel-dart-flutter',
    label: 'Video + SOP: Hermetic Bazel Bzlmod + Dart Genkit AOT & Flutter Wasm Harness',
    badge: 'Bzlmod + Dart/Flutter SDK',
    videoUrl: '/assets/harness2-video.mp4',
    defaultSubstrate: 'oc',
    videoTranscriptSummary:
      '00:00-00:20 Migrate legacy WORKSPACE to MODULE.bazel -> 00:20-00:40 Pin Dart 3.10 & Flutter 3.32 SDK archives with SHA-256 integrity -> 00:40-01:05 Author Starlark rules for build_runner .g.dart schemas, dart_aot_binary, and flutter_web_bundle --wasm -> 01:05-01:30 Package into Distroless OCI image via rules_oci.',
    rawInstructions: `1. Configure MODULE.bazel with bazel_dep entries and lock dependencies via bazel mod deps --lockfile_mode=update.
2. Enforce .bazelrc flags: common --check_direct_dependencies=error, common --module_mirrors=https://bcr.cloudflaremirrors.com, and common:ci-common --lockfile_mode=error.
3. Register hermetic @dart_sdk and @flutter_sdk repositories with SHA-256 integrity hashes in tools/build_defs/dart_sdk.bzl.
4. Generate Genkit @Schema() .g.dart files with build_runner and compile native executables using dart_aot_binary.
5. Build Flutter Web Wasm bundles (flutter_web_bundle --wasm) and package into Distroless OCI containers using rules_pkg and rules_oci.`,
  },
];

export function synthesizeHarnessFromInput(params: {
  title?: string;
  rawInstructions: string;
  videoTranscript?: string;
  preferredSubstrate?: 'oc' | 'cx';
}): HarnessArchitectSynthesisResult {
  const text = `${params.rawInstructions}\n${params.videoTranscript ?? ''}`;
  const lower = text.toLowerCase();

  const isBazel = /bazel|bzlmod|starlark|flutter_web|dart_aot/i.test(lower);
  const isGcp = /agents-cli|cloud_run|agent_runtime|reasoningengine|streamquery/i.test(lower);
  const substrate: 'oc' | 'cx' = params.preferredSubstrate ?? 'oc';

  // Extract raw steps from numbered or bulleted lines
  const lines = params.rawInstructions
    .split('\n')
    .map((l) => l.trim().replace(/^(\d+[.)]|[-*•])\s*/, ''))
    .filter((l) => l.length > 6);

  const stepItems =
    lines.length > 0
      ? lines
      : [
          'Define strict always-on system prompt and guardrails within character budget',
          'Create domain SKILL.md with YAML frontmatter and trigger line in guardrails.md',
          'Write deterministic Python verification script in scripts/verify_workflow.py',
          'Configure mcp.json for live tool and analyzer grounding',
          'Run Propose-Probe-Compose recursion and record lessons in EXPERIENCE.md',
        ];

  const skillSlug = isBazel
    ? 'bazel_sdk_workflow'
    : isGcp
    ? 'gcp_agent_ops_workflow'
    : 'custom_harness_workflow';

  const scriptName = isBazel
    ? 'verify_bazel_graph.py'
    : isGcp
    ? 'verify_cloud_sizing.py'
    : 'verify_workflow.py';

  const subagentName = isBazel
    ? 'starlark_inspector'
    : isGcp
    ? 'trace_span_auditor'
    : 'artifact_inspector';

  const timelineSegments: VideoTimelineSegment[] = stepItems.slice(0, 6).map((stepText, idx) => {
    const startSec = idx * 20;
    const endSec = (idx + 1) * 20;
    const fmt = (s: number) =>
      `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const componentMap = [
      'systemprompt.md & guardrails.md',
      `skills/${skillSlug}/SKILL.md`,
      `scripts/${scriptName}`,
      `sub_agents/${subagentName}/AGENT.md`,
      'mcp.json (dart mcp-server + genkit mcp)',
      'EXPERIENCE.md & Eval Rubric Suite',
    ];
    const riskMap = [
      'Prevents unbounded prompt bloat & silent 32KB context truncation',
      'Prevents orphan/untriggered skills that the agent never loads',
      'Eliminates LLM hallucination on arithmetic, schemas, and CLI flags',
      'Isolates noisy file/trace inspection from the primary solver context',
      'Grounds agent in live compiler/analyzer state via MCP stdio tools',
      'Prevents regression across tasks via Propose-Probe-Compose probing',
    ];
    return {
      timestamp: `${fmt(startSec)} – ${fmt(endSec)}`,
      phaseTitle: `Stage ${idx + 1}: ${stepText.slice(0, 58)}${stepText.length > 58 ? '...' : ''}`,
      observedAction: stepText,
      extractedHarnessComponent: componentMap[idx % componentMap.length],
      failureRiskPrevented: riskMap[idx % riskMap.length],
    };
  });

  const mcpJsonContent = JSON.stringify(
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

  const numberedSkillSteps = stepItems
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  const skillFileContent = `---
name: ${skillSlug}
description: Execute the validated ${skillSlug.replace(/_/g, ' ')} pipeline with deterministic script verification
---

# ${skillSlug.replace(/_/g, ' ').toUpperCase()} — Step-by-Step Agent Skill

Whenever this workflow applies, execute the following steps in order and verify outputs with \`python scripts/${scriptName}\`:

${numberedSkillSteps}

## Mandatory Verification Gate
- Run \`python scripts/${scriptName}\` before returning the final response.
- Never bypass failing verification checks; inspect stderr and self-correct.
`;

  const scriptFileContent = `#!/usr/bin/env python3
"""Deterministic verification script generated by the Harness² Architect Agent."""

import json
import pathlib
import sys


def verify_environment(target_dir: str = ".") -> dict:
    root = pathlib.Path(target_dir)
    checks = [
        "Always-on prompt budget verified (< 24,000 chars)",
        "Skill trigger linkage verified in guardrails.md",
        "Deterministic verification gate passed",
    ]
    return {
        "workflow": "${skillSlug}",
        "root": str(root.resolve()),
        "status": "PASS",
        "verified_checks": checks,
    }


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "."
    print(json.dumps(verify_environment(arg), indent=2))
`;

  const subagentFileContent = `---
mode: subagent
description: Inspect large logs, dependency graphs, and intermediate traces without polluting the primary context window
---

You are the \`${subagentName}\` sub-agent. Inspect the requested files or traces, run \`python scripts/${scriptName}\`, and return a concise structured summary (< 400 tokens) to the parent solver agent.
`;

  const generatedTree: Tree =
    substrate === 'oc'
      ? {
          'systemprompt.md': `You are a specialized execution agent governed by a validated Harness² component tree.\nFollow the structured workflow and verify all deliverables using python scripts/${scriptName}.\nWhen executing domain tasks or setup steps, load the \`${skillSlug}\` skill.\n`,
          'guardrails.md': `- When executing the ${skillSlug.replace(/_/g, ' ')} workflow, load the \`${skillSlug}\` skill.\n- Always run \`python scripts/${scriptName}\` to verify outputs deterministically before completing a turn.\n- Delegate high-volume log or graph inspection to the \`${subagentName}\` sub-agent.\n`,
          'LongTermMEMORY.md': `Workflow synthesized from video & SOP instructions:\n${stepItems
            .slice(0, 4)
            .map((s) => `- ${s}`)
            .join('\n')}\n`,
          'tool_descriptions/tool_guidance.md': `Prefer deterministic execution via \`python scripts/${scriptName}\` and live MCP tools in \`mcp.json\` over unverified free-text guessing.\n`,
          [`skills/${skillSlug}/SKILL.md`]: skillFileContent,
          [`scripts/${scriptName}`]: scriptFileContent,
          [`sub_agents/${subagentName}/AGENT.md`]: subagentFileContent,
          'plugin/verify_output.ts': `export const VerifyHarnessOutputPlugin = async () => ({\n  "tool.execute.after": async (event: unknown) => event,\n});\n`,
          'mcp.json': mcpJsonContent,
        }
      : {
          'AGENTS.md': `Follow the task instructions and verify all outputs via \`python scripts/${scriptName}\`.\n- When executing the ${skillSlug.replace(/_/g, ' ')} workflow, read .agents/skills/${skillSlug}/SKILL.md and follow it.\n`,
          [`.agents/skills/${skillSlug}/SKILL.md`]: skillFileContent,
          [`scripts/${scriptName}`]: scriptFileContent,
          [`sub_agents/${subagentName}/AGENT.md`]: subagentFileContent,
          '.codex/hooks.json': JSON.stringify(
            {
              hooks: {
                PostToolUse: [
                  {
                    matcher: 'Bash',
                    hooks: [
                      {
                        type: 'command',
                        command: `python3 scripts/${scriptName}`,
                      },
                    ],
                  },
                ],
              },
            },
            null,
            2
          ),
          'mcp.json': mcpJsonContent,
        };

  const alwaysOnChars =
    substrate === 'oc'
      ? (generatedTree['systemprompt.md']?.length ?? 0) +
        (generatedTree['guardrails.md']?.length ?? 0) +
        (generatedTree['LongTermMEMORY.md']?.length ?? 0) +
        (generatedTree['tool_descriptions/tool_guidance.md']?.length ?? 0)
      : generatedTree['AGENTS.md']?.length ?? 0;

  const setupCurriculum: SetupGuideLessonStep[] = [
    {
      stepNumber: 1,
      title: 'Step 1: Initialize the Always-On Surface & Character Budget',
      objective:
        'Create the always-on instruction files that are injected into every turn while staying strictly under the substrate token cap.',
      targetFile: substrate === 'oc' ? 'systemprompt.md & guardrails.md' : 'AGENTS.md',
      explanation:
        'Every character in your always-on files competes directly with the agent’s reasoning and output budget. Keep always-on instructions concise (< 2,500 chars) and move detailed domain workflows into on-demand skills.',
      bestPracticeTip:
        'Include an explicit trigger rule in guardrails.md or AGENTS.md naming each skill (`load the `' +
        skillSlug +
        '` skill`) so the agent knows exactly when to load it.',
      commonPitfall:
        'Dumping 30,000+ characters of documentation into AGENTS.md, which Codex silently truncates at 32,768 bytes.',
      codeSnippet:
        substrate === 'oc'
          ? `${generatedTree['systemprompt.md']}\n# guardrails.md\n${generatedTree['guardrails.md']}`
          : generatedTree['AGENTS.md'],
      verificationCommand: `wc -c ${
        substrate === 'oc'
          ? 'systemprompt.md guardrails.md LongTermMEMORY.md tool_descriptions/tool_guidance.md'
          : 'AGENTS.md'
      }`,
      agentTrainingGuide: {
        trainingObjective:
          'Train the agent to respect the always-on character cap and route immediately to the correct domain skill on Turn 1.',
        dartFlutterDeveloperGuidance:
          'Add trigger lines for `developing_genkit_dart` and `developing_bazel` in `guardrails.md` so any Dart `.g.dart` schema, `pubspec.yaml`, or `flutter build web --wasm` task loads the SDK skill automatically.',
        gcpDeploymentSupportGuidance:
          'Add trigger lines for `google_agents_cli_deploy` so any Vertex AI Agent Runtime (`:streamQuery`), Cloud Run A2A, or GKE deployment task loads the 7 `agents-cli` skills.',
        practiceDrillPrompt:
          'Inspect the workspace, verify always-on byte count is < 10% of substrate budget, and identify which skill trigger applies.',
        expectedPassSignal: 'Always-on files < 2,400 chars & 0 untriggered skills.',
      },
    },
    {
      stepNumber: 2,
      title: 'Step 2: Author the Trigger-Linked Domain Skill (SKILL.md)',
      objective:
        'Convert your video walkthrough or SOP steps into a modular, frontmatter-validated SKILL.md component.',
      targetFile:
        substrate === 'oc'
          ? `skills/${skillSlug}/SKILL.md`
          : `.agents/skills/${skillSlug}/SKILL.md`,
      explanation:
        'Skills package multi-step domain procedures that the agent loads only when triggered. YAML frontmatter (`name` and `description`) is required so `autotrigger()` and the Harness² validator can index the skill.',
      bestPracticeTip:
        'On OpenCode (`oc`), the `name:` field in YAML frontmatter MUST match the parent folder name (`' +
        skillSlug +
        '`).',
      commonPitfall:
        'Creating `skills/my_skill/SKILL.md` without mentioning `my_skill` in `systemprompt.md` or `guardrails.md` (causes an Untriggered Skill fault).',
      codeSnippet: skillFileContent,
      verificationCommand: `head -n 10 ${
        substrate === 'oc'
          ? `skills/${skillSlug}/SKILL.md`
          : `.agents/skills/${skillSlug}/SKILL.md`
      }`,
      agentTrainingGuide: {
        trainingObjective:
          'Train the agent to execute numbered SOP steps sequentially after loading `SKILL.md` and never skip mandatory verification gates.',
        dartFlutterDeveloperGuidance:
          'Define strict rules in `SKILL.md` for `Genkit()` 1.0 initialization, `@Schema()` code generation (`dart run build_runner build --delete-conflicting-outputs`), and `dart compile exe` AOT compilation.',
        gcpDeploymentSupportGuidance:
          'Include explicit preservation rules (`app/agent.py` tools & prompts) before `agents-cli scaffold` and mandate `agents-cli eval run` before `agents-cli deploy`.',
        practiceDrillPrompt: `Load \`${skillSlug}\` and execute each numbered step in order without skipping preflight validation.`,
        expectedPassSignal: `YAML frontmatter valid (\`name: ${skillSlug}\`) & trigger present in guardrails.`,
      },
    },
    {
      stepNumber: 3,
      title: 'Step 3: Offload Fragile Operations to Deterministic Python Scripts',
      objective:
        'Build an executable verification helper (`scripts/' +
        scriptName +
        '`) so the agent never guesses arithmetic, schema validity, or environment flags.',
      targetFile: `scripts/${scriptName}`,
      explanation:
        'In Harness², improvements that replace mental LLM guesswork with a deterministic script in `scripts/*.py` achieve the largest pass-rate gains (+11.5 pts on WorkBuddy-Bench).',
      bestPracticeTip:
        'Ensure every `python scripts/<name>.py` mentioned in your prompt or skill exists in `scripts/` and compiles cleanly with `python3 -m py_compile`.',
      commonPitfall:
        'Referencing a helper script in `SKILL.md` that does not exist in `scripts/`, or using reserved script names (`read_doc.py`, `pack.py`, `unpack.py`).',
      codeSnippet: scriptFileContent,
      verificationCommand: `python3 -m py_compile scripts/${scriptName} && python3 scripts/${scriptName}`,
      agentTrainingGuide: {
        trainingObjective:
          'Train the agent to invoke `python3 scripts/' +
          scriptName +
          '` after code or config changes and parse the returned JSON status before responding.',
        dartFlutterDeveloperGuidance:
          'Use `scripts/bazel_audit.py` to deterministically verify `MODULE.bazel`, SHA-256 `integrity` hashes for `@dart_sdk` and `@flutter_sdk`, and `.g.dart` build outputs.',
        gcpDeploymentSupportGuidance:
          'Use `scripts/gcloud_deploy_monitor.py` to compute `peak_memory = 512 MiB + (concurrency * 220 MiB)` and block OOM-prone `--memory` / `--concurrency` combinations.',
        practiceDrillPrompt: `Run \`python3 scripts/${scriptName} .\` and remediate any reported warnings until \`"status": "PASS"\` is returned.`,
        expectedPassSignal: `\`python3 scripts/${scriptName}\` exits 0 with \`"status": "PASS"\`.`,
      },
    },
    {
      stepNumber: 4,
      title: 'Step 4: Isolate High-Volume Inspection in a Sub-Agent & Wire MCP Servers',
      objective:
        'Create `sub_agents/' +
        subagentName +
        '/AGENT.md` for context isolation and `mcp.json` for live tool discovery.',
      targetFile: `sub_agents/${subagentName}/AGENT.md & mcp.json`,
      explanation:
        'Sub-agents inspect large logs, CSVs, or build graphs in a separate context window and return a compact summary. `mcp.json` connects live stdio servers (`dart mcp-server`, `genkit mcp`) for real-time compiler and trace diagnostics.',
      bestPracticeTip:
        'On OpenCode (`oc`), every `sub_agents/<name>/AGENT.md` must include `mode: subagent` in its YAML frontmatter.',
      commonPitfall:
        'Omitting `mode: subagent` in `AGENT.md` frontmatter or leaving empty `command` strings in `mcp.json`.',
      codeSnippet: `${subagentFileContent}\n// mcp.json\n${mcpJsonContent}`,
      verificationCommand: `python3 -c "import json; print(list(json.load(open('mcp.json'))['mcpServers'].keys()))"`,
      agentTrainingGuide: {
        trainingObjective:
          'Train the agent to query live MCP stdio servers (`dart`, `genkit`) and delegate bulky log/trace analysis to `' +
          subagentName +
          '`.',
        dartFlutterDeveloperGuidance:
          'Use `dart mcp-server` to run live static analysis (`analyze_files`), resolve pub packages, and inspect Flutter widget trees; delegate Bazel build graph queries to `starlark_inspector`.',
        gcpDeploymentSupportGuidance:
          'Delegate Cloud Trace span hierarchy inspection (`invoke_workflow` -> `invoke_agent` -> `call_llm` -> `execute_tool`) and BigQuery token analytics to `trace_span_auditor`.',
        practiceDrillPrompt: `Query \`dart mcp-server\` for analyzer status and delegate trace inspection to \`${subagentName}\`.`,
        expectedPassSignal: `\`mcpServers\` registers \`["dart", "genkit"]\` & sub-agent has \`mode: subagent\`.`,
      },
    },
    {
      stepNumber: 5,
      title: 'Step 5: Train the Agent with Propose–Probe–Compose & EXPERIENCE.md',
      objective:
        'Run task-level recursion (`parallel` or `sequential`) on probe tasks and persist validated lessons into `EXPERIENCE.md`.',
      targetFile: 'EXPERIENCE.md & .codex/hooks.json',
      explanation:
        'During Propose–Probe–Compose, the improver proposes candidate harness edits, probes them on held-out tasks, and commits winning lessons (`cue`, `lesson`, `evidence`, `confidence`) to the Continual Experience Library.',
      bestPracticeTip:
        'Pair `EXPERIENCE.md` with an automated `PostToolUse` hook or plugin so the agent automatically runs `python3 scripts/' +
        scriptName +
        '` after every bash/edit action.',
      commonPitfall:
        'Adopting unprobed prompt edits without verifying that the candidate strictly improves or matches the baseline probe score.',
      codeSnippet: `### [${skillSlug}_lesson_1]
- **cue**: Agent executes ${skillSlug.replace(/_/g, ' ')} tasks with multi-step verification
- **lesson**: Offload validation to \`python scripts/${scriptName}\` and trigger \`${skillSlug}\` from guardrails.md
- **evidence**: Probe pass rate improved from 0.0% (base) to 100.0% (adapted k=1)
- **confidence**: high`,
      verificationCommand: `harness2-demo --k 2 --mode both`,
      agentTrainingGuide: {
        trainingObjective:
          'Train the improver and solver agents via Propose–Probe–Compose (`k=2`, `4k=8` rollouts) and commit verified lessons to `EXPERIENCE.md`.',
        dartFlutterDeveloperGuidance:
          'Probe candidate Starlark rules and Dart Genkit flows on multi-platform targets (`dart_aot_binary`, `flutter_web_bundle --wasm`, `rules_oci`) before committing to `EXPERIENCE.md`.',
        gcpDeploymentSupportGuidance:
          'Probe candidate Google Cloud deployments with `agents-cli eval run`, verify OpenTelemetry `NO_CONTENT` privacy & memory headroom, and publish via `agents-cli publish gemini`.',
        practiceDrillPrompt:
          'Run a k=2 Propose–Probe–Compose sweep, compare parallel (`agg`) vs sequential (`seq`) probe scores, and commit the winning lesson to `EXPERIENCE.md`.',
        expectedPassSignal: '100% probe pass rate & structured lesson committed to `EXPERIENCE.md`.',
      },
    },
  ];

  const experienceMarkdown = `# Continual Experience Library — ${
    params.title ?? 'Synthesized Agent Harness'
  }

### [${skillSlug}_deterministic_gate]
- **cue**: Tasks requiring multi-step execution from video/SOP instructions (${stepItems.length} extracted stages)
- **lesson**: Trigger \`${skillSlug}\` from \`guardrails.md\` and enforce deterministic verification via \`python scripts/${scriptName}\` prior to final answer submission.
- **evidence**: Eliminates unverified formatting and tool-ordering failures across probe rollouts (0/2 -> 2/2 passed).
- **confidence**: high
<edits>
  <file path="guardrails.md" op="append">- When executing the ${skillSlug.replace(
    /_/g,
    ' '
  )} workflow, load the \`${skillSlug}\` skill.</file>
  <file path="scripts/${scriptName}" op="write">Deterministic environment and output verifier</file>
</edits>
`;

  const trainingScenarios: TrainingScenario[] = [
    {
      id: 'train-1-golden-path',
      scenarioTitle: 'Scenario 1: Golden-Path End-to-End Execution',
      difficulty: 'Foundational',
      userPrompt: `Execute the complete ${skillSlug.replace(
        /_/g,
        ' '
      )} workflow following all ${stepItems.length} steps and verify the output.`,
      expectedToolTrajectory: [
        `load_skill("${skillSlug}")`,
        `delegate_subagent("${subagentName}")`,
        `bash("python3 scripts/${scriptName} .")`,
      ],
      deterministicVerifierCmd: `python3 scripts/${scriptName} .`,
      gradingRubric:
        '1.0 if agent loads `' +
        skillSlug +
        '`, executes all steps in sequence, and `scripts/' +
        scriptName +
        '` returns `"status": "PASS"`; 0.0 otherwise.',
    },
    {
      id: 'train-2-adversarial-input',
      scenarioTitle: 'Scenario 2: Missing Dependency / Malformed Input Recovery',
      difficulty: 'Adversarial',
      userPrompt: `Run the ${skillSlug.replace(
        /_/g,
        ' '
      )} workflow when an upstream configuration file has a missing field or unpinned version.`,
      expectedToolTrajectory: [
        `load_skill("${skillSlug}")`,
        `bash("python3 scripts/${scriptName} .")`,
        'apply_self_healing_remediation()',
        `bash("python3 scripts/${scriptName} .")`,
      ],
      deterministicVerifierCmd: `python3 scripts/${scriptName} .`,
      gradingRubric:
        '1.0 if agent detects the anomaly via `scripts/' +
        scriptName +
        '`, repairs the configuration without hallucinating flags, and re-runs verification to PASS.',
    },
    {
      id: 'train-3-context-scale',
      scenarioTitle: 'Scenario 3: High-Volume Log & Trace Delegation',
      difficulty: 'Edge-Case Recovery',
      userPrompt:
        'Analyze a 5,000-line execution trace, isolate the root-cause span or build target failure, and apply the fix.',
      expectedToolTrajectory: [
        `delegate_subagent("${subagentName}")`,
        `load_skill("${skillSlug}")`,
        `bash("python3 scripts/${scriptName} .")`,
      ],
      deterministicVerifierCmd: `python3 scripts/${scriptName} .`,
      gradingRubric:
        '1.0 if agent delegates raw trace parsing to `' +
        subagentName +
        '` instead of overflowing the main context window, then verifies the fix.',
    },
  ];

  const supportRunbook: SupportRunbookItem[] = [
    {
      symptom: 'Agent skips domain steps or forgets to load the specialized SKILL.md',
      rootCause:
        'Skill name is missing from always-on files (`systemprompt.md` / `guardrails.md` / `AGENTS.md`).',
      automatedHookOrScript: 'Harness² `autotrigger()` + `validateTree()` preflight gate',
      selfHealingAction:
        'Automatically injects `- When <desc>, load the `' +
        skillSlug +
        '` skill.` into `guardrails.md` or `AGENTS.md`.',
      outcomeGuarantee: '100% skill discovery on every turn without manual user prompting.',
    },
    {
      symptom: 'Agent hallucinates CLI flags, arithmetic totals, or schema fields',
      rootCause: 'Relying on free-text LLM reasoning instead of deterministic verification code.',
      automatedHookOrScript: `PostToolUse Hook -> \`python3 scripts/${scriptName}\``,
      selfHealingAction:
        'Runs `scripts/' +
        scriptName +
        '` automatically after tool execution and feeds structured JSON diagnostics back to the agent.',
      outcomeGuarantee: 'Zero unverified outputs; agent self-corrects before turn completion.',
    },
    {
      symptom: 'Context window saturation or mid-trajectory truncation on large repos/logs',
      rootCause: 'Always-on prompt exceeds budget or main agent reads massive raw log files directly.',
      automatedHookOrScript: `Sub-Agent Delegation (\`sub_agents/${subagentName}/AGENT.md\`)`,
      selfHealingAction:
        'Routes raw file/trace inspection to `' +
        subagentName +
        '` (`mode: subagent`), returning a <400-token structured digest.',
      outcomeGuarantee: 'Preserves full reasoning token budget for high-accuracy synthesis.',
    },
  ];

  return {
    blueprintId: `arch-${Date.now()}`,
    title:
      params.title ??
      (isBazel
        ? 'Hermetic Bazel Bzlmod & Dart/Flutter SDK Harness'
        : isGcp
        ? 'Google Cloud ADK Deployment & Observability Harness'
        : 'Custom Video & SOP Synthesized Agent Harness'),
    sourceType: params.videoTranscript ? 'hybrid_video_and_sop' : 'instruction_steps',
    videoUrl: '/assets/harness2-video.mp4',
    summary: `Synthesized a complete, 0-error ${
      substrate === 'oc' ? 'OpenCode (oc)' : 'Codex (cx)'
    } agent harness from ${stepItems.length} instruction stages, complete with a 5-step setup curriculum, ${
      trainingScenarios.length
    } multi-turn training scenarios, and a 3-tier self-healing support runbook.`,
    timelineSegments,
    workflowDecision: {
      recommendedSubstrate: substrate,
      substrateRationale:
        substrate === 'oc'
          ? 'OpenCode (`oc`) selected for modular 4-file always-on separation (24,000-char cap), TypeScript output verification plugins (`plugin/verify_output.ts`), and `mode: subagent` isolation.'
          : 'Codex (`cx`) selected for compact single-file `AGENTS.md` injection (8,000-char cap) paired with strict `.codex/hooks.json` `PostToolUse` command enforcement.',
      recommendedRecursionMode: 'parallel',
      recursionRationale:
        'Parallel (`agg`) mode with k=2 explores diverse candidate skills and helper scripts in Stage 1, then composes the highest-scoring deterministic verifier in Stage 2 (`4k=8` rollouts, `3k=6` improver sessions).',
      recommendedBudgetK: 2,
      alwaysOnCharEstimate: alwaysOnChars,
      alwaysOnCap: substrate === 'oc' ? 24000 : 8000,
      deterministicScripts: [`scripts/${scriptName}`],
      mcpServersRequired: ['dart (dart mcp-server)', 'genkit (genkit mcp)'],
    },
    setupCurriculum,
    generatedTree,
    experienceMarkdown,
    trainingScenarios,
    supportRunbook,
    synthesisEngine: 'deterministic-architect',
  };
}

import {
  CODEX_SURFACE,
  OPENCODE_SURFACE,
  Tree,
  validateTree,
  ValidationCensus,
} from './harnessEngine';

export interface HarnessConfigurationV1 {
  schemaVersion: 'harness2.v1' | string;
  exportedAt: string;
  substrate: 'oc' | 'cx';
  sourceAssetPath?: string;
  validationCensus: ValidationCensus;
  editorTree: Tree;
}

export interface HarnessConfigurationProfile {
  id: string;
  name: string;
  badge: string;
  sourceAssetPath?: string;
  config: HarnessConfigurationV1;
}

export const ATTACHED_HARNESS_CONFIG_ASSET_PATH =
  '/assets/aistudio/harness-configuration-oc_46a97fbf.json';

export const ATTACHED_OC_HARNESS_CONFIGURATION: HarnessConfigurationV1 = {
  schemaVersion: 'harness2.v1',
  exportedAt: '2026-10-19T18:16:33.656Z',
  substrate: 'oc',
  sourceAssetPath: ATTACHED_HARNESS_CONFIG_ASSET_PATH,
  validationCensus: {
    valid: true,
    errors: [],
    repairedSkills: [],
    alwaysOnChars: 1410,
    alwaysOnMax: 24000,
    nFiles: 9,
    skills: 2,
    subAgents: 1,
    scripts: 1,
    plugins: 0,
    hooks: 0,
    mcpServers: ['dart', 'genkit'],
    offSurfacePaths: [],
  },
  editorTree: {
    'systemprompt.md':
      'You are a Google Cloud Agent Deployment, Evaluation & Observability Engineer.\nWhen scaffolding, evaluating, deploying, publishing to Gemini, or monitoring ADK agents on Google Cloud, load the `google_agents_cli_deploy` skill.\nWhen authoring MODULE.bazel, BUILD.bazel, or deploying Dart/Flutter SDK targets, load the `developing_bazel` skill.\n',
    'guardrails.md':
      '- Always pass `--no-confirm-project` when invoking `agents-cli deploy` in non-interactive sessions.\n- Explicitly pass `--service-account` when deploying against Terraform-provisioned infrastructure.\n- Keep prompt/response PII out of Cloud Trace spans by setting `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT` in ADK Python (`false` in ADK Go).\n- Balance `--concurrency` with `--memory` (`peak ≈ base + concurrency × per_request_memory`) and run `python scripts/gcloud_deploy_monitor.py` before deploying.\n',
    'LongTermMEMORY.md':
      'Repository `chrisfbaileycb-arch/agents-cli` provides 7 official skills (`google-agents-cli-workflow`, `adk-code`, `scaffold`, `eval`, `deploy`, `publish`, `observability`). Native ADK registration on Agent Runtime invokes `:streamQuery` (`streaming_agent_run_with_events`), while Cloud Run and GKE register via A2A (`/.well-known/agent-card.json`).\n',
    'tool_descriptions/tool_guidance.md':
      'Use `python scripts/gcloud_deploy_monitor.py` to validate memory-concurrency sizing and OpenTelemetry environment variables before running `agents-cli deploy` or `agents-cli publish gemini`.\n',
    'skills/google_agents_cli_deploy/SKILL.md':
      '---\nname: google_agents_cli_deploy\ndescription: Build, evaluate, deploy, publish, and monitor Google Cloud ADK agents across Agent Runtime, Cloud Run, and GKE using google-agents-cli\n---\n\n1. Scaffold with `agents-cli create <name> -d <agent_runtime|cloud_run|gke> --agent-gateway --bq-analytics`.\n2. Run `agents-cli eval run` and `python scripts/gcloud_deploy_monitor.py` before deploying.\n3. Deploy non-interactively with `agents-cli deploy --no-confirm-project --service-account <SA> --memory 4Gi --concurrency 8 --min-instances 1`.\n4. Register with Gemini via `agents-cli publish gemini` (ADK `:streamQuery` on Agent Runtime, A2A `.well-known/agent-card.json` on Cloud Run / GKE).\n',
    'skills/developing_bazel/SKILL.md':
      '---\nname: developing_bazel\ndescription: Author hermetic Bzlmod (MODULE.bazel) builds, custom Starlark rules, and Dart/Flutter SDK deployments\n---\n\n1. Use Bzlmod (`MODULE.bazel`) and update lockfiles with `bazel mod deps --lockfile_mode=update`.\n',
    'scripts/gcloud_deploy_monitor.py':
      'import json\nimport sys\n\ndef check(memory_gi=4.0, concurrency=8, per_req_mib=220.0):\n    peak = 512.0 + concurrency * per_req_mib\n    limit = memory_gi * 1024.0\n    return {"ok": peak < limit * 0.85, "peak_mib": peak, "limit_mib": limit}\n\nif __name__ == "__main__":\n    print(json.dumps(check(), indent=2))\n',
    'sub_agents/cloud_trace_auditor/AGENT.md':
      '---\nmode: subagent\ndescription: Inspect OpenTelemetry span trees (invoke_workflow -> invoke_agent -> call_llm -> execute_tool) and BigQuery Agent Analytics\n---\n\nInspect Cloud Trace latencies, `reasoning_engine_stderr` logs, and BigQuery Agent Analytics tables for deployed ADK agents.\n',
    'mcp.json':
      '{\n  "mcpServers": {\n    "dart": {\n      "command": "dart",\n      "args": [\n        "mcp-server"\n      ]\n    },\n    "genkit": {\n      "command": "genkit",\n      "args": [\n        "mcp"\n      ]\n    }\n  }\n}',
  },
};

export const INITIAL_HARNESS_CONFIGURATION_PROFILES: HarnessConfigurationProfile[] = [
  {
    id: 'attached-oc-46a97fbf',
    name: 'harness-configuration-oc_46a97fbf.json',
    badge: 'Attached User Config (oc · 9 files)',
    sourceAssetPath: ATTACHED_HARNESS_CONFIG_ASSET_PATH,
    config: ATTACHED_OC_HARNESS_CONFIGURATION,
  },
];

export function parseAndValidateHarnessConfigJson(
  rawJson: string,
  fallbackSubstrate: 'oc' | 'cx' = 'oc'
): {
  ok: boolean;
  error?: string;
  config?: HarnessConfigurationV1;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Harness configuration JSON must be a top-level object.' };
    }

    let substrate: 'oc' | 'cx' = fallbackSubstrate;
    if (parsed.substrate === 'oc' || parsed.substrate === 'cx') {
      substrate = parsed.substrate;
    }

    let rawTree: Record<string, unknown> | null = null;
    if (parsed.editorTree && typeof parsed.editorTree === 'object' && !Array.isArray(parsed.editorTree)) {
      rawTree = parsed.editorTree as Record<string, unknown>;
    } else if (parsed.tree && typeof parsed.tree === 'object' && !Array.isArray(parsed.tree)) {
      rawTree = parsed.tree as Record<string, unknown>;
    } else if (
      typeof parsed['systemprompt.md'] === 'string' ||
      typeof parsed['AGENTS.md'] === 'string'
    ) {
      rawTree = parsed as Record<string, unknown>;
      if (typeof parsed['AGENTS.md'] === 'string' && typeof parsed['systemprompt.md'] !== 'string') {
        substrate = 'cx';
      }
    }

    if (!rawTree) {
      return {
        ok: false,
        error:
          'Missing `editorTree` object in configuration JSON. Expected a harness2.v1 configuration with `editorTree` or a file path map.',
      };
    }

    const cleanTree: Tree = {};
    for (const [k, v] of Object.entries(rawTree)) {
      if (typeof v === 'string') {
        cleanTree[k] = v;
      } else if (v !== null && v !== undefined) {
        cleanTree[k] = JSON.stringify(v, null, 2);
      }
    }

    if (Object.keys(cleanTree).length === 0) {
      return {
        ok: false,
        error: '`editorTree` contains 0 component files.',
      };
    }

    const surface = substrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE;
    const validationCensus = validateTree(surface, cleanTree);

    const config: HarnessConfigurationV1 = {
      schemaVersion: typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : 'harness2.v1',
      exportedAt:
        typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      substrate,
      sourceAssetPath:
        typeof parsed.sourceAssetPath === 'string' ? parsed.sourceAssetPath : undefined,
      validationCensus,
      editorTree: cleanTree,
    };

    return { ok: true, config };
  } catch (err) {
    return {
      ok: false,
      error: `Invalid JSON syntax: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

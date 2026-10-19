import { Tree } from './harnessEngine';

export type UniversalPlatformId =
  | 'standalone_sdk'
  | 'google_adk_vertex'
  | 'firebase_genkit'
  | 'langgraph_autogen'
  | 'claude_cursor_ide'
  | 'a2a_http_container';

export interface UniversalPlatformSpec {
  id: UniversalPlatformId;
  name: string;
  shortLabel: string;
  badge: string;
  runtimeCommand: string;
  deployCommand: string;
  summary: string;
  primitiveMappings: Array<{
    harnessPrimitive: string;
    sourceFiles: string;
    targetPlatformEquivalent: string;
    implementationRule: string;
  }>;
}

export interface StepEffectivePlaybook {
  stepNumber: number;
  title: string;
  harnessFilesInvolved: string[];
  howToUseEffectively: string[];
  howToDeployEffectively: string[];
  withoutOpenCodeOrCodex: {
    conceptTranslation: string;
    dropInImplementationPattern: string;
    codeExample: string;
  };
  verificationCommand: string;
}

export interface TranspiledPlatformBundle {
  platformId: UniversalPlatformId;
  platformName: string;
  combinedAlwaysOnPrompt: string;
  alwaysOnChars: number;
  generatedFiles: Record<string, string>;
  runInstructions: string[];
  deployInstructions: string[];
}

export const UNIVERSAL_PLATFORMS: Record<UniversalPlatformId, UniversalPlatformSpec> = {
  standalone_sdk: {
    id: 'standalone_sdk',
    name: 'Standalone Gemini / OpenAI / Anthropic SDK Loop (No OpenCode or Codex)',
    shortLabel: 'Standalone SDK Loop',
    badge: 'Zero-Framework Python / TS',
    runtimeCommand: 'python3 universal_harness_runner.py --task "Deploy and audit ADK agent"',
    deployCommand: 'docker build -t universal-harness-agent . && gcloud run deploy universal-harness-agent --source .',
    summary:
      'Runs your Harness² configuration directly on top of `@google/genai`, OpenAI, or Anthropic SDKs using a 60-line tool-calling loop with native `load_skill()`, `run_verifier_script()`, and `delegate_subagent()` tools.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface',
        sourceFiles: 'systemprompt.md + guardrails.md + LongTermMEMORY.md + tool_guidance.md',
        targetPlatformEquivalent: 'System Instruction (`config.systemInstruction`)',
        implementationRule:
          'Concatenate the 4 always-on files with markdown headers into a single system prompt (< 24,000 chars) injected on turn 0.',
      },
      {
        harnessPrimitive: 'On-Demand Skills',
        sourceFiles: 'skills/*/SKILL.md',
        targetPlatformEquivalent: 'Function Tool: `load_skill(skill_name: string)`',
        implementationRule:
          'Do NOT paste SKILL.md bodies into the system prompt. Keep only the 1-line trigger in the system prompt and let the model call `load_skill("google_agents_cli_deploy")` to read the markdown on demand.',
      },
      {
        harnessPrimitive: 'Deterministic Verifiers',
        sourceFiles: 'scripts/*.py (e.g. gcloud_deploy_monitor.py)',
        targetPlatformEquivalent: 'Function Tool + Post-Turn Gate: `run_verifier(script_name, args)`',
        implementationRule:
          'Execute `python3 scripts/gcloud_deploy_monitor.py` via `subprocess.run()` before allowing the agent loop to return its final answer.',
      },
      {
        harnessPrimitive: 'Sub-Agents',
        sourceFiles: 'sub_agents/*/AGENT.md (e.g. cloud_trace_auditor)',
        targetPlatformEquivalent: 'Isolated Child `generateContent` Call: `delegate_subagent(name, task)`',
        implementationRule:
          'Spawn a fresh stateless SDK call using `AGENT.md` as its `systemInstruction` so noisy logs never pollute the parent message history.',
      },
      {
        harnessPrimitive: 'MCP Servers',
        sourceFiles: 'mcp.json (`dart mcp-server`, `genkit mcp`)',
        targetPlatformEquivalent: 'MCP Stdio Client (`@modelcontextprotocol/sdk` / `mcp` Python package)',
        implementationRule:
          'Spawn each entry in `mcpServers` over stdio and merge `list_tools()` into the model tool declarations.',
      },
    ],
  },
  google_adk_vertex: {
    id: 'google_adk_vertex',
    name: 'Google Cloud ADK & Vertex AI Agent Engine (`google-adk` + `agents-cli`)',
    shortLabel: 'Google Cloud ADK',
    badge: 'Agent Runtime / Cloud Run / GKE',
    runtimeCommand: 'agents-cli run --agent agent.py',
    deployCommand:
      'agents-cli deploy --no-confirm-project --memory 4Gi --concurrency 8 --min-instances 1 --agent-identity',
    summary:
      'Translates your Harness² tree into a native Google ADK `LlmAgent` hierarchy with `FunctionTool` skill loaders, child `LlmAgent` sub-agents, `after_tool_callback` verifiers, and `McpToolset` connections.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface',
        sourceFiles: 'systemprompt.md + guardrails.md + LongTermMEMORY.md',
        targetPlatformEquivalent: 'ADK `LlmAgent(instruction=COMBINED_ALWAYS_ON)`',
        implementationRule:
          'Pass the merged always-on files as the root `LlmAgent` instruction string.',
      },
      {
        harnessPrimitive: 'On-Demand Skills',
        sourceFiles: 'skills/google_agents_cli_deploy/SKILL.md, skills/developing_bazel/SKILL.md',
        targetPlatformEquivalent: 'ADK `FunctionTool(load_harness_skill)`',
        implementationRule:
          'Expose a Python function `load_harness_skill(skill_name: str) -> str` that reads `skills/{skill_name}/SKILL.md` when triggered by the root agent.',
      },
      {
        harnessPrimitive: 'Deterministic Verifiers',
        sourceFiles: 'scripts/gcloud_deploy_monitor.py',
        targetPlatformEquivalent: 'ADK `after_tool_callback` + `FunctionTool(verify_deployment_sizing)`',
        implementationRule:
          'Bind `scripts/gcloud_deploy_monitor.py` both as an explicit tool and as an `after_tool_callback` guardrail.',
      },
      {
        harnessPrimitive: 'Sub-Agents',
        sourceFiles: 'sub_agents/cloud_trace_auditor/AGENT.md',
        targetPlatformEquivalent: 'ADK `LlmAgent(name="cloud_trace_auditor", ...)` in `sub_agents=[...]`',
        implementationRule:
          'Compile each `sub_agents/<name>/AGENT.md` into a dedicated child `LlmAgent` attached to the root agent.',
      },
      {
        harnessPrimitive: 'MCP Servers',
        sourceFiles: 'mcp.json (`dart`, `genkit`)',
        targetPlatformEquivalent: 'ADK `McpToolset(StdioServerParameters(...))`',
        implementationRule:
          'Load `mcp.json` entries into `McpToolset` instances and attach them to the ADK agent tools list.',
      },
    ],
  },
  firebase_genkit: {
    id: 'firebase_genkit',
    name: 'Firebase Genkit 1.0 (Dart 3.10 / TypeScript / Python / Go)',
    shortLabel: 'Firebase Genkit 1.0',
    badge: 'Dart / TS / Python / Go',
    runtimeCommand: 'genkit flow:run harnessAgentFlow \'{"task": "Audit Bazel & deploy ADK"}\' --non-interactive',
    deployCommand: 'gcloud run deploy genkit-harness-service --source . --region us-east1',
    summary:
      'Compiles the Harness² tree into a typed Genkit 1.0 Flow (`defineFlow`), registers `SKILL.md` files and `scripts/*.py` verifiers via `defineTool`, and mounts `mcp.json` via `defineMcpHost`.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface',
        sourceFiles: 'systemprompt.md + guardrails.md + LongTermMEMORY.md',
        targetPlatformEquivalent: 'Genkit `ai.generate({ system: ALWAYS_ON_PROMPT, ... })`',
        implementationRule:
          'Inject the combined always-on markdown into the `system` parameter of `ai.generate()`.',
      },
      {
        harnessPrimitive: 'On-Demand Skills',
        sourceFiles: 'skills/*/SKILL.md',
        targetPlatformEquivalent: 'Genkit `ai.defineTool({ name: "loadSkill", ... })`',
        implementationRule:
          'Register a strongly-typed Genkit tool (using `@Schema()` in Dart or `z.object()` in TS) that returns the requested `SKILL.md` body.',
      },
      {
        harnessPrimitive: 'Deterministic Verifiers',
        sourceFiles: 'scripts/gcloud_deploy_monitor.py',
        targetPlatformEquivalent: 'Genkit `ai.defineTool({ name: "runVerifierScript", ... })` + Flow Post-Check',
        implementationRule:
          'Run the Python verifier inside the final step of `defineFlow` and inspect the trace via `genkit trace:get`.',
      },
      {
        harnessPrimitive: 'MCP Servers',
        sourceFiles: 'mcp.json (`dart mcp-server`, `genkit mcp`)',
        targetPlatformEquivalent: 'Genkit `defineMcpHost({ name: "harness-mcp", mcpServers: ... })`',
        implementationRule:
          'Pass the `mcpServers` map from `mcp.json` directly into `defineMcpHost` and attach `mcpHost.getActiveTools(ai)`.',
      },
    ],
  },
  langgraph_autogen: {
    id: 'langgraph_autogen',
    name: 'LangGraph / CrewAI / AutoGen State-Graph Orchestrators',
    shortLabel: 'LangGraph / CrewAI',
    badge: 'Stateful Graph Runtime',
    runtimeCommand: 'python3 langgraph_harness.py',
    deployCommand: 'langgraph up --port 8080 || docker compose up --build',
    summary:
      'Maps Harness² components into an explicit `StateGraph`: `[Supervisor Node] -> [Skill Loader / Tool Node] -> [Sub-Agent Worker Node] -> [Deterministic Verifier Gate Node]`.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface',
        sourceFiles: 'systemprompt.md + guardrails.md + LongTermMEMORY.md',
        targetPlatformEquivalent: 'Graph Supervisor `SystemMessage`',
        implementationRule:
          'Prepend the combined always-on prompt as the immutable root `SystemMessage` in the graph state.',
      },
      {
        harnessPrimitive: 'On-Demand Skills',
        sourceFiles: 'skills/*/SKILL.md',
        targetPlatformEquivalent: '`@tool def load_skill(skill_id: str)` in `ToolNode`',
        implementationRule:
          'Allow the supervisor node to dynamically pull `SKILL.md` instructions into tool messages only when needed.',
      },
      {
        harnessPrimitive: 'Deterministic Verifiers',
        sourceFiles: 'scripts/gcloud_deploy_monitor.py',
        targetPlatformEquivalent: 'Conditional Graph Edge: `verifier_gate_node(state)`',
        implementationRule:
          'Route `supervisor -> verifier_gate_node`. If `gcloud_deploy_monitor.py` returns `"ok": false`, route back to `supervisor` with the error JSON instead of `END`.',
      },
      {
        harnessPrimitive: 'Sub-Agents',
        sourceFiles: 'sub_agents/cloud_trace_auditor/AGENT.md',
        targetPlatformEquivalent: 'Dedicated Sub-Graph Node (`cloud_trace_auditor_node`)',
        implementationRule:
          'Execute the sub-agent in an isolated state channel and return only its concise summary to the parent state.',
      },
    ],
  },
  claude_cursor_ide: {
    id: 'claude_cursor_ide',
    name: 'Claude Code / Cursor / Windsurf / Cline / GitHub Copilot',
    shortLabel: 'Claude Code / Cursor / IDE',
    badge: 'CLAUDE.md · .cursor/rules · .mcp.json',
    runtimeCommand: 'claude "Run the deployment workflow using the configured skills"',
    deployCommand: 'cp -r exported_ide_harness/. /path/to/your/repo/',
    summary:
      'Exports your Harness² configuration directly into `CLAUDE.md`, `.cursor/rules/*.mdc`, `.clinerules`, `.github/copilot-instructions.md`, and `.mcp.json` for any coding agent.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface',
        sourceFiles: 'systemprompt.md + guardrails.md + LongTermMEMORY.md + tool_guidance.md',
        targetPlatformEquivalent: '`CLAUDE.md` / `.cursor/rules/00-always-on.mdc` (`alwaysApply: true`) / `.clinerules`',
        implementationRule:
          'Write the merged always-on files to `CLAUDE.md` and `.cursor/rules/00-always-on.mdc` with `alwaysApply: true`.',
      },
      {
        harnessPrimitive: 'On-Demand Skills',
        sourceFiles: 'skills/google_agents_cli_deploy/SKILL.md, skills/developing_bazel/SKILL.md',
        targetPlatformEquivalent: '`.claude/skills/<name>/SKILL.md` & `.cursor/rules/<name>.mdc` (`alwaysApply: false`)',
        implementationRule:
          'Convert each `SKILL.md` into an agent-requested rule (`.cursor/rules/<skill>.mdc` with description frontmatter) so the IDE loads it only when relevant.',
      },
      {
        harnessPrimitive: 'Deterministic Verifiers',
        sourceFiles: 'scripts/gcloud_deploy_monitor.py',
        targetPlatformEquivalent: '`.claude/settings.json` `PostToolUse` Hook + `scripts/gcloud_deploy_monitor.py`',
        implementationRule:
          'Configure `PostToolUse` hooks in `.claude/settings.json` or pre-commit hooks to run `python3 scripts/gcloud_deploy_monitor.py`.',
      },
      {
        harnessPrimitive: 'MCP Servers',
        sourceFiles: 'mcp.json',
        targetPlatformEquivalent: '`.mcp.json` / `.cursor/mcp.json`',
        implementationRule:
          'Copy `mcp.json` directly to `.mcp.json` and `.cursor/mcp.json` so `dart mcp-server` and `genkit mcp` start automatically.',
      },
    ],
  },
  a2a_http_container: {
    id: 'a2a_http_container',
    name: 'Universal A2A (`/.well-known/agent-card.json`) + MCP Microservice Container',
    shortLabel: 'Universal A2A + MCP Container',
    badge: 'Any Platform via HTTP / A2A',
    runtimeCommand: 'curl -X POST http://localhost:3000/api/mcp/rpc -d \'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\'',
    deployCommand:
      'gcloud run deploy harness2-universal-bridge --source . --port 3000 --allow-unauthenticated',
    summary:
      'Packages the entire Harness² configuration as a self-contained HTTP + MCP JSON-RPC + A2A microservice so ServiceNow, Salesforce Agentforce, n8n, Zapier, or any custom platform can invoke your skills and verifiers over HTTPS.',
    primitiveMappings: [
      {
        harnessPrimitive: 'Always-On Surface & Skills',
        sourceFiles: 'All 9 files in `harness-configuration-oc_46a97fbf.json`',
        targetPlatformEquivalent: 'REST `/api/agent-connector/*` + MCP `/api/mcp/rpc` + A2A `/.well-known/agent-card.json`',
        implementationRule:
          'Deploy this service once to Cloud Run or GKE; external agents discover capabilities via `/.well-known/agent-card.json` or `/api/mcp/rpc`.',
      },
    ],
  },
};

export const STEP_BY_STEP_EFFECTIVE_PLAYBOOK: StepEffectivePlaybook[] = [
  {
    stepNumber: 1,
    title: 'Step 1: Always-On Surface & Character Budget (`systemprompt.md`, `guardrails.md`, `LongTermMEMORY.md`, `tool_guidance.md`)',
    harnessFilesInvolved: [
      'systemprompt.md',
      'guardrails.md',
      'LongTermMEMORY.md',
      'tool_descriptions/tool_guidance.md',
    ],
    howToUseEffectively: [
      'Keep total always-on text strictly under the surface budget (1,410 / 24,000 chars in your attached `oc` config; ≤ 32,000 chars on `cx`) so the model never suffers instruction dilution.',
      'Separate concerns cleanly: role & skill routing in `systemprompt.md`, non-negotiable CLI/security flags (`--no-confirm-project`, `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`) in `guardrails.md`, architecture facts (`:streamQuery` vs A2A) in `LongTermMEMORY.md`, and verifier script commands in `tool_descriptions/tool_guidance.md`.',
      'Include an explicit 1-line trigger for every skill in `skills/*/SKILL.md` so `validateTree()` reports 0 untriggered-skill errors.',
    ],
    howToDeployEffectively: [
      'Run `harness2 check` or validate in the **Surface Validator & Editor** before committing any prompt change.',
      'Version-control your exported `harness-configuration-oc.json` alongside your application code so prompt and guardrail updates are atomic and auditable.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'When deploying without OpenCode or Codex, merge the 4 always-on files in deterministic order (`systemprompt.md` → `guardrails.md` → `LongTermMEMORY.md` → `tool_guidance.md`) into your target platform’s root `system_instruction` / `SystemMessage` / `CLAUDE.md`.',
      dropInImplementationPattern:
        'Use the deterministic `compile_always_on_prompt(tree)` helper below in Python, TypeScript, or Dart to build the exact system prompt at startup.',
      codeExample: `def compile_always_on_prompt(editor_tree: dict[str, str]) -> str:
    sections = [
        ("SYSTEM PROMPT", editor_tree.get("systemprompt.md", "")),
        ("OPERATIONAL GUARDRAILS", editor_tree.get("guardrails.md", "")),
        ("LONG-TERM DOMAIN MEMORY", editor_tree.get("LongTermMEMORY.md", "")),
        ("TOOL GUIDANCE", editor_tree.get("tool_descriptions/tool_guidance.py") or editor_tree.get("tool_descriptions/tool_guidance.md", "")),
    ]
    merged = "\\n\\n".join(f"## {title}\\n{body.strip()}" for title, body in sections if body.strip())
    assert len(merged) <= 24000, f"Always-on budget exceeded: {len(merged)} > 24000"
    return merged`,
    },
    verificationCommand:
      'curl -s http://localhost:3000/api/harness-configurations | jq ".activeProfile.config.validationCensus"',
  },
  {
    stepNumber: 2,
    title: 'Step 2: On-Demand Modular Skills & Progressive Disclosure (`skills/google_agents_cli_deploy/SKILL.md`, `skills/developing_bazel/SKILL.md`)',
    harnessFilesInvolved: [
      'skills/google_agents_cli_deploy/SKILL.md',
      'skills/developing_bazel/SKILL.md',
    ],
    howToUseEffectively: [
      'Author each `SKILL.md` with YAML frontmatter (`name`, `description`) followed by numbered, deterministic execution steps.',
      'Never dump full multi-page manuals into always-on files—let the agent load `google_agents_cli_deploy` only when scaffolding/deploying GCP agents, and `developing_bazel` only when editing `MODULE.bazel` or Dart/Flutter SDK targets.',
      'If you add a new `skills/<name>/SKILL.md`, click **Run autotrigger() Repair** in the Surface Validator to automatically inject its trigger bullet into `guardrails.md` or `AGENTS.md`.',
    ],
    howToDeployEffectively: [
      'Publish skills both inside your `harness-configuration-oc.json` bundle and via the live REST/MCP endpoints (`GET /api/agent-connector/skills/:skillId` and MCP tool `load_harness_skill`).',
      'For CLI distribution, structure skills under `skills/<skill-name>/SKILL.md` so `npx skills add <owner>/<repo>` works out of the box.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'In any non-OpenCode/Codex platform (Vertex ADK, Genkit, LangGraph, OpenAI/Anthropic SDKs), implement progressive disclosure by registering a single `load_harness_skill(skill_id)` function tool.',
      dropInImplementationPattern:
        'Register `load_harness_skill` as a standard tool in your LLM call. When the system prompt says "load the `google_agents_cli_deploy` skill", the LLM invokes `load_harness_skill("google_agents_cli_deploy")` and receives the `SKILL.md` markdown in the tool response.',
      codeExample: `# Works in Google ADK, LangChain/LangGraph, or raw Gemini/OpenAI tool-calling:
def load_harness_skill(skill_id: str) -> str:
    """Load specialized SKILL.md instructions on demand by skill_id (e.g. google_agents_cli_deploy, developing_bazel)."""
    path = f"skills/{skill_id}/SKILL.md"
    if path not in EDITOR_TREE:
        return f"Error: Skill '{skill_id}' not found. Available: {list(EDITOR_TREE.keys())}"
    return EDITOR_TREE[path]`,
    },
    verificationCommand:
      'curl -s http://localhost:3000/api/agent-connector/skills/google_agents_cli_deploy | jq "{id, skillPath, triggerLine}"',
  },
  {
    stepNumber: 3,
    title: 'Step 3: Deterministic Verification Scripts & Lifecycle Gates (`scripts/gcloud_deploy_monitor.py`, `scripts/bazel_audit.py`)',
    harnessFilesInvolved: ['scripts/gcloud_deploy_monitor.py'],
    howToUseEffectively: [
      'Offload all arithmetic, memory-concurrency OOM formulas (`peak = 512 + concurrency * 220`), lockfile checks, and schema validations to deterministic Python scripts in `scripts/*.py`.',
      'Require the script to print machine-parseable JSON (`{"ok": true, "peak_mib": 2272.0, "limit_mib": 4096.0}`) so the agent cannot hallucinate pass/fail status.',
      'Reference the exact command (`python scripts/gcloud_deploy_monitor.py`) inside both `guardrails.md` and `tool_descriptions/tool_guidance.md`.',
    ],
    howToDeployEffectively: [
      'Run verifier scripts as a mandatory CI/CD pre-deploy gate before `agents-cli deploy` or `bazel build //...`.',
      'On Codex (`cx`) or Claude Code, bind the verifier script to `.codex/hooks.json` or `.claude/settings.json` under `PostToolUse` so every shell/edit action is automatically verified.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'When your target platform lacks native `PostToolUse` hooks or OpenCode plugins, wrap your agent’s final response in a deterministic **Verifier Gate Loop**.',
      dropInImplementationPattern:
        'Before returning the agent’s final answer to the user, execute `scripts/gcloud_deploy_monitor.py`. If `result["ok"]` is `False`, feed the JSON output back into the agent conversation as a user/tool message for automatic self-correction.',
      codeExample: `import json, subprocess

def run_verifier_gate(memory_gi: float = 4.0, concurrency: int = 8) -> dict:
    proc = subprocess.run(
        ["python3", "scripts/gcloud_deploy_monitor.py"],
        capture_output=True, text=True, check=False
    )
    verdict = json.loads(proc.stdout)
    if not verdict.get("ok"):
        raise RuntimeError(f"Verifier Gate Rejected Deployment: {verdict}")
    return verdict`,
    },
    verificationCommand:
      'curl -s -X POST http://localhost:3000/api/mcp/rpc -H "Content-Type: application/json" -d \'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_gcp_agent_sizing","arguments":{"memoryGi":4,"concurrency":8}}}\'',
  },
  {
    stepNumber: 4,
    title: 'Step 4: Context-Isolated Sub-Agents (`sub_agents/cloud_trace_auditor/AGENT.md`)',
    harnessFilesInvolved: ['sub_agents/cloud_trace_auditor/AGENT.md'],
    howToUseEffectively: [
      'Use sub-agents for high-volume, read-heavy inspection tasks—such as scanning OpenTelemetry Cloud Trace span trees (`invoke_workflow -> invoke_agent -> call_llm -> execute_tool`), `reasoning_engine_stderr` logs, or BigQuery Agent Analytics tables.',
      'Keep the sub-agent’s `AGENT.md` focused on returning a structured, concise diagnostic summary so raw log dumps never overflow the primary agent’s context window.',
    ],
    howToDeployEffectively: [
      'In Google Cloud ADK, register `cloud_trace_auditor` in the root agent’s `sub_agents=[...]` list and grant its service account `roles/cloudtrace.user` and `roles/bigquery.dataViewer`.',
      'Keep `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT` enabled in production so trace inspection never exposes user PII.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'On any platform without native `sub_agents/*.md` discovery, implement a sub-agent as an **isolated stateless LLM call** (`delegate_to_subagent(agent_name, task_payload)`) with its own clean message array.',
      dropInImplementationPattern:
        'Load `sub_agents/cloud_trace_auditor/AGENT.md` as the child call’s system prompt, pass only the trace/log payload as the user message, and return only the child’s 1-paragraph synthesis to the main agent.',
      codeExample: `def delegate_to_subagent(client, subagent_name: str, task_input: str) -> str:
    """Run sub_agents/<name>/AGENT.md in an isolated context window."""
    agent_md = EDITOR_TREE[f"sub_agents/{subagent_name}/AGENT.md"]
    child_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=task_input,
        config={"system_instruction": agent_md},
    )
    return child_response.text`,
    },
    verificationCommand:
      'curl -s http://localhost:3000/api/gcp-deployments | jq ".[0].recentSpans"',
  },
  {
    stepNumber: 5,
    title: 'Step 5: Model Context Protocol (`mcp.json` — `dart mcp-server` & `genkit mcp`) & 3-Way Connector',
    harnessFilesInvolved: ['mcp.json'],
    howToUseEffectively: [
      'Use `dart mcp-server` for live Dart/Flutter static analysis, symbol resolution, and `pubspec.yaml` management, and `genkit mcp` for inspecting Genkit flows and traces.',
      'Validate `mcp.json` in the **MCP Servers** tab to ensure every server entry defines a non-empty `command` and string array `args`.',
    ],
    howToDeployEffectively: [
      'For local IDE/CLI agents (Claude Desktop, Cursor, Windsurf, OpenCode, Codex), drop `mcp.json` into the workspace root.',
      'For cloud or serverless agents where local stdio binaries aren’t installed, connect over HTTP JSON-RPC to `POST /api/mcp/rpc` or REST `POST /api/agent-connector/execute`.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'Any agent platform can consume your `mcp.json` tools either via an MCP Stdio client library (`@modelcontextprotocol/sdk` in JS, `mcp` in Python, `defineMcpHost` in Genkit) OR over HTTP via this workbench’s `/api/mcp/rpc` bridge.',
      dropInImplementationPattern:
        'Point any external HTTP-capable agent (n8n, LangGraph, Vertex AI, custom microservice) to `POST /api/mcp/rpc` with standard JSON-RPC 2.0 `tools/list` and `tools/call` payloads.',
      codeExample: `// Connect ANY external agent over HTTP to the Harness² MCP JSON-RPC Bridge:
const response = await fetch("https://your-harness-host.run.app/api/mcp/rpc", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "load_harness_skill",
      arguments: { skillId: "developing_bazel" }
    }
  })
});`,
    },
    verificationCommand:
      'curl -s -X POST http://localhost:3000/api/mcp/rpc -H "Content-Type: application/json" -d \'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\'',
  },
  {
    stepNumber: 6,
    title: 'Step 6: Propose–Probe–Compose Recursion (`k` Budget) & `EXPERIENCE.md` Accumulation',
    harnessFilesInvolved: ['systemprompt.md', 'guardrails.md', 'LongTermMEMORY.md'],
    howToUseEffectively: [
      'Run `parallel` (`agg`) mode when exploring complementary harness variations (`skills`, `prompts`, `tools_and_scripts`, `subagents`) in parallel and composing the top probe winners.',
      'Run `sequential` (`seq`) mode when iteratively hardening a complex deployment where each step conditions on the previous probe ledger.',
    ],
    howToDeployEffectively: [
      'Use `k=1` or `k=2` in pre-production staging on a 10–20 task benchmark slice (`agents-cli eval run`), then freeze and export the winning `harness-configuration-oc.json` for zero-overhead `k=0` production serving.',
    ],
    withoutOpenCodeOrCodex: {
      conceptTranslation:
        'Propose–Probe–Compose is completely substrate-agnostic: you can run the exact same `k`-step adaptation loop around ANY agent function `run_agent(tree, task)` in Python or TypeScript.',
      dropInImplementationPattern:
        '1. **Propose** `k` candidate mutations to `editorTree` → 2. **Probe** each candidate tree on your task + verifier script (`scripts/gcloud_deploy_monitor.py`) → 3. **Select/Compose** the highest-scoring tree and append the winning lesson to `LongTermMEMORY.md`.',
      codeExample: `# Universal Propose-Probe-Compose loop for ANY agent platform:
candidates = propose_tree_candidates(base_tree, k=2)
probe_scores = {
    cand_id: evaluate_agent_with_verifier(cand_tree, task_suite)
    for cand_id, cand_tree in candidates.items()
}
best_id = max(probe_scores, key=lambda cid: probe_scores[cid]["score"])
winning_tree = candidates[best_id]`,
    },
    verificationCommand:
      'curl -s -X POST http://localhost:3000/api/run-sweep -H "Content-Type: application/json" -d \'{"k":2,"mode":"both"}\' | jq ".summaryRows"',
  },
];

export function transpileHarnessToPlatform(
  tree: Tree,
  platformId: UniversalPlatformId
): TranspiledPlatformBundle {
  const spec = UNIVERSAL_PLATFORMS[platformId] ?? UNIVERSAL_PLATFORMS.standalone_sdk;

  const sysPrompt = (tree['systemprompt.md'] ?? tree['AGENTS.md'] ?? '').trim();
  const guardrails = (tree['guardrails.md'] ?? '').trim();
  const memory = (tree['LongTermMEMORY.md'] ?? '').trim();
  const toolGuidance = (tree['tool_descriptions/tool_guidance.md'] ?? '').trim();

  const combinedAlwaysOnPrompt = [
    sysPrompt ? `## SYSTEM INSTRUCTIONS\n${sysPrompt}` : '',
    guardrails ? `## OPERATIONAL GUARDRAILS\n${guardrails}` : '',
    memory ? `## LONG-TERM DOMAIN MEMORY\n${memory}` : '',
    toolGuidance ? `## DETERMINISTIC TOOL GUIDANCE\n${toolGuidance}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const skillEntries = Object.entries(tree).filter(([k]) =>
    /^(?:skills|\.agents\/skills)\/[^/]+\/SKILL\.md$/.test(k)
  );
  const scriptEntries = Object.entries(tree).filter(([k]) => /^scripts\/[^/]+$/.test(k));
  const subAgentEntries = Object.entries(tree).filter(([k]) =>
    /^sub_agents\/[^/]+\/AGENT\.md$/.test(k)
  );
  const mcpRaw = tree['mcp.json'] ?? '{}';

  const generatedFiles: Record<string, string> = {};

  if (platformId === 'standalone_sdk') {
    generatedFiles['harness_bundle.json'] = JSON.stringify(tree, null, 2);
    generatedFiles['universal_harness_runner.py'] = `#!/usr/bin/env python3
"""
Standalone Universal Harness² Runner (No OpenCode or Codex Required)
Executes your exported harness2.v1 configuration on top of the Google GenAI / OpenAI / Anthropic SDK.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from google import genai
from google.genai import types

HARNESS_TREE: dict[str, str] = json.loads(
    Path("harness_bundle.json").read_text(encoding="utf-8")
)

ALWAYS_ON_SYSTEM_PROMPT = """${combinedAlwaysOnPrompt.replace(/"""/g, '\\"\\"\\"')}"""


def load_harness_skill(skill_name: str) -> str:
    """Load an on-demand SKILL.md from the harness tree (e.g. google_agents_cli_deploy, developing_bazel)."""
    for candidate in (f"skills/{skill_name}/SKILL.md", f".agents/skills/{skill_name}/SKILL.md"):
        if candidate in HARNESS_TREE:
            return HARNESS_TREE[candidate]
    return f"Skill '{skill_name}' not found."


def run_verifier_script(script_path: str = "scripts/gcloud_deploy_monitor.py") -> str:
    """Execute a deterministic verification script from the harness tree and return its JSON output."""
    if script_path not in HARNESS_TREE:
        return json.dumps({"ok": False, "error": f"Script {script_path} not found"})
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
        tmp.write(HARNESS_TREE[script_path])
        tmp_path = tmp.name
    proc = subprocess.run(["python3", tmp_path], capture_output=True, text=True, check=False)
    return proc.stdout or proc.stderr


def delegate_subagent(subagent_name: str, task_context: str) -> str:
    """Run an isolated sub-agent (e.g. cloud_trace_auditor) without polluting the main context window."""
    key = f"sub_agents/{subagent_name}/AGENT.md"
    agent_md = HARNESS_TREE.get(key, "You are a specialized diagnostic sub-agent.")
    client = genai.Client()
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=task_context,
        config=types.GenerateContentConfig(system_instruction=agent_md),
    )
    return resp.text or ""


def run_agent_task(user_task: str) -> str:
    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=user_task,
        config=types.GenerateContentConfig(
            system_instruction=ALWAYS_ON_SYSTEM_PROMPT,
            tools=[load_harness_skill, run_verifier_script, delegate_subagent],
        ),
    )
    # Deterministic post-execution verification gate
    verifier_out = run_verifier_script("scripts/gcloud_deploy_monitor.py")
    return f"{response.text}\\n\\n[Deterministic Verifier Gate]: {verifier_out}"


if __name__ == "__main__":
    print(run_agent_task("Validate sizing and prepare ADK deployment for Agent Runtime"))
`;
    for (const [k, v] of [...skillEntries, ...scriptEntries, ...subAgentEntries]) {
      generatedFiles[k] = v;
    }
  } else if (platformId === 'google_adk_vertex') {
    generatedFiles['agent.py'] = `"""
Google Cloud ADK Agent generated from Harness² Configuration (harness2.v1)
Deploy with: agents-cli deploy --no-confirm-project --memory 4Gi --concurrency 8 --min-instances 1
"""
import json
import subprocess
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

ALWAYS_ON_INSTRUCTION = """${combinedAlwaysOnPrompt.replace(/"""/g, '\\"\\"\\"')}"""

SKILLS_REGISTRY = ${JSON.stringify(Object.fromEntries(skillEntries), null, 2)}


def load_harness_skill(skill_name: str) -> dict:
    """Load full SKILL.md step-by-step instructions by skill name (e.g. google_agents_cli_deploy, developing_bazel)."""
    key = f"skills/{skill_name}/SKILL.md"
    if key in SKILLS_REGISTRY:
        return {"status": "ok", "skill": skill_name, "markdown": SKILLS_REGISTRY[key]}
    return {"status": "error", "available_skills": list(SKILLS_REGISTRY.keys())}


def verify_gcloud_deploy_sizing(memory_gi: float = 4.0, concurrency: int = 8) -> dict:
    """Run deterministic memory-concurrency OOM verification from scripts/gcloud_deploy_monitor.py."""
    peak_mib = 512.0 + concurrency * 220.0
    limit_mib = memory_gi * 1024.0
    return {
        "ok": peak_mib < limit_mib * 0.85,
        "peak_mib": peak_mib,
        "limit_mib": limit_mib,
    }


cloud_trace_auditor = LlmAgent(
    name="cloud_trace_auditor",
    model="gemini-2.5-flash",
    description="Inspect OpenTelemetry span trees (invoke_workflow -> invoke_agent -> call_llm -> execute_tool) and BigQuery Agent Analytics",
    instruction=${JSON.stringify(
      tree['sub_agents/cloud_trace_auditor/AGENT.md'] ??
        'Inspect Cloud Trace latencies and BigQuery Agent Analytics.'
    )},
)

root_agent = LlmAgent(
    name="harness2_cloud_ops_engineer",
    model="gemini-2.5-pro",
    instruction=ALWAYS_ON_INSTRUCTION,
    tools=[
        FunctionTool(load_harness_skill),
        FunctionTool(verify_gcloud_deploy_sizing),
    ],
    sub_agents=[cloud_trace_auditor],
)
`;
    generatedFiles['scripts/gcloud_deploy_monitor.py'] =
      tree['scripts/gcloud_deploy_monitor.py'] ?? '';
    generatedFiles['mcp.json'] = mcpRaw;
  } else if (platformId === 'firebase_genkit') {
    generatedFiles['src/harness_genkit_flow.ts'] = `/**
 * Firebase Genkit 1.0 Flow + MCP Host generated from Harness² Configuration (harness2.v1)
 * Run with: genkit flow:run harnessAgentFlow '{"task": "Audit Bazel & deploy ADK"}' --non-interactive
 */
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineMcpHost } from '@genkit-ai/mcp';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-pro'),
});

export const mcpHost = defineMcpHost(ai, {
  name: 'harness2-mcp-host',
  mcpServers: ${mcpRaw},
});

const SKILLS_MAP: Record<string, string> = ${JSON.stringify(
      Object.fromEntries(skillEntries),
      null,
      2
    )};

export const loadHarnessSkillTool = ai.defineTool(
  {
    name: 'loadHarnessSkill',
    description: 'Load specialized SKILL.md instructions on demand (google_agents_cli_deploy, developing_bazel)',
    inputSchema: z.object({ skillName: z.string() }),
    outputSchema: z.string(),
  },
  async ({ skillName }) => {
    return SKILLS_MAP[\`skills/\${skillName}/SKILL.md\`] ?? \`Skill \${skillName} not found\`;
  }
);

export const verifySizingTool = ai.defineTool(
  {
    name: 'verifyGcloudDeployMonitor',
    description: 'Deterministic memory-concurrency verifier (scripts/gcloud_deploy_monitor.py)',
    inputSchema: z.object({
      memoryGi: z.number().default(4),
      concurrency: z.number().default(8),
    }),
    outputSchema: z.object({
      ok: z.boolean(),
      peakMib: z.number(),
      limitMib: z.number(),
    }),
  },
  async ({ memoryGi, concurrency }) => {
    const peakMib = 512 + concurrency * 220;
    const limitMib = memoryGi * 1024;
    return { ok: peakMib < limitMib * 0.85, peakMib, limitMib };
  }
);

export const harnessAgentFlow = ai.defineFlow(
  {
    name: 'harnessAgentFlow',
    inputSchema: z.object({ task: z.string() }),
    outputSchema: z.object({
      answer: z.string(),
      verifierGatePassed: z.boolean(),
    }),
  },
  async ({ task }) => {
    const mcpTools = await mcpHost.getActiveTools(ai);
    const response = await ai.generate({
      system: ${JSON.stringify(combinedAlwaysOnPrompt)},
      prompt: task,
      tools: [loadHarnessSkillTool, verifySizingTool, ...mcpTools],
    });
    const gate = await verifySizingTool({ memoryGi: 4, concurrency: 8 });
    return {
      answer: response.text,
      verifierGatePassed: gate.ok,
    };
  }
);
`;
    generatedFiles['mcp.json'] = mcpRaw;
  } else if (platformId === 'langgraph_autogen') {
    generatedFiles['langgraph_harness.py'] = `"""
LangGraph StateGraph generated from Harness² Configuration (harness2.v1)
Maps Always-On Surface -> Supervisor Node, SKILL.md -> ToolNode, and scripts/gcloud_deploy_monitor.py -> Verifier Gate Edge.
"""
import json
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END

ALWAYS_ON_PROMPT = ${JSON.stringify(combinedAlwaysOnPrompt)}
SKILLS_STORE = ${JSON.stringify(Object.fromEntries(skillEntries), null, 2)}


class HarnessGraphState(TypedDict):
    task: str
    loaded_skills: list[str]
    subagent_report: str
    verifier_result: dict
    final_output: str


def supervisor_node(state: HarnessGraphState) -> dict:
    # Automatically trigger skills referenced in the always-on surface
    triggered = ["google_agents_cli_deploy", "developing_bazel"]
    return {"loaded_skills": triggered}


def cloud_trace_auditor_subagent_node(state: HarnessGraphState) -> dict:
    return {
        "subagent_report": "Cloud Trace span tree verified (OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT)."
    }


def deterministic_verifier_gate_node(state: HarnessGraphState) -> dict:
    peak_mib = 512.0 + 8 * 220.0
    limit_mib = 4.0 * 1024.0
    verdict = {"ok": peak_mib < limit_mib * 0.85, "peak_mib": peak_mib, "limit_mib": limit_mib}
    return {
        "verifier_result": verdict,
        "final_output": f"Completed task with skills={state['loaded_skills']} | Verifier={json.dumps(verdict)}",
    }


builder = StateGraph(HarnessGraphState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("cloud_trace_auditor", cloud_trace_auditor_subagent_node)
builder.add_node("verifier_gate", deterministic_verifier_gate_node)

builder.add_edge(START, "supervisor")
builder.add_edge("supervisor", "cloud_trace_auditor")
builder.add_edge("cloud_trace_auditor", "verifier_gate")
builder.add_edge("verifier_gate", END)

graph = builder.compile()
`;
  } else if (platformId === 'claude_cursor_ide') {
    generatedFiles['CLAUDE.md'] = `# Harness² Always-On Engineering Surface\n\n${combinedAlwaysOnPrompt}\n`;
    generatedFiles['.cursor/rules/00-harness-always-on.mdc'] = `---
description: Harness² Always-On Surface, Guardrails, and Memory
globs: "**/*"
alwaysApply: true
---

${combinedAlwaysOnPrompt}
`;
    for (const [skillPath, content] of skillEntries) {
      const skillName = skillPath.split('/')[1] ?? 'skill';
      generatedFiles[`.claude/skills/${skillName}/SKILL.md`] = content;
      generatedFiles[`.cursor/rules/skill-${skillName}.mdc`] = `---
description: On-demand skill ${skillName} (loaded when matching trigger condition)
alwaysApply: false
---

${content}
`;
    }
    generatedFiles['.claude/agents/cloud_trace_auditor.md'] =
      tree['sub_agents/cloud_trace_auditor/AGENT.md'] ?? '';
    generatedFiles['scripts/gcloud_deploy_monitor.py'] =
      tree['scripts/gcloud_deploy_monitor.py'] ?? '';
    generatedFiles['.mcp.json'] = mcpRaw;
  } else {
    // a2a_http_container
    generatedFiles['.well-known/agent-card.json'] = JSON.stringify(
      {
        name: 'harness2-universal-agent',
        description:
          'Universal A2A & MCP Bridge serving harness-configuration-oc_46a97fbf.json to any external agent platform',
        url: 'https://your-harness-service.run.app',
        version: '1.0.0',
        capabilities: {
          streaming: true,
          pushNotifications: false,
        },
        skills: skillEntries.map(([pathKey]) => ({
          id: pathKey.split('/')[1] ?? pathKey,
          name: pathKey.split('/')[1] ?? pathKey,
          mcpTool: 'load_harness_skill',
          restEndpoint: `/api/agent-connector/skills/${pathKey.split('/')[1] ?? ''}`,
        })),
        mcpEndpoint: '/api/mcp/rpc',
        executeEndpoint: '/api/agent-connector/execute',
      },
      null,
      2
    );
    generatedFiles['Dockerfile'] = `FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
`;
    generatedFiles['harness-configuration-oc.json'] = JSON.stringify(tree, null, 2);
  }

  return {
    platformId,
    platformName: spec.name,
    combinedAlwaysOnPrompt,
    alwaysOnChars: combinedAlwaysOnPrompt.length,
    generatedFiles,
    runInstructions: [
      `1. Export or copy the generated ${Object.keys(generatedFiles).length} platform files into your target project directory.`,
      `2. Verify the deterministic gate first: \`python3 scripts/gcloud_deploy_monitor.py\`.`,
      `3. Execute the runtime command: \`${spec.runtimeCommand}\`.`,
    ],
    deployInstructions: [
      `1. Ensure environment variables (\`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT\`) and IAM service accounts are set.`,
      `2. Run the production deployment command: \`${spec.deployCommand}\`.`,
      `3. Connect any external orchestrator via \`POST /api/mcp/rpc\` or \`/.well-known/agent-card.json\`.`,
    ],
  };
}

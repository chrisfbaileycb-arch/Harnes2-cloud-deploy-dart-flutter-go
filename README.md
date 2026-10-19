# Harness² — Agent Harness Architect, Universal Platform Transpiler & Multi-Runtime Engineering Workbench

**Harness²** has evolved from a foundational agent-harness reference paper into a full-stack **Agent Engineering, Cross-Platform Transpilation, and Managed Cloud Deployment Workbench**.

It provides interactive architecture design, deterministic surface validation, a **3-Way Agent Skill Connector** (REST API, MCP JSON-RPC 2.0, and Bring-Your-Own-Code), a **Universal Platform Transpiler** (for deploying harnesses *without* OpenCode or Codex), and step-by-step execution engines for **Firebase Genkit**, **Bazel 8/9 + Dart 3.10 / Flutter 3.38**, and **Google Cloud ADK (`agents-cli`) Managed Deployments**.

---

## Core Modules & Capabilities

### 1. Agent Harness Architect & 6-Step Curriculum
An interactive system that converts raw operational runbooks, shell commands, or video/transcript workflows into validated **Four-Bucket Agent Harnesses** (`Always-On`, `Skills`, `Scripts`, and `Sub-Agents`):
- **6-Stage Setup & Training Guide**: Covers Substrate & Budget Sizing, Always-On Guardrail Split, On-Demand `SKILL.md` Packaging, Executable Zero-Context Verifiers, Isolated Sub-Agent Context Firewalls, and Recursive `Propose -> Probe -> Compose` Training Loops.
- **Interactive Transcript-to-Harness Compiler**: Paste any sequence of workflow steps, CI/CD logs, or engineering runbooks to automatically classify steps into `Always-On` files, on-demand `skills/<id>/SKILL.md` routers, executable `scripts/*.py` verifiers, and `sub_agents/*.yaml` workers.
- **Dart/Flutter & GCP Cloud Run Operational Curriculum**: Includes dedicated training tracks for Dart 3.10 / Flutter 3.38 development and Google Cloud managed agent operations.

### 2. Universal Cross-Platform Deployment (No OpenCode / Codex Required)
Deploy and execute any `harness2.v1` configuration in **any agent runtime**—even when you do not use OpenCode (`oc`) or Codex (`cx`):
- **Step-by-Step Operational & Portable Execution Playbook**: Detailed instructions for how to execute and deploy all 6 harness steps effectively across any runtime.
- **Live Universal Platform Transpiler**: Converts the active `editorTree` into downloadable, ready-to-run code bundles for 6 target platforms:
  1. **Standalone Python / TypeScript SDK Loop** (`@google/genai`, OpenAI, or Anthropic SDKs with native function-calling tools `load_skill`, `run_verifier_script`, and `delegate_sub_agent`).
  2. **Google Cloud ADK (`LlmAgent`) & Vertex AI Agent Engine / Cloud Run** (`agent.py` + `agents.yaml`).
  3. **Firebase Genkit (`ai.defineFlow` + `ai.defineTool`)** (`genkit_harness_agent.ts` with typed Zod tool schemas).
  4. **LangGraph / CrewAI / AutoGen StateGraph** (`langgraph_harness.py` with stateful verification gates).
  5. **Claude Code / Cursor / Windsurf IDE Native Rules** (`CLAUDE.md`, `.cursor/rules/*.mdc`, and `.claude/commands/*.md`).
  6. **Universal HTTP / A2A + MCP Container** (`Dockerfile` + `a2a_agent_card.json` for Kubernetes, Cloud Run, AWS ECS, or Fly.io).

### 3. Harness Configuration Registry & `harness2.v1` Importer
- **Pre-Loaded `harness-configuration-oc_46a97fbf.json`**: Ships with the canonical OpenCode (`oc`) 9-file harness configuration (`1,410 / 24,000` always-on characters) mounted at `/assets/aistudio/harness-configuration-oc_46a97fbf.json`.
- **Upload, Paste, Validate & Export**: Upload `.json` configuration files, paste raw `harness2.v1` JSON for live schema and surface-budget census validation, switch between saved configuration profiles, or click **Download Harness Configuration** to export the current editor tree state.

### 4. 3-Way Agent Skill Connector (BYOC · MCP · REST API)
Connect external agents or front-end workflows directly to all registered skills (`skill-genkit`, `bazel_polyglot_build`, `bazel_dart_flutter_sdk`, `google_agents_cli_deploy`, and active custom harness skills):
- **Frontend Bring-Your-Own-Code (BYOC) Sandbox**: Write or customize TypeScript/JavaScript (`async function runAgent(input, ctx)`), Dart, or Python handler templates with live access to `ctx.skills`, `ctx.runVerifier()`, `ctx.validateHarness()`, and `ctx.checkCloudSizing()`.
- **Model Context Protocol (MCP) JSON-RPC 2.0 Server (`/api/mcp/rpc`)**: Interactive MCP inspector and live JSON-RPC 2.0 endpoint supporting `initialize`, `tools/list`, `tools/call`, `resources/list`, and `resources/read` (`harness://skills/<id>`).
- **REST API Skill Bridge (`/api/agent-connector/*`)**: Query `GET /api/agent-connector/skills`, inspect individual skill bundles via `GET /api/agent-connector/skills/:skillId`, and execute skills or verifiers via `POST /api/agent-connector/execute`.

### 5. Google Cloud Deployment Agent (`chrisfbaileycb-arch/agents-cli`)
Complete instruction manual, deployment control plane, and runtime health analyzer for Google Cloud ADK (`agents-cli`):
- **8-Skill Suite**: Covers ADK Scaffolding (`agents-cli init`), Declarative `agents.yaml` Manifests, Managed Vertex AI Agent Engine Deployment, Cloud Run Containerization + IAP, Cloud Trace / OpenTelemetry + Cloud Logging Alerting, Cloud Run Sizing & Concurrency Calculator, `agents-cli eval` CI/CD Evaluation Gates, and Safe Traffic Rollbacks.
- **Interactive Sizing & Health Calculator**: Real-time diagnostics for CPU/Memory OOM prevention, cold-start latency, concurrency tuning, and minimum instance sizing.

### 6. Bazel 8/9 Coding Skill + Dart 3.10 & Flutter 3.38 SDK Deployments
Step-by-step workspace analyzer and execution manual based on `chrisfbaileycb-arch/bazel`:
- **Polyglot `MODULE.bazel` & Hermetic Build Diagnostics**: Detects legacy `WORKSPACE` anti-patterns, `glob(["**"])` skyframe invalidations, non-hermetic network/PATH leaks, and missing remote cache flags.
- **Dart 3.10 & Flutter 3.38 Hermetic Rules**: Covers `dart_binary` AOT native compilation, `dart_test` shard orchestration, `flutter_application` Web/Wasm CanvasKit bundles, Android `.aab`, iOS `.ipa`, and `dart_mcp_server` binary releases.

### 7. Firebase Genkit Multi-Language Skill Manual (`chrisfbaileycb-arch/skill-genkit`)
Complete step-by-step implementation guide across **JavaScript/TypeScript**, **Go**, **Python**, and **Dart**:
- Strongly typed `ai.defineFlow` and `ai.defineTool` implementations, Zod/JSON-Schema validation, multi-agent `definePrompt` handoffs, Genkit Developer UI (`genkit start -- <cmd>`), and production deployment to Cloud Run and Firebase App Hosting.

### 8. Interactive Surface Validator & Recursive Training Simulator
- **OpenCode (`oc`) & Codex (`cx`) Surface Validator**: Real-time character budget enforcement (`24,000` chars on `oc`; `32,768` bytes on `cx`), YAML frontmatter validation (`name` + `description` only), and zero-context script decoupling checks.
- **Recursive Training Loop Simulator**: Interactive visualizations of `Propose -> Probe -> Compose` across Parallel (`par`) and Sequential (`seq`) recursion modes (`k=0..3`), plus the complete paper reader with audio narration and architecture plates.

---

## API & Protocol Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check and active harness engine status |
| `/api/validate` | `POST` | Validates a file tree against `oc` or `cx` surface constraints |
| `/api/harness-configurations` | `GET` | Lists registered `harness2.v1` configurations (including `harness-configuration-oc_46a97fbf.json`) |
| `/api/harness-configurations/import` | `POST` | Validates and registers a `harness2.v1` JSON payload |
| `/api/agent-connector/skills` | `GET` | Returns the catalog of all registered agent skills (filterable by `domain` or `query`) |
| `/api/agent-connector/skills/:skillId` | `GET` | Returns the full `SKILL.md`, verifier script, and metadata for a skill |
| `/api/agent-connector/execute` | `POST` | Executes a skill lookup, verifier dry-run, or BYOC context inspection |
| `/api/mcp/rpc` | `POST` | Model Context Protocol (MCP) JSON-RPC 2.0 endpoint (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`) |
| `/assets/aistudio/harness-configuration-oc_46a97fbf.json` | `GET` | Static asset serving the default OpenCode `harness2.v1` configuration |

---

## Local Development & Build

### Prerequisites
- Node.js 20+ and npm

### Run the Full-Stack Workbench
```bash
# Install dependencies
npm install

# Start the Express + Vite full-stack server on http://localhost:3000
npm run dev
```

### Typecheck & Build for Production
```bash
# Run TypeScript compiler verification
npm run lint

# Build the production client bundle
npm run build

# Start the production server
npm start
```

---

## Repository Structure

```text
├── public/
│   └── assets/aistudio/
│       └── harness-configuration-oc_46a97fbf.json  # Default harness2.v1 configuration
├── src/
│   ├── core/
│   │   ├── harnessEngine.ts                # Surface Validator (oc / cx) & recursive simulator
│   │   ├── harnessArchitectManual.ts       # 6-stage Harness Architect & transcript compiler
│   │   ├── harnessConfigurationManager.ts  # harness2.v1 schema parser, validator & profiles
│   │   ├── universalPlatformAdapter.ts     # 6-step playbook & cross-platform transpiler
│   │   ├── agentSkillConnector.ts          # REST API, MCP JSON-RPC 2.0 & BYOC sandbox engine
│   │   ├── gcpAgentsCliManual.ts           # Google Cloud ADK (agents-cli) manual & sizing engine
│   │   ├── bazelSkillManual.ts             # Bazel 8/9 + Dart/Flutter SDK skill & analyzer
│   │   ├── genkitManual.ts                 # Multi-language Firebase Genkit manual (TS/Go/Py/Dart)
│   │   └── paperData.ts                    # Harness² paper sections, benchmark metrics & glossary
│   ├── App.tsx                             # Unified multi-module workbench UI
│   └── main.tsx                            # React entry point
├── server.ts                               # Express API server (Validator, Configs, REST & MCP)
└── package.json
```

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  FolderTree,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  BENCHMARK_RESULTS,
  BenchmarkResultRow,
  checkMcpServers,
  CODEX_SURFACE,
  DEFAULT_DEMO_TASKS,
  DEFAULT_MCP_CONFIG,
  DemoRunSweepResult,
  LedgerTaskSpec,
  OPENCODE_SURFACE,
  runDeterministicDemo,
  Tree,
  validateTree,
  ValidationCensus,
} from './core/harnessEngine';
import {
  buildSkillGenkitHarnessTree,
  GENKIT_LANGUAGES,
  GenkitLang,
  SKILL_GENKIT_STEPS,
  V1_MIGRATION_RULES,
} from './core/skillGenkitManual';
import {
  analyzeCustomManifest,
  APP_ANALYSIS_PRESETS,
  BAZEL_AUDIT_SCRIPT_CONTENT,
  BAZEL_IMPLEMENTATION_STEPS,
  BAZEL_SKILL_MD_CONTENT,
  BAZEL_STACK_PROFILES,
  BazelTargetStack,
  buildBazelSkillHarnessTree,
} from './core/bazelSkillManual';
import {
  AGENTS_CLI_SKILLS_SUITE,
  buildGcpAgentsCliHarnessTree,
  calculateSizingHealth,
  GCP_DEPLOYMENT_STEPS,
  GcpDeployTarget,
  INITIAL_MANAGED_DEPLOYMENTS,
  ManagedAgentDeployment,
} from './core/gcpAgentsCliManual';
import {
  ARCHITECT_INPUT_PRESETS,
  HarnessArchitectSynthesisResult,
  synthesizeHarnessFromInput,
  WORKFLOW_EXECUTION_MASTER_GUIDE,
} from './core/harnessArchitectAgent';

type ActiveTab =
  | 'architect'
  | 'gcp'
  | 'bazel'
  | 'manual'
  | 'recursion'
  | 'mcp'
  | 'surface'
  | 'benchmarks';

const DART_MCP_JSON = JSON.stringify(DEFAULT_MCP_CONFIG, null, 2);

const PRESET_TREES: Record<string, { label: string; substrate: 'oc' | 'cx'; tree: Tree }> = {
  oc_architect_synthesized: {
    label: 'OpenCode — Video/SOP Synthesized Harness + Training & Support',
    substrate: 'oc',
    tree: synthesizeHarnessFromInput({
      title: ARCHITECT_INPUT_PRESETS[0].label,
      rawInstructions: ARCHITECT_INPUT_PRESETS[0].rawInstructions,
      videoTranscript: ARCHITECT_INPUT_PRESETS[0].videoTranscriptSummary,
      preferredSubstrate: 'oc',
    }).generatedTree,
  },
  oc_gcp_agents_cli: {
    label: 'OpenCode — google_agents_cli_deploy + Cloud Trace Auditor + Dart MCP',
    substrate: 'oc',
    tree: buildGcpAgentsCliHarnessTree(),
  },
  oc_bazel_dart_flutter: {
    label: 'OpenCode — developing_bazel + Dart/Flutter SDK + Genkit MCP',
    substrate: 'oc',
    tree: buildBazelSkillHarnessTree(),
  },
  oc_genkit_dart: {
    label: 'OpenCode — developing-genkit-dart + Dart MCP',
    substrate: 'oc',
    tree: buildSkillGenkitHarnessTree('dart'),
  },
  oc_genkit_js: {
    label: 'OpenCode — developing-genkit-js + Dart MCP',
    substrate: 'oc',
    tree: buildSkillGenkitHarnessTree('js'),
  },
  oc_adapted: {
    label: 'OpenCode — Adapted Ledger + Dart MCP',
    substrate: 'oc',
    tree: {
      'systemprompt.md':
        'Reconcile the ledger using python scripts/summarize.py.\nWhen reconciling signed credit/debit ledgers, load the `ledger_audit` skill.\n',
      'guardrails.md':
        '- Never filter out negative credit entries when computing net balance.\n- Verify output formatting matches `Total: <value>` to two decimal places.\n',
      'LongTermMEMORY.md':
        'Accounting ledgers in this domain store debits as positive decimals and credits as negative decimals.\n',
      'tool_descriptions/tool_guidance.md':
        'Run deterministic arithmetic via `python scripts/summarize.py <path>` instead of mental math.\n',
      'skills/ledger_audit/SKILL.md':
        '---\nname: ledger_audit\ndescription: Reconcile signed transaction ledgers with both credits and debits\n---\n\n1. Run `python scripts/summarize.py ledger.csv`.\n2. Confirm both positive and negative rows are included in the sum.\n',
      'sub_agents/csv_inspector/AGENT.md':
        '---\nmode: subagent\ndescription: Inspect large CSV files and return column headers and row counts\n---\n\nInspect the requested CSV file and return a concise summary of its schema.\n',
      'scripts/summarize.py':
        "import csv\nimport sys\nfrom decimal import Decimal\n\nwith open(sys.argv[1]) as source:\n    amounts = [Decimal(row['amount']) for row in csv.DictReader(source)]\ntotal = sum((amount for amount in amounts), Decimal(0))\nprint(f'Total: {total:.2f}')\n",
      'plugin/verify_output.ts':
        'export const VerifyOutputPlugin = async () => ({\n  "tool.execute.after": async (event: unknown) => event\n});\n',
      'mcp.json': DART_MCP_JSON,
    },
  },
  oc_untriggered_fault: {
    label: 'OpenCode — Untriggered Skill Fault Demo',
    substrate: 'oc',
    tree: {
      'systemprompt.md': 'Reconcile the ledger using python scripts/missing_helper.py.\n',
      'guardrails.md': '',
      'LongTermMEMORY.md': '',
      'tool_descriptions/tool_guidance.md': '',
      'skills/orphan_skill/SKILL.md':
        '---\nname: orphan_skill\ndescription: A skill that is never mentioned in always-on text\n---\n\nFollow this workflow.\n',
    },
  },
  cx_adapted: {
    label: 'Codex — Adapted Harness + Lifecycle Hook',
    substrate: 'cx',
    tree: {
      'AGENTS.md':
        'Follow the task instructions in the task folder and write the final deliverables to the specified output directory.\n- When reconciling multi-sheet financial statements, read .agents/skills/reconcile_sheets/SKILL.md and follow it.\n',
      '.agents/skills/reconcile_sheets/SKILL.md':
        '---\nname: reconcile_sheets\ndescription: Cross-check totals across financial sheets before writing deliverables\n---\n\nRun `python scripts/check_totals.py` before finalizing the report.\n',
      'scripts/check_totals.py': 'import sys\nprint("Totals verified successfully.")\n',
      '.codex/hooks.json': JSON.stringify(
        {
          hooks: {
            PostToolUse: [
              {
                matcher: 'Bash',
                hooks: [
                  {
                    type: 'command',
                    command: 'python3 scripts/check_totals.py',
                  },
                ],
              },
            ],
          },
        },
        null,
        2
      ),
      'mcp.json': DART_MCP_JSON,
    },
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('architect');

  // Agent Harness Architect & Curriculum Builder State
  const [archPresetId, setArchPresetId] = useState<string>(ARCHITECT_INPUT_PRESETS[0].id);
  const [archTitle, setArchTitle] = useState<string>(ARCHITECT_INPUT_PRESETS[0].label);
  const [archInstructions, setArchInstructions] = useState<string>(
    ARCHITECT_INPUT_PRESETS[0].rawInstructions
  );
  const [archVideoNotes, setArchVideoNotes] = useState<string>(
    ARCHITECT_INPUT_PRESETS[0].videoTranscriptSummary
  );
  const [archSubstrate, setArchSubstrate] = useState<'oc' | 'cx'>('oc');
  const [archSection, setArchSection] = useState<
    'ingest' | 'curriculum' | 'harness-files' | 'training-support'
  >('ingest');
  const [archResult, setArchResult] = useState<HarnessArchitectSynthesisResult>(() =>
    synthesizeHarnessFromInput({
      title: ARCHITECT_INPUT_PRESETS[0].label,
      rawInstructions: ARCHITECT_INPUT_PRESETS[0].rawInstructions,
      videoTranscript: ARCHITECT_INPUT_PRESETS[0].videoTranscriptSummary,
      preferredSubstrate: 'oc',
    })
  );
  const [archSelectedTreeFile, setArchSelectedTreeFile] = useState<string>('systemprompt.md');
  const [isSynthesizingHarness, setIsSynthesizingHarness] = useState<boolean>(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('/assets/harness2-video.mp4');
  const [uploadedVideoBase64, setUploadedVideoBase64] = useState<string>('');
  const [uploadedVideoMime, setUploadedVideoMime] = useState<string>('video/mp4');

  // Google Cloud Deployment Agent (agents-cli) State
  const [gcpSection, setGcSection] = useState<'monitor' | 'steps' | 'skills'>('monitor');
  const [gcpTarget, setGcpTarget] = useState<GcpDeployTarget>('agent_runtime');
  const [gcpDeployments, setGcpDeployments] = useState<ManagedAgentDeployment[]>(
    INITIAL_MANAGED_DEPLOYMENTS
  );
  const [selectedGcpDepId, setSelectedGcpDepId] = useState<string>(
    INITIAL_MANAGED_DEPLOYMENTS[0].id
  );
  const [deployFormName, setDeployFormName] = useState<string>('cloud-ops-guardian-prod');
  const [deployFormProject, setDeployFormProject] = useState<string>('prod-cloud-ops');
  const [deployFormRegion, setDeployFormRegion] = useState<string>('us-east1');
  const [deployFormCpu, setDeployFormCpu] = useState<number>(2);
  const [deployFormMemoryGi, setDeployFormMemoryGi] = useState<number>(4);
  const [deployFormConcurrency, setDeployFormConcurrency] = useState<number>(8);
  const [deployFormMinInstances, setDeployFormMinInstances] = useState<number>(1);
  const [deployFormMaxInstances, setDeployFormMaxInstances] = useState<number>(10);
  const [deployFormAgentIdentity, setDeployFormAgentIdentity] = useState<boolean>(true);
  const [deployFormAgentGateway, setDeployFormAgentGateway] = useState<boolean>(true);
  const [deployFormCmek, setDeployFormCmek] = useState<boolean>(true);
  const [deployActionStatus, setDeployActionStatus] = useState<string>('');

  // Bazel Skill, Dart/Flutter SDK Manual & Analyzer State
  const [bazelStack, setBazelStack] = useState<BazelTargetStack>('dart-genkit');
  const [bazelSection, setBazelSection] = useState<'steps' | 'analyzer' | 'skill-spec'>('steps');
  const [selectedAnalysisPresetId, setSelectedAnalysisPresetId] = useState<string>(
    'flutter-dart-monorepo'
  );
  const [customManifestInput, setCustomManifestInput] = useState<string>(
    APP_ANALYSIS_PRESETS[0].sampleManifest
  );
  const [useCustomAnalyzerInput, setUseCustomAnalyzerInput] = useState<boolean>(false);

  // Skill-Genkit Manual State
  const [selectedLang, setSelectedLang] = useState<GenkitLang>('dart');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string>('');
  const [simulatedTraceLang, setSimulatedTraceLang] = useState<GenkitLang | null>('dart');

  // Recursion Engine State
  const [kBudget, setKBudget] = useState<number>(2);
  const [modeFilter, setModeFilter] = useState<'both' | 'parallel' | 'sequential'>('both');
  const [tasks, setTasks] = useState<LedgerTaskSpec[]>(DEFAULT_DEMO_TASKS);
  const [sweepResult, setSweepResult] = useState<DemoRunSweepResult>(() =>
    runDeterministicDemo(2, 'both', DEFAULT_DEMO_TASKS)
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string>('ledger-1');
  const [selectedModeView, setSelectedModeView] = useState<'agg' | 'seq'>('agg');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // New Task Form
  const [newTaskId, setNewTaskId] = useState<string>('ledger-3');
  const [newTaskAmounts, setNewTaskAmounts] = useState<string>('240.00, -85.50, 19.75, -14.25');

  // Surface Editor State
  const [substrate, setSubstrate] = useState<'oc' | 'cx'>('oc');
  const [editorTree, setEditorTree] = useState<Tree>(PRESET_TREES.oc_architect_synthesized.tree);
  const [selectedFile, setSelectedFile] = useState<string>('systemprompt.md');
  const [newFilePath, setNewFilePath] = useState<string>('');
  const [census, setCensus] = useState<ValidationCensus>(() =>
    validateTree(OPENCODE_SURFACE, PRESET_TREES.oc_architect_synthesized.tree)
  );

  // MCP Server Configurator State
  const [mcpJsonText, setMcpJsonText] = useState<string>(DART_MCP_JSON);
  const [mcpErrors, setMcpErrors] = useState<string[]>([]);
  const [mcpServerNames, setMcpServerNames] = useState<string[]>(['dart']);
  const [mcpSaveStatus, setMcpSaveStatus] = useState<string>('');
  const [newMcpName, setNewMcpName] = useState<string>('');
  const [newMcpCommand, setNewMcpCommand] = useState<string>('');
  const [newMcpArgs, setNewMcpArgs] = useState<string>('');

  // Benchmark CLI configurator state
  const [cliBench, setCliBench] = useState<'lab' | 'jb' | 'wb'>('lab');
  const [cliSubset, setCliSubset] = useState<'office' | 'web' | 'code'>('office');
  const [cliSubstrate, setCliSubstrate] = useState<'oc' | 'cx'>('oc');
  const [cliMode, setCliMode] = useState<'parallel' | 'sequential'>('parallel');
  const [cliK, setCliK] = useState<number>(1);

  useEffect(() => {
    fetch('/api/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.latestRun) setSweepResult(data.latestRun);
        if (data?.tasks) setTasks(data.tasks);
        if (data?.gcpDeployments) setGcpDeployments(data.gcpDeployments);
        if (data?.mcpConfig) {
          const formatted = JSON.stringify(data.mcpConfig, null, 2);
          setMcpJsonText(formatted);
        }
      })
      .catch(() => {
        // Fallback to local deterministic state
      });
  }, []);

  useEffect(() => {
    const surf = substrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE;
    setCensus(validateTree(surf, editorTree));
  }, [substrate, editorTree]);

  useEffect(() => {
    const errs: string[] = [];
    const names = checkMcpServers('mcp.json', mcpJsonText, errs);
    setMcpErrors(errs);
    setMcpServerNames(names);
  }, [mcpJsonText]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleMountSkillIntoValidator = (lang: GenkitLang) => {
    const builtTree = buildSkillGenkitHarnessTree(lang);
    setSubstrate('oc');
    setEditorTree(builtTree);
    setSelectedFile(`skills/developing_genkit_${lang}/SKILL.md`);
    setActiveTab('surface');
  };

  const handleMountBazelSkillIntoValidator = () => {
    const builtTree = buildBazelSkillHarnessTree();
    setSubstrate('oc');
    setEditorTree(builtTree);
    setSelectedFile('skills/developing_bazel/SKILL.md');
    setActiveTab('surface');
  };

  const handleMountGcpSkillIntoValidator = () => {
    const builtTree = buildGcpAgentsCliHarnessTree();
    setSubstrate('oc');
    setEditorTree(builtTree);
    setSelectedFile('skills/google_agents_cli_deploy/SKILL.md');
    setActiveTab('surface');
  };

  const handleDeployOrUpdateGcpAgent = async (e?: React.FormEvent, overridePayload?: Partial<ManagedAgentDeployment> & { agentGateway?: boolean }) => {
    if (e) e.preventDefault();
    const payload = {
      name: overridePayload?.name ?? deployFormName,
      target: overridePayload?.target ?? gcpTarget,
      region: overridePayload?.region ?? deployFormRegion,
      project: overridePayload?.project ?? deployFormProject,
      cpu: overridePayload?.cpu ?? deployFormCpu,
      memoryGi: overridePayload?.memoryGi ?? deployFormMemoryGi,
      concurrency: overridePayload?.concurrency ?? deployFormConcurrency,
      minInstances: overridePayload?.minInstances ?? deployFormMinInstances,
      maxInstances: overridePayload?.maxInstances ?? deployFormMaxInstances,
      agentIdentity: overridePayload?.agentIdentity ?? deployFormAgentIdentity,
      agentGateway: overridePayload?.agentGateway ?? deployFormAgentGateway,
      cmekEnabled: overridePayload?.cmekEnabled ?? deployFormCmek,
    };

    try {
      const res = await fetch('/api/gcp-deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setGcpDeployments(data.deployments);
        setSelectedGcpDepId(data.deployment.id);
        setDeployActionStatus(`Deployed & verified ${data.deployment.name} (${data.deployment.target})`);
        setTimeout(() => setDeployActionStatus(''), 3500);
        return;
      }
    } catch {
      // Fallback local update
    }
    const peakMiB = 512 + payload.concurrency * 220;
    const isDegraded = peakMiB > payload.memoryGi * 1024 * 0.88;
    const updated: ManagedAgentDeployment = {
      id: `dep-${Date.now()}`,
      name: payload.name,
      target: payload.target,
      region: payload.region,
      project: payload.project,
      status: isDegraded ? 'DEGRADED' : 'HEALTHY',
      framework: 'google-adk',
      registrationType: payload.target === 'agent_runtime' ? 'adk' : 'a2a',
      resourceUri:
        payload.target === 'agent_runtime'
          ? `projects/189717904217/locations/${payload.region}/reasoningEngines/904182`
          : `https://${payload.name}-189717904217.${payload.region}.run.app`,
      endpointOrEngineId:
        payload.target === 'agent_runtime'
          ? 'reasoningEngines (:streamQuery)'
          : '/a2a/app/.well-known/agent-card.json',
      cpu: payload.cpu,
      memoryGi: payload.memoryGi,
      concurrency: payload.concurrency,
      minInstances: payload.minInstances,
      maxInstances: payload.maxInstances,
      agentIdentity: payload.agentIdentity,
      agentGatewayEgress:
        payload.target === 'agent_runtime' && payload.agentGateway
          ? `projects/${payload.project}/locations/${payload.region}/agentGateways/corp-egress-gw`
          : null,
      cmekEnabled: payload.cmekEnabled,
      otelCaptureMode: 'NO_CONTENT',
      bqAnalyticsDataset: `${payload.project}.agent_analytics`,
      p95LatencyMs: isDegraded ? 1420 : 580,
      errorRatePct: isDegraded ? 2.1 : 0.08,
      evalPassRatePct: 96.8,
      lastDeployedAt: new Date().toISOString(),
      recentSpans: [
        {
          traceId: '5a89c10293e4f00192837465a1b2c3d4',
          workflowSpan: 'invoke_workflow (streaming_agent_run_with_events)',
          agentSpan: `invoke_agent: ${payload.name.replace(/-/g, '_')}`,
          llmModel: 'gemini-2.5-flash',
          toolCalled: 'execute_tool: check_deployment_sizing',
          durationMs: 560,
          tokensUsed: 790,
          status: isDegraded ? 'ERROR' : 'OK',
        },
      ],
    };
    setGcpDeployments((prev) => [updated, ...prev.filter((d) => d.name !== updated.name)]);
    setSelectedGcpDepId(updated.id);
    setDeployActionStatus(`Updated ${updated.name} (${updated.target})`);
    setTimeout(() => setDeployActionStatus(''), 3500);
  };

  const handleSyncMcpToHarness = async (jsonStr: string) => {
    setMcpJsonText(jsonStr);
    setEditorTree((prev) => ({
      ...prev,
      'mcp.json': jsonStr,
    }));
    const errs: string[] = [];
    checkMcpServers('mcp.json', jsonStr, errs);
    if (errs.length === 0) {
      try {
        await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
        });
        setMcpSaveStatus('Saved & synced to active harness tree (`mcp.json`)');
        setTimeout(() => setMcpSaveStatus(''), 3000);
      } catch {
        setMcpSaveStatus('Synced to local harness tree (`mcp.json`)');
        setTimeout(() => setMcpSaveStatus(''), 3000);
      }
    }
  };

  const handleAddMcpServer = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newMcpName.trim();
    const cmd = newMcpCommand.trim();
    if (!key || !cmd) return;
    const argsList = newMcpArgs
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const parsed = JSON.parse(mcpJsonText);
      const next = {
        ...parsed,
        mcpServers: {
          ...(parsed.mcpServers ?? {}),
          [key]: {
            command: cmd,
            args: argsList,
          },
        },
      };
      const formatted = JSON.stringify(next, null, 2);
      handleSyncMcpToHarness(formatted);
      setNewMcpName('');
      setNewMcpCommand('');
      setNewMcpArgs('');
    } catch {
      // ignore if current JSON is invalid
    }
  };

  const handleRunSweep = async (nextK = kBudget, nextMode = modeFilter) => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: nextK, mode: nextMode }),
      });
      if (res.ok) {
        const data: DemoRunSweepResult = await res.json();
        setSweepResult(data);
        if (!data.requestedModes.includes(selectedModeView)) {
          setSelectedModeView(data.requestedModes[0]);
        }
      } else {
        const local = runDeterministicDemo(nextK, nextMode, tasks);
        setSweepResult(local);
      }
    } catch {
      const local = runDeterministicDemo(nextK, nextMode, tasks);
      setSweepResult(local);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmounts = newTaskAmounts
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (!newTaskId.trim() || parsedAmounts.length === 0) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTaskId.trim(),
          domain: 'accounting',
          amounts: parsedAmounts,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setSweepResult(data.latestRun);
        setSelectedTaskId(newTaskId.trim());
        setNewTaskId(`ledger-${data.tasks.length + 1}`);
        return;
      }
    } catch {
      // fallback local
    }
    const nextTasks = [
      ...tasks.filter((t) => t.id !== newTaskId.trim()),
      {
        id: newTaskId.trim(),
        domain: 'accounting',
        prompt: 'Sum every signed amount in ledger.csv. Return Total: with two decimal places.',
        amounts: parsedAmounts,
      },
    ];
    setTasks(nextTasks);
    setSweepResult(runDeterministicDemo(kBudget, modeFilter, nextTasks));
    setSelectedTaskId(newTaskId.trim());
  };

  const handleResetTasks = async () => {
    try {
      const res = await fetch('/api/tasks/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setSweepResult(data.latestRun);
        setSelectedTaskId('ledger-1');
        return;
      }
    } catch {
      // fallback
    }
    setTasks(DEFAULT_DEMO_TASKS);
    setSweepResult(runDeterministicDemo(2, 'both', DEFAULT_DEMO_TASKS));
    setSelectedTaskId('ledger-1');
  };

  const handleLoadPreset = (key: string) => {
    const preset = PRESET_TREES[key];
    if (!preset) return;
    setSubstrate(preset.substrate);
    setEditorTree({ ...preset.tree });
    const firstFile = Object.keys(preset.tree)[0] ?? '';
    setSelectedFile(firstFile);
  };

  const handleAutoRepairTriggers = () => {
    const surf = substrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE;
    const copy: Tree = { ...editorTree };
    const result = validateTree(surf, copy, { autoRepairTriggers: true });
    if (result.repairedSkills.length > 0) {
      for (const skill of result.repairedSkills) {
        const fm = (copy[`${surf.skillDir}/${skill}/SKILL.md`] ?? '').slice(0, 600);
        const m = /^description:\s*(.+)$/m.exec(fm);
        const desc = m ? m[1].trim().replace(/\.$/, '') : `the ${skill} workflow applies`;
        const line = surf.triggerLine.replace('{name}', skill).replace('{desc}', desc);
        const cur = copy[surf.autotriggerFile] ?? '';
        copy[surf.autotriggerFile] = cur.trim() ? `${cur.replace(/\s+$/, '')}\n${line}` : line;
      }
      setEditorTree(copy);
    }
  };

  const handleAddComponentFile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFilePath.trim();
    if (!clean) return;
    setEditorTree((prev) => ({
      ...prev,
      [clean]: prev[clean] ?? '---\ndescription: New component\n---\n',
    }));
    setSelectedFile(clean);
    setNewFilePath('');
  };

  const currentTaskResult =
    sweepResult.tasks.find((t) => t.taskId === selectedTaskId) ?? sweepResult.tasks[0];
  const currentModeRecord =
    currentTaskResult?.modes[selectedModeView] ??
    Object.values(currentTaskResult?.modes ?? {})[0];

  let parsedMcpServers: Record<string, { command: string; args?: string[] }> = {};
  try {
    const parsed = JSON.parse(mcpJsonText);
    if (parsed && typeof parsed.mcpServers === 'object') {
      parsedMcpServers = parsed.mcpServers;
    }
  } catch {
    // ignore parse errors while typing
  }

  const currentLangSpec = GENKIT_LANGUAGES[selectedLang];
  const visibleSteps = showAllSteps
    ? SKILL_GENKIT_STEPS
    : [SKILL_GENKIT_STEPS[activeStepIndex]];

  const currentBazelStackProfile =
    BAZEL_STACK_PROFILES.find((p) => p.id === bazelStack) ?? BAZEL_STACK_PROFILES[0];
  const currentAnalysisPreset =
    APP_ANALYSIS_PRESETS.find((p) => p.id === selectedAnalysisPresetId) ?? APP_ANALYSIS_PRESETS[0];
  const customAnalysisResult = analyzeCustomManifest(customManifestInput);

  const selectedGcpDeployment =
    gcpDeployments.find((d) => d.id === selectedGcpDepId) ?? gcpDeployments[0];
  const liveFormSizing = calculateSizingHealth(deployFormMemoryGi, deployFormConcurrency);

  const generatedDeployCmd = [
    'agents-cli deploy',
    `  --project "${deployFormProject}"`,
    `  --region "${deployFormRegion}"`,
    `  --service-name "${deployFormName}"`,
    `  --service-account "app-sa@${deployFormProject}.iam.gserviceaccount.com"`,
    ...(gcpTarget === 'agent_runtime' && deployFormAgentIdentity ? ['  --agent-identity'] : []),
    ...(gcpTarget === 'agent_runtime' && deployFormAgentGateway
      ? [
          `  --agent-gateway-egress "projects/${deployFormProject}/locations/${deployFormRegion}/agentGateways/corp-egress-gw"`,
        ]
      : []),
    ...(gcpTarget === 'agent_runtime' && deployFormCmek
      ? [
          `  --key "projects/${deployFormProject}/locations/${deployFormRegion}/keyRings/agent-kr/cryptoKeys/agent-cmek"`,
        ]
      : []),
    '  --env-vars "GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT"',
    `  --cpu ${deployFormCpu} --memory ${deployFormMemoryGi}Gi --concurrency ${deployFormConcurrency}`,
    `  --min-instances ${deployFormMinInstances} --max-instances ${deployFormMaxInstances}`,
    '  --no-confirm-project',
  ].join(' \\\n');

  const generatedPublishCmd =
    gcpTarget === 'agent_runtime'
      ? [
          'agents-cli publish gemini',
          '  --registration-type adk',
          `  --agent-runtime-id "projects/189717904217/locations/${deployFormRegion}/reasoningEngines/904182"`,
          '  --gemini-app-id "projects/189717904217/locations/global/collections/default_collection/engines/enterprise-assistant"',
          `  --display-name "${deployFormName}"`,
        ].join(' \\\n')
      : [
          'agents-cli publish gemini',
          `  --agent-card-url "https://${deployFormName}-189717904217.${deployFormRegion}.run.app/a2a/app/.well-known/agent-card.json"`,
          '  --gemini-app-id "projects/189717904217/locations/global/collections/default_collection/engines/enterprise-assistant"',
        ].join(' \\\n');

  const archCensus = validateTree(
    archResult.workflowDecision.recommendedSubstrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE,
    archResult.generatedTree
  );

  const handleSelectArchPreset = (presetId: string) => {
    const preset =
      ARCHITECT_INPUT_PRESETS.find((p) => p.id === presetId) ?? ARCHITECT_INPUT_PRESETS[0];
    setArchPresetId(preset.id);
    setArchTitle(preset.label);
    setArchInstructions(preset.rawInstructions);
    setArchVideoNotes(preset.videoTranscriptSummary);
    setArchSubstrate(preset.defaultSubstrate);
    const nextRes = synthesizeHarnessFromInput({
      title: preset.label,
      rawInstructions: preset.rawInstructions,
      videoTranscript: preset.videoTranscriptSummary,
      preferredSubstrate: preset.defaultSubstrate,
    });
    setArchResult(nextRes);
    const firstFile = Object.keys(nextRes.generatedTree)[0] ?? 'systemprompt.md';
    setArchSelectedTreeFile(firstFile);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedVideoName(file.name);
    setUploadedVideoMime(file.type || 'video/mp4');
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result ?? '');
      const base64Part = resultStr.includes(',') ? resultStr.split(',')[1] : '';
      // Keep base64 payload bounded to < 6MB for request transport
      if (base64Part.length < 6_000_000) {
        setUploadedVideoBase64(base64Part);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSynthesizeHarness = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSynthesizingHarness(true);
    try {
      const res = await fetch('/api/harness-architect/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: archTitle,
          rawInstructions: archInstructions,
          videoTranscript: archVideoNotes,
          preferredSubstrate: archSubstrate,
          videoBase64: uploadedVideoBase64 || undefined,
          videoMimeType: uploadedVideoMime,
        }),
      });
      if (res.ok) {
        const data: HarnessArchitectSynthesisResult = await res.json();
        setArchResult(data);
        const firstFile = Object.keys(data.generatedTree)[0] ?? 'systemprompt.md';
        setArchSelectedTreeFile(firstFile);
        return;
      }
    } catch {
      // Fallback to local deterministic architect
    } finally {
      setIsSynthesizingHarness(false);
    }

    const fallback = synthesizeHarnessFromInput({
      title: archTitle,
      rawInstructions: archInstructions,
      videoTranscript: archVideoNotes,
      preferredSubstrate: archSubstrate,
    });
    setArchResult(fallback);
    const firstFile = Object.keys(fallback.generatedTree)[0] ?? 'systemprompt.md';
    setArchSelectedTreeFile(firstFile);
  };

  const handleMountArchTreeIntoValidator = () => {
    setSubstrate(archResult.workflowDecision.recommendedSubstrate);
    setEditorTree({ ...archResult.generatedTree });
    const firstFile = Object.keys(archResult.generatedTree)[0] ?? 'systemprompt.md';
    setSelectedFile(firstFile);
    setActiveTab('surface');
  };

  const handleDownloadHarnessConfig = (
    targetTree: Tree = editorTree,
    targetSubstrate: 'oc' | 'cx' = substrate
  ) => {
    const surf = targetSubstrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE;
    const validation = validateTree(surf, targetTree);
    const payload = {
      schemaVersion: 'harness2.v1',
      exportedAt: new Date().toISOString(),
      substrate: targetSubstrate,
      validationCensus: validation,
      editorTree: targetTree,
    };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `harness-configuration-${targetSubstrate}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('architect');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Harness² · Architect
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-400 overflow-x-auto">
            <button
              onClick={() => setActiveTab('architect')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'architect' ? 'text-white border-b-2 border-blue-500' : ''
              }`}
            >
              Harness Architect
            </button>
            <button
              onClick={() => setActiveTab('gcp')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'gcp' ? 'text-white border-b-2 border-blue-500' : ''
              }`}
            >
              GCP Deploy Agent
            </button>
            <button
              onClick={() => setActiveTab('bazel')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'bazel' ? 'text-white border-b-2 border-blue-500' : ''
              }`}
            >
              Bazel &amp; SDK Skill
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'manual' ? 'text-white border-b-2 border-blue-500' : ''
              }`}
            >
              Skill-Genkit Manual
            </button>
            <button
              onClick={() => setActiveTab('surface')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'surface' ||
                activeTab === 'mcp' ||
                activeTab === 'recursion' ||
                activeTab === 'benchmarks'
                  ? 'text-white border-b-2 border-blue-500'
                  : ''
              }`}
            >
              Validator &amp; Engine
            </button>
          </nav>

          {/* Zone 3: Max 2 action controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleDownloadHarnessConfig(editorTree, substrate)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Harness Configuration
            </button>
            <button
              onClick={handleMountArchTreeIntoValidator}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Surface Validator
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {(activeTab === 'surface' ||
          activeTab === 'mcp' ||
          activeTab === 'recursion' ||
          activeTab === 'benchmarks') && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-xs font-medium text-slate-400 px-2">
              Harness² Core Workbench Modules:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'surface', label: 'Surface Validator & Editor' },
                  { id: 'mcp', label: 'MCP Servers (dart + genkit)' },
                  { id: 'recursion', label: 'Propose–Probe–Compose Engine' },
                  { id: 'benchmarks', label: 'Benchmark Suite' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === m.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'architect' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>Video + SOP Ingestion</span>
                    <span aria-hidden="true">·</span>
                    <span>Automated Workflow Decision</span>
                    <span aria-hidden="true">·</span>
                    <span>Step-by-Step Setup Curriculum, Training &amp; Support</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Agent Harness Architect — Build Your Own Harness Setup Guide &amp; Training Studio
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ingest a walkthrough video (<code className="text-emerald-300">.mp4</code>) or
                    step-by-step operating instructions to automatically decide the optimal workflow
                    (OpenCode vs. Codex substrate, parallel vs. sequential recursion budget,
                    always-on character cap), generate a complete 0-error harness component tree,
                    teach a 5-step interactive setup guide, and build multi-turn agent training
                    evaluations and self-healing support runbooks.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={handleMountArchTreeIntoValidator}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Open Synthesized Harness in Validator
                  </button>
                  <button
                    onClick={() =>
                      setArchSection((prev) =>
                        prev === 'curriculum' ? 'training-support' : 'curriculum'
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {archSection === 'curriculum'
                      ? 'View Agent Training & Support Runbook'
                      : 'Open 5-Step Setup Curriculum'}
                  </button>
                </div>
              </div>

              {/* Architect Sub-Navigation Bar & Substrate Selector */}
              <div className="pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setArchSection('ingest')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      archSection === 'ingest'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. Video &amp; SOP Ingestion + Workflow Decision
                  </button>
                  <button
                    onClick={() => setArchSection('curriculum')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      archSection === 'curriculum'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2. Step-by-Step Setup Guide (5 Lessons)
                  </button>
                  <button
                    onClick={() => setArchSection('harness-files')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      archSection === 'harness-files'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3. Synthesized Harness Tree ({Object.keys(archResult.generatedTree).length}{' '}
                    Files)
                  </button>
                  <button
                    onClick={() => setArchSection('training-support')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      archSection === 'training-support'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    4. Agent Training &amp; Support Runbook
                  </button>
                </div>

                {/* Target Substrate Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {(
                    [
                      { id: 'oc', label: 'OpenCode Substrate (oc · 24k cap)' },
                      { id: 'cx', label: 'Codex Substrate (cx · 8k cap)' },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setArchSubstrate(sub.id);
                        const updated = synthesizeHarnessFromInput({
                          title: archTitle,
                          rawInstructions: archInstructions,
                          videoTranscript: archVideoNotes,
                          preferredSubstrate: sub.id,
                        });
                        setArchResult(updated);
                        setArchSelectedTreeFile(
                          Object.keys(updated.generatedTree)[0] ?? 'systemprompt.md'
                        );
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        archSubstrate === sub.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4 Key Architectural KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400">Preflight Surface Validation</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {archCensus.errors.length === 0
                    ? '0 Errors'
                    : `${archCensus.errors.length} Errors`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {Object.keys(archResult.generatedTree).length} validated harness files
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400">Always-On Prompt Budget</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {archResult.workflowDecision.alwaysOnCharEstimate.toLocaleString()} /{' '}
                  {archResult.workflowDecision.alwaysOnCap.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400">
                  {(
                    (archResult.workflowDecision.alwaysOnCharEstimate /
                      archResult.workflowDecision.alwaysOnCap) *
                    100
                  ).toFixed(1)}
                  % of {archResult.workflowDecision.recommendedSubstrate.toUpperCase()} cap
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400">Recommended Recursion</div>
                <div className="text-2xl font-bold font-mono text-blue-400">
                  {archResult.workflowDecision.recommendedRecursionMode.toUpperCase()} (k=
                  {archResult.workflowDecision.recommendedBudgetK})
                </div>
                <div className="text-[11px] text-slate-400">
                  Propose–Probe–Compose (4k=8 rollouts)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-400">Training &amp; Support Coverage</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {archResult.trainingScenarios.length} Evals · {archResult.supportRunbook.length}{' '}
                  Hooks
                </div>
                <div className="text-[11px] text-emerald-400">
                  Engine: {archResult.synthesisEngine}
                </div>
              </div>
            </div>

            {/* SECTION 1: VIDEO & INSTRUCTION STEP INGESTION + WORKFLOW DECISION ENGINE */}
            {archSection === 'ingest' && (
              <div className="space-y-6">
                {/* Preset Template Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs font-semibold text-slate-300">
                    Load Walkthrough Video &amp; SOP Blueprint Preset:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ARCHITECT_INPUT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectArchPreset(preset.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          archPresetId === preset.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {preset.badge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split View: Video & Instruction Input Form (Left) + Automated Workflow Decision & Timeline Mapping (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Video Player + Instruction Steps Form */}
                  <form
                    onSubmit={handleSynthesizeHarness}
                    className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white">
                        1. Walkthrough Video &amp; Instruction Step Input
                      </h2>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {uploadedVideoName}
                      </span>
                    </div>

                    {/* Built-in Walkthrough Video Player */}
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                      <video
                        src="/assets/harness2-video.mp4"
                        controls
                        muted
                        playsInline
                        className="w-full h-44 object-cover bg-slate-950"
                      />
                      <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>Reference Video: /assets/harness2-video.mp4</span>
                        <label className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                          Upload Custom Video (.mp4)
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={handleVideoFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Harness Blueprint Title
                      </label>
                      <input
                        type="text"
                        value={archTitle}
                        onChange={(e) => setArchTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Step-by-Step Operating Instructions (Numbered or Bulleted SOP)
                      </label>
                      <textarea
                        rows={7}
                        value={archInstructions}
                        onChange={(e) => setArchInstructions(e.target.value)}
                        placeholder="Paste numbered setup steps, CLI commands, or domain workflow instructions..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Video Keyframe / Transcript Notes
                      </label>
                      <textarea
                        rows={3}
                        value={archVideoNotes}
                        onChange={(e) => setArchVideoNotes(e.target.value)}
                        placeholder="00:00-00:20 Inspect baseline failure -> 00:20-00:45 Add SKILL.md and scripts/verify.py..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSynthesizingHarness}
                      className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSynthesizingHarness ? 'animate-spin' : ''}`}
                      />
                      {isSynthesizingHarness
                        ? 'Synthesizing Workflow, Harness Tree & Training Suite...'
                        : 'Synthesize Workflow, Harness & Training Curriculum'}
                    </button>
                  </form>

                  {/* Right Column: Automated Workflow Decision Plan & Video/SOP Timeline Extraction */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Workflow Decision Engine Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h2 className="text-sm font-bold text-white">
                            2. Automated Workflow Decision Engine
                          </h2>
                          <p className="text-xs text-slate-400">{archResult.summary}</p>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 shrink-0">
                          {archResult.workflowDecision.recommendedSubstrate === 'oc'
                            ? 'OpenCode (oc)'
                            : 'Codex (cx)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                          <div className="font-semibold text-blue-300">
                            Substrate &amp; Surface Architecture Decision
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">
                            {archResult.workflowDecision.substrateRationale}
                          </p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                          <div className="font-semibold text-emerald-300">
                            Propose–Probe–Compose Recursion Strategy
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">
                            {archResult.workflowDecision.recursionRationale}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono text-slate-300">
                        <div>
                          Deterministic Verifier:{' '}
                          <span className="text-emerald-400">
                            {archResult.workflowDecision.deterministicScripts.join(', ')}
                          </span>
                        </div>
                        <div>
                          MCP Grounding:{' '}
                          <span className="text-blue-400">
                            {archResult.workflowDecision.mcpServersRequired.join(' · ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Video & Instruction Timeline Mapping */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-white">
                            3. Video &amp; Instruction Step → Harness Component Mapping
                          </h2>
                          <p className="text-xs text-slate-400">
                            How each walkthrough stage is compiled into a deterministic harness
                            artifact
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchSection('curriculum')}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          Open 5-Step Setup Guide →
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {archResult.timelineSegments.map((seg, i) => (
                          <div
                            key={i}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{seg.phaseTitle}</span>
                              <span className="text-[11px] font-mono text-blue-400">
                                {seg.timestamp} → {seg.extractedHarnessComponent}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{seg.observedAction}</p>
                            <div className="text-[11px] font-mono text-emerald-400">
                              Risk Prevented: {seg.failureRiskPrevented}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: STEP-BY-STEP SETUP CURRICULUM ("BUILD YOUR OWN HARNESS") */}
            {archSection === 'curriculum' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Interactive Step-by-Step Setup Guide — Build Your Own Agent Harness
                    </h2>
                    <p className="text-xs text-slate-400">
                      Follow these 5 structured lessons generated directly from your workflow to
                      construct, validate, and train a production-grade agent harness.
                    </p>
                  </div>
                  <button
                    onClick={() => setArchSection('harness-files')}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shrink-0 cursor-pointer"
                  >
                    Inspect All Generated Harness Files →
                  </button>
                </div>

                <div className="space-y-5">
                  {archResult.setupCurriculum.map((lesson) => (
                    <div
                      key={lesson.stepNumber}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-xs font-mono text-blue-400">
                            LESSON 0{lesson.stepNumber} · TARGET: {lesson.targetFile}
                          </span>
                          <h3 className="text-base font-bold text-white mt-0.5">{lesson.title}</h3>
                        </div>
                        <button
                          onClick={() =>
                            handleCopy(`arch-lesson-${lesson.stepNumber}`, lesson.codeSnippet)
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-200 flex items-center gap-1.5 self-start cursor-pointer"
                        >
                          {copiedId === `arch-lesson-${lesson.stepNumber}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Step Artifact
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white">Objective:</strong> {lesson.objective}{' '}
                        {lesson.explanation}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-emerald-950/25 border border-emerald-800/70 rounded-lg p-3 space-y-1">
                          <div className="font-semibold text-emerald-300">
                            Best Practice for Maximum Agent Clarity
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {lesson.bestPracticeTip}
                          </p>
                        </div>
                        <div className="bg-rose-950/25 border border-rose-800/70 rounded-lg p-3 space-y-1">
                          <div className="font-semibold text-rose-300">
                            Common Pitfall Eliminated by Harness²
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {lesson.commonPitfall}
                          </p>
                        </div>
                      </div>

                      <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                        {lesson.codeSnippet}
                      </pre>

                      <div className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-slate-400">
                          Verification Gate:{' '}
                          <span className="text-emerald-300">$ {lesson.verificationCommand}</span>
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `arch-verify-${lesson.stepNumber}`,
                              lesson.verificationCommand
                            )
                          }
                          className="text-blue-400 hover:text-blue-300 text-[11px] cursor-pointer"
                        >
                          {copiedId === `arch-verify-${lesson.stepNumber}`
                            ? 'Copied Cmd'
                            : 'Copy Command'}
                        </button>
                      </div>

                      {/* Step-by-Step Agent Training Guide (Workflow + Dart/Flutter Dev + GCP Managed Deployment Expert) */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-white">
                            Step {lesson.stepNumber} Agent Training &amp; Execution Coaching Guide
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            Pass Signal: {lesson.agentTrainingGuide.expectedPassSignal}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-blue-300">Workflow Agent Training Objective:</strong>{' '}
                          {lesson.agentTrainingGuide.trainingObjective}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
                            <div className="font-semibold text-blue-300">
                              Dart &amp; Flutter Code Developer Expert Protocol
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {lesson.agentTrainingGuide.dartFlutterDeveloperGuidance}
                            </p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
                            <div className="font-semibold text-emerald-300">
                              Google Cloud Managed Deployment &amp; Support Expert Protocol
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {lesson.agentTrainingGuide.gcpDeploymentSupportGuidance}
                            </p>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-amber-300">
                          Agent Practice Drill Prompt: &ldquo;{lesson.agentTrainingGuide.practiceDrillPrompt}&rdquo;
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: SYNTHESIZED HARNESS COMPONENT TREE & EXPERIENCE.MD */}
            {archSection === 'harness-files' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Generated File Tree */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">Synthesized Harness Tree</h2>
                    <span className="text-xs font-mono text-emerald-400">
                      {archCensus.errors.length === 0
                        ? 'VALIDATED (0 ERRORS)'
                        : `${archCensus.errors.length} ERRORS`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {Object.keys(archResult.generatedTree).map((filePath) => (
                      <button
                        key={filePath}
                        onClick={() => setArchSelectedTreeFile(filePath)}
                        className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          archSelectedTreeFile === filePath
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <span className="truncate">{filePath}</span>
                        <span className="text-[10px] opacity-80 shrink-0 ml-2">
                          {archResult.generatedTree[filePath]?.length ?? 0}B
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleMountArchTreeIntoValidator}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Mount Tree in Live Surface Validator &amp; Editor
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadHarnessConfig(
                          archResult.generatedTree,
                          archResult.workflowDecision.recommendedSubstrate
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Download Harness Configuration (JSON)
                    </button>
                  </div>
                </div>

                {/* Right: Selected File Code & Continual Experience Library */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {archSelectedTreeFile}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            'arch-selected-file',
                            archResult.generatedTree[archSelectedTreeFile] ?? ''
                          )
                        }
                        className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'arch-selected-file' ? 'Copied' : 'Copy File'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                      {archResult.generatedTree[archSelectedTreeFile] ?? ''}
                    </pre>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Synthesized Continual Experience Library (EXPERIENCE.md)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Persistent cue, lesson, evidence, and confidence record for
                          harnessing-level adaptation
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy('arch-exp-md', archResult.experienceMarkdown)}
                        className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'arch-exp-md' ? 'Copied' : 'Copy EXPERIENCE.md'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {archResult.experienceMarkdown}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: AGENT TRAINING CURRICULUM & SELF-HEALING AGENT SUPPORT RUNBOOK */}
            {archSection === 'training-support' && (
              <div className="space-y-6">
                {/* 6-Stage Master Training Guide for Every Workflow Agent Task Harness Execution Step */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Complete 6-Stage Training Guide — Workflow Agent Task Harness Execution, Dart/Flutter Developer &amp; Google Cloud Deployment Expert
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Step-by-step agent training protocol for every stage of task harness execution, combining Dart 3.10 / Flutter 3.32 code development (`dart mcp-server`, Genkit, Bazel Bzlmod) and Google Cloud managed agent deployment (`google-agents-cli`, Agent Runtime, Cloud Run, GKE).
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 shrink-0">
                      All 6 Execution Stages Covered
                    </span>
                  </div>

                  <div className="space-y-4">
                    {WORKFLOW_EXECUTION_MASTER_GUIDE.map((stage) => (
                      <div
                        key={stage.stageId}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div>
                            <span className="text-xs font-mono text-blue-400">
                              WORKFLOW STAGE 0{stage.stageNumber} · SURFACE: {stage.harnessSurfaceTarget}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-0.5">
                              {stage.stageTitle}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {stage.supportSelfHealingGuarantee}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
                            <div className="font-semibold text-white">
                              Workflow Agent Task Execution Protocol
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {stage.workflowExecutionProtocol}
                            </p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
                            <div className="font-semibold text-amber-300">
                              Agent Training Drill &amp; Evaluation Target
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {stage.agentTrainingDrill}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-blue-950/20 border border-blue-800/60 rounded-lg p-3.5 space-y-2">
                            <div className="font-semibold text-blue-300">
                              Dart &amp; Flutter Code Developer Expert Execution
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {stage.dartFlutterDeveloperExpertRule}
                            </p>
                            <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                              $ {stage.dartFlutterVerificationCmd}
                            </div>
                          </div>

                          <div className="bg-emerald-950/20 border border-emerald-800/60 rounded-lg p-3.5 space-y-2">
                            <div className="font-semibold text-emerald-300">
                              Google Cloud Managed Agent Deployment &amp; Support Expert
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {stage.gcpManagedDeployExpertRule}
                            </p>
                            <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                              $ {stage.gcpManagedDeployVerificationCmd}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Turn Agent Training & Evaluation Suite */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Effective Agent Training Curriculum — Trajectory &amp; Rubric Evaluation Suite
                      </h2>
                      <p className="text-xs text-slate-400">
                        Train and benchmark your harnessed agent across foundational, adversarial,
                        and context-scale scenarios before production rollout.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      3 Multi-Turn Training Scenarios
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {archResult.trainingScenarios.map((scen) => (
                      <div
                        key={scen.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">
                              {scen.scenarioTitle}
                            </span>
                            <span className="text-[11px] font-mono text-blue-400 shrink-0">
                              {scen.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-100">Prompt:</strong> &ldquo;
                            {scen.userPrompt}&rdquo;
                          </p>
                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold text-slate-400">
                              Expected Tool Trajectory:
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded p-2 font-mono text-[11px] text-emerald-300 space-y-1">
                              {scen.expectedToolTrajectory.map((t, idx) => (
                                <div key={idx}>
                                  {idx + 1}. {t}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                          <div className="font-mono text-amber-300">
                            Verifier: $ {scen.deterministicVerifierCmd}
                          </div>
                          <div className="text-slate-400">{scen.gradingRubric}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Self-Healing Agent Support Runbook */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Self-Healing Agent Support &amp; Automated Guardrail Runbook
                      </h2>
                      <p className="text-xs text-slate-400">
                        Automated hooks, trigger repair, and sub-agent isolation that guarantee a
                        clear and complete outcome on every run.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-blue-400">
                      Zero-Intervention Support Matrix
                    </span>
                  </div>

                  <div className="space-y-3">
                    {archResult.supportRunbook.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs"
                      >
                        <div className="lg:col-span-4 space-y-1">
                          <div className="font-bold text-rose-300">Symptom: {item.symptom}</div>
                          <div className="text-slate-400 text-[11px]">
                            Root Cause: {item.rootCause}
                          </div>
                        </div>
                        <div className="lg:col-span-4 space-y-1">
                          <div className="font-mono text-blue-300 text-[11px]">
                            Guardrail: {item.automatedHookOrScript}
                          </div>
                          <div className="text-slate-200 text-[11px]">{item.selfHealingAction}</div>
                        </div>
                        <div className="lg:col-span-4 flex items-center lg:justify-end">
                          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg px-3 py-2 text-emerald-300 text-[11px] font-medium">
                            Outcome: {item.outcomeGuarantee}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gcp' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>github.com/chrisfbaileycb-arch/agents-cli</span>
                    <span aria-hidden="true">·</span>
                    <span>7 Official Agent Skills</span>
                    <span aria-hidden="true">·</span>
                    <span>Agent Runtime · Cloud Run · GKE</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Google Cloud Deployment Agent — Skills, Monitoring &amp; Fleet Management
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    End-to-end Google Cloud ADK deployment agent and observability control plane
                    grounded in <code className="text-emerald-300">chrisfbaileycb-arch/agents-cli</code>
                    : covers all 7 official skills (
                    <code className="text-blue-300">workflow</code>,{' '}
                    <code className="text-blue-300">adk-code</code>,{' '}
                    <code className="text-blue-300">scaffold</code>,{' '}
                    <code className="text-blue-300">eval</code>,{' '}
                    <code className="text-blue-300">deploy</code>,{' '}
                    <code className="text-blue-300">publish</code>,{' '}
                    <code className="text-blue-300">observability</code>), memory-concurrency
                    sizing, Gemini registration (<code className="text-slate-200">:streamQuery</code>{' '}
                    &amp; A2A), and OpenTelemetry Cloud Trace span monitoring.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={handleMountGcpSkillIntoValidator}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Validate google_agents_cli_deploy in Harness²
                  </button>
                  <button
                    onClick={() =>
                      setGcSection((prev) => (prev === 'steps' ? 'monitor' : 'steps'))
                    }
                    className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {gcpSection === 'steps'
                      ? 'Open Live Fleet & Code Monitor'
                      : 'View 5-Phase Execution Manual'}
                  </button>
                </div>
              </div>

              {/* Section Mode Bar & Deployment Target Switcher */}
              <div className="pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setGcSection('monitor')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      gcpSection === 'monitor'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. Live Fleet Manager &amp; Code Monitoring
                  </button>
                  <button
                    onClick={() => setGcSection('steps')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      gcpSection === 'steps'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2. Step-by-Step Deployment Instructions (Phases 1–5)
                  </button>
                  <button
                    onClick={() => setGcSection('skills')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      gcpSection === 'skills'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3. All 7 Official agents-cli Skills Reference
                  </button>
                </div>

                {/* Target Environment Switcher */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {(
                    [
                      { id: 'agent_runtime', label: 'Agent Runtime (:streamQuery)' },
                      { id: 'cloud_run', label: 'Cloud Run (Serverless A2A)' },
                      { id: 'gke', label: 'GKE Autopilot (Terraform)' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setGcpTarget(t.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        gcpTarget === t.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 1: LIVE FLEET MANAGER, SIZING ENGINE & OPENTELEMETRY CODE MONITOR */}
            {gcpSection === 'monitor' && (
              <div className="space-y-6">
                {/* 4 KPI Summary Cards (max 3 data points per card, tabular-nums) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                    <div className="text-xs text-slate-400">Managed GCP Agent Fleet</div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {gcpDeployments.length} Active
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {gcpDeployments.filter((d) => d.status === 'HEALTHY').length} Healthy ·{' '}
                      {gcpDeployments.filter((d) => d.status === 'DEGRADED').length} Needs Scaling
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                    <div className="text-xs text-slate-400">Eval Gate Pass Rate</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {selectedGcpDeployment.evalPassRatePct.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      agents-cli eval run (24 scenarios)
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                    <div className="text-xs text-slate-400">Cloud Trace p95 Latency</div>
                    <div className="text-2xl font-bold font-mono text-blue-400">
                      {selectedGcpDeployment.p95LatencyMs} ms
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Error Rate: {selectedGcpDeployment.errorRatePct}%
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                    <div className="text-xs text-slate-400">Span Privacy Guardrail</div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {selectedGcpDeployment.otelCaptureMode}
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      GCS/BigQuery Hook: upload enabled
                    </div>
                  </div>
                </div>

                {/* Fleet Deployment Selector & Live Code/Trace Monitor */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Managed Agent Deployments List */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-white">
                          Active Google Cloud Agent Deployments
                        </h2>
                        <p className="text-xs text-slate-400">
                          Click a deployment to inspect its Cloud Trace spans &amp; sizing
                        </p>
                      </div>
                      <code className="text-[11px] font-mono text-slate-400">
                        agents-cli deploy --list
                      </code>
                    </div>

                    <div className="space-y-3">
                      {gcpDeployments.map((dep) => {
                        const selected = dep.id === selectedGcpDeployment.id;
                        const depSizing = calculateSizingHealth(dep.memoryGi, dep.concurrency);
                        return (
                          <div
                            key={dep.id}
                            onClick={() => {
                              setSelectedGcpDepId(dep.id);
                              setDeployFormName(dep.name);
                              setGcpTarget(dep.target);
                              setDeployFormRegion(dep.region);
                              setDeployFormProject(dep.project);
                              setDeployFormCpu(dep.cpu);
                              setDeployFormMemoryGi(dep.memoryGi);
                              setDeployFormConcurrency(dep.concurrency);
                              setDeployFormMinInstances(dep.minInstances);
                              setDeployFormMaxInstances(dep.maxInstances);
                            }}
                            className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-2.5 ${
                              selected
                                ? 'bg-slate-950 border-blue-500'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-white">
                                {dep.name}
                              </span>
                              <span
                                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                                  dep.status === 'HEALTHY'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {dep.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                              <span className="text-blue-300">{dep.target}</span>
                              <span>·</span>
                              <span>{dep.region}</span>
                              <span>·</span>
                              <span>
                                {dep.cpu} vCPU / {dep.memoryGi}Gi / conc={dep.concurrency}
                              </span>
                              <span>·</span>
                              <span>reg: {dep.registrationType.toUpperCase()}</span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              {dep.resourceUri}
                            </div>

                            {depSizing.status === 'OOM_RISK' && (
                              <div className="pt-1 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-rose-300 font-medium">
                                  Peak {depSizing.peakMiB} MiB ({depSizing.utilizationPct}% of{' '}
                                  {dep.memoryGi}Gi)
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeployOrUpdateGcpAgent(undefined, {
                                      ...dep,
                                      memoryGi: 8,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white cursor-pointer"
                                >
                                  Remediate: Scale to 8Gi
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: OpenTelemetry Span Tree & Live Code Monitoring */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-white">
                          OpenTelemetry Cloud Trace &amp; Code Execution Monitor —{' '}
                          <span className="text-blue-400 font-mono">
                            {selectedGcpDeployment.name}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          ADK Span Hierarchy: <code>invoke_workflow</code> →{' '}
                          <code>invoke_agent</code> → <code>call_llm</code> (
                          <code>generate_content</code>) → <code>execute_tool</code>
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">
                        otel_to_cloud=True
                      </span>
                    </div>

                    {/* Recent OpenTelemetry Spans */}
                    <div className="space-y-3">
                      {selectedGcpDeployment.recentSpans.map((span) => (
                        <div
                          key={span.traceId}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5 font-mono text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-slate-400">
                              trace_id: <span className="text-white">{span.traceId}</span>
                            </span>
                            <span
                              className={
                                span.status === 'OK' ? 'text-emerald-400' : 'text-rose-400'
                              }
                            >
                              {span.status} · {span.durationMs} ms · {span.tokensUsed} tokens
                            </span>
                          </div>
                          <div className="pl-2 border-l-2 border-slate-800 space-y-1 text-[11px]">
                            <div className="text-blue-300">└── {span.workflowSpan}</div>
                            <div className="pl-4 text-slate-200">└── {span.agentSpan}</div>
                            <div className="pl-8 text-amber-300">
                              ├── call_llm → generate_content ({span.llmModel})
                            </div>
                            <div className="pl-8 text-emerald-300">└── {span.toolCalled}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Two-Tier Logging & Security Posture Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1">
                        <div className="font-semibold text-white">
                          Tier 1 &amp; 2 Telemetry Configuration
                        </div>
                        <div className="font-mono text-[11px] text-slate-300">
                          Span Content: {selectedGcpDeployment.otelCaptureMode}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400">
                          BQ Dataset: {selectedGcpDeployment.bqAnalyticsDataset}
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1">
                        <div className="font-semibold text-white">
                          Enterprise Governance &amp; Security
                        </div>
                        <div className="font-mono text-[11px] text-slate-300">
                          Agent Identity: {selectedGcpDeployment.agentIdentity ? 'ENABLED' : 'OFF'}{' '}
                          · CMEK: {selectedGcpDeployment.cmekEnabled ? 'KMS_LOCKED' : 'GOOGLE_MANAGED'}
                        </div>
                        <div className="font-mono text-[11px] text-blue-300 truncate">
                          Gateway: {selectedGcpDeployment.agentGatewayEgress ?? 'Direct Egress'}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Deployment & Sizing Configurator */}
                    <form
                      onSubmit={(e) => handleDeployOrUpdateGcpAgent(e)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Deploy or Update Google Cloud Agent &amp; Sizing Calculator
                        </span>
                        {deployActionStatus && (
                          <span className="text-xs font-mono text-emerald-400">
                            {deployActionStatus}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Service Name
                          </label>
                          <input
                            type="text"
                            value={deployFormName}
                            onChange={(e) => setDeployFormName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Target (--deployment-target)
                          </label>
                          <select
                            value={gcpTarget}
                            onChange={(e) => setGcpTarget(e.target.value as GcpDeployTarget)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white"
                          >
                            <option value="agent_runtime">agent_runtime</option>
                            <option value="cloud_run">cloud_run</option>
                            <option value="gke">gke</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Memory (--memory)
                          </label>
                          <select
                            value={deployFormMemoryGi}
                            onChange={(e) => setDeployFormMemoryGi(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white"
                          >
                            <option value={2}>2Gi</option>
                            <option value={4}>4Gi (Default)</option>
                            <option value={8}>8Gi</option>
                            <option value={16}>16Gi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Concurrency (--concurrency)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={64}
                            value={deployFormConcurrency}
                            onChange={(e) => setDeployFormConcurrency(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Real-Time Memory-Concurrency Coupling Advisory */}
                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          liveFormSizing.status === 'OOM_RISK'
                            ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                            : liveFormSizing.status === 'HIGH_LOAD'
                            ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                            : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                        }`}
                      >
                        <div className="font-mono font-bold">
                          Sizing Analysis ({liveFormSizing.status}): Peak {liveFormSizing.peakMiB}{' '}
                          MiB / {liveFormSizing.limitMiB} MiB ({liveFormSizing.utilizationPct}%)
                        </div>
                        <div className="mt-0.5 text-[11px]">{liveFormSizing.recommendation}</div>
                      </div>

                      {/* Generated CLI Command Preview */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400">
                            Generated Non-Interactive Deploy &amp; Publish Commands
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                'gen-gcp-deploy-cmd',
                                `${generatedDeployCmd}\n\n${generatedPublishCmd}`
                              )
                            }
                            className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                          >
                            {copiedId === 'gen-gcp-deploy-cmd' ? 'Copied Commands' : 'Copy CLI'}
                          </button>
                        </div>
                        <pre className="bg-slate-900 border border-slate-800 rounded p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                          {generatedDeployCmd}
                          {'\n\n'}
                          {generatedPublishCmd}
                        </pre>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          Execute Deployment Update
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: 5-PHASE STEP-BY-STEP DEPLOYMENT & MONITORING MANUAL */}
            {gcpSection === 'steps' && (
              <div className="space-y-6">
                {GCP_DEPLOYMENT_STEPS.map((step) => {
                  const ex = step.targetExamples[gcpTarget];
                  const copyFileId = `gcp-step-file-${step.stepNumber}-${gcpTarget}`;
                  const copyCmdId = `gcp-step-cmd-${step.stepNumber}-${gcpTarget}`;
                  return (
                    <article
                      key={step.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
                    >
                      <div className="border-b border-slate-800 pb-4 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                          <span>{step.phase}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400">Target: {gcpTarget}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white">{step.title}</h2>
                        <p className="text-xs text-slate-300 leading-relaxed">{step.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 space-y-4">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-1.5">
                            <div className="text-xs font-semibold text-amber-300">
                              Operational Guardrail (from chrisfbaileycb-arch/agents-cli)
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {step.operationalRule}
                            </p>
                          </div>

                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                            <div className="text-xs font-semibold text-white">
                              Execution Checklist
                            </div>
                            <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                              {step.checklist.map((item, i) => (
                                <li key={i} className="leading-relaxed">
                                  {item}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-400">
                                Verification CLI Command
                              </span>
                              <button
                                onClick={() => handleCopy(copyCmdId, ex.cliCommand)}
                                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                              >
                                {copiedId === copyCmdId ? 'Copied' : 'Copy Cmd'}
                              </button>
                            </div>
                            <pre className="bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-xs text-emerald-300 overflow-x-auto">
                              $ {ex.cliCommand}
                            </pre>
                            <pre className="bg-slate-900/60 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {ex.expectedOutput}
                            </pre>
                          </div>
                        </div>

                        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-white">
                              {ex.filename} ({ex.language})
                            </span>
                            <button
                              onClick={() => handleCopy(copyFileId, ex.code)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                            >
                              {copiedId === copyFileId ? 'Copied' : 'Copy Code'}
                            </button>
                          </div>
                          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed flex-1">
                            {ex.code}
                          </pre>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* SECTION 3: ALL 7 OFFICIAL AGENTS-CLI SKILLS SUITE */}
            {gcpSection === 'skills' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {AGENTS_CLI_SKILLS_SUITE.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-blue-400">
                            {skill.skillName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {skill.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{skill.summary}</p>

                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-400">
                            Triggers When:
                          </div>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                            {skill.triggersWhen.map((trig, idx) => (
                              <li key={idx}>{trig}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-400">
                            Key CLI Commands:
                          </div>
                          <pre className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                            {skill.keyCommands.join('\n')}
                          </pre>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400">
                            SKILL.md Specification Excerpt
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(`skill-md-${skill.id}`, skill.skillMarkdownExcerpt)
                            }
                            className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                          >
                            {copiedId === `skill-md-${skill.id}` ? 'Copied' : 'Copy SKILL.md'}
                          </button>
                        </div>
                        <pre className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap">
                          {skill.skillMarkdownExcerpt}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bazel' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>github.com/chrisfbaileycb-arch/bazel</span>
                    <span aria-hidden="true">·</span>
                    <span>Skill: developing_bazel</span>
                    <span aria-hidden="true">·</span>
                    <span>Dart · Flutter · Multi-Platform SDKs</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Agent Bazel Coding Skill, App Analyzer &amp; Dart/Flutter SDK Deployments
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Complete agent coding skill (<code className="text-blue-300">developing_bazel</code>)
                    and step-by-step execution manual grounded in{' '}
                    <code className="text-emerald-300">chrisfbaileycb-arch/bazel</code> (Bzlmod{' '}
                    <code className="text-slate-200">MODULE.bazel</code>, SHA-256 hermetic toolchains,{' '}
                    <code className="text-slate-200">.bazelrc</code> guardrails, and{' '}
                    <code className="text-slate-200">.gemini/styleguide.md</code>) for building,
                    analyzing, and deploying <strong>Dart AOT + Genkit</strong>,{' '}
                    <strong>Flutter Web (Wasm) / Mobile / Desktop</strong>, and{' '}
                    <strong>Distroless OCI SDK releases</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={handleMountBazelSkillIntoValidator}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Validate developing_bazel in Harness²
                  </button>
                  <button
                    onClick={() =>
                      setBazelSection((prev) => (prev === 'analyzer' ? 'steps' : 'analyzer'))
                    }
                    className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {bazelSection === 'analyzer'
                      ? 'View 8-Step Execution Manual'
                      : 'Open Application Analyzer & Recommender'}
                  </button>
                </div>
              </div>

              {/* Section Mode Bar & Stack Selector */}
              <div className="pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setBazelSection('steps')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      bazelSection === 'steps'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. Step-by-Step Execution Manual (Steps 1–8)
                  </button>
                  <button
                    onClick={() => setBazelSection('analyzer')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      bazelSection === 'analyzer'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2. Application Analyzer &amp; Recommendations
                  </button>
                  <button
                    onClick={() => setBazelSection('skill-spec')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      bazelSection === 'skill-spec'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3. Agent Skill Files (SKILL.md &amp; Audit Script)
                  </button>
                </div>

                {/* Target Deployment Profile Selector */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {BAZEL_STACK_PROFILES.map((prof) => {
                    const active = bazelStack === prof.id;
                    return (
                      <button
                        key={prof.id}
                        onClick={() => setBazelStack(prof.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {prof.badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Target Profile Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Active Target Profile: {currentBazelStackProfile.label}
                  </div>
                  <p className="text-xs text-slate-400">{currentBazelStackProfile.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
                    {currentBazelStackProfile.primaryCommand}
                  </code>
                  <button
                    onClick={() =>
                      handleCopy('primary-bazel-cmd', currentBazelStackProfile.primaryCommand)
                    }
                    className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'primary-bazel-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 1: 8-STEP EXECUTION MANUAL */}
            {bazelSection === 'steps' && (
              <div className="space-y-6">
                {BAZEL_IMPLEMENTATION_STEPS.map((step) => {
                  const block = step.codeBlocks[bazelStack];
                  const copyKey = `bazel-step-${step.stepNumber}-${bazelStack}`;
                  const cmdKey = `bazel-cmd-${step.stepNumber}-${bazelStack}`;
                  return (
                    <article
                      key={step.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                            <span>STEP 0{step.stepNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>{step.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400">
                              {currentBazelStackProfile.badge}
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-white">{step.title}</h2>
                          <p className="text-xs text-slate-300 leading-relaxed">{step.summary}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Why it matters & Step-by-Step Checklist */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                            <div className="text-xs font-semibold text-white">
                              Architectural Rationale
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {step.whyItMatters}
                            </p>
                          </div>

                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5">
                            <div className="text-xs font-semibold text-white">
                              Step-by-Step Execution Checklist
                            </div>
                            <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
                              {step.executionChecklist.map((item, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {item}
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Verification Command & Expected Output */}
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5" />
                                Verification Command
                              </span>
                              <button
                                onClick={() => handleCopy(cmdKey, block.verificationCmd)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === cmdKey ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Cmd
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-xs text-emerald-300 overflow-x-auto">
                              $ {block.verificationCmd}
                            </pre>
                            <div className="text-[11px] font-mono text-slate-400 pt-1">
                              Expected Output:
                            </div>
                            <pre className="bg-slate-900/60 border border-slate-800/80 rounded p-2.5 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {block.expectedOutput}
                            </pre>
                          </div>
                        </div>

                        {/* Right Column: Code Block */}
                        <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-blue-400" />
                              <span className="font-mono text-xs font-semibold text-white">
                                {block.filename}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ({block.language})
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(copyKey, block.code)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedId === copyKey ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy File
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed flex-1">
                            {block.code}
                          </pre>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* SECTION 2: APPLICATION ANALYZER & ARCHITECTURE RECOMMENDER */}
            {bazelSection === 'analyzer' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Bazel Application Analyzer &amp; Dart / Flutter / SDK Recommender
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Select a reference application profile or inspect your own{' '}
                        <code>MODULE.bazel</code>, <code>WORKSPACE</code>, or{' '}
                        <code>pubspec.yaml</code> to generate step-by-step hermeticity, Bzlmod, and
                        SDK deployment recommendations.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUseCustomAnalyzerInput(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          !useCustomAnalyzerInput
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        Curated Application Profiles
                      </button>
                      <button
                        onClick={() => setUseCustomAnalyzerInput(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          useCustomAnalyzerInput
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        Analyze Custom Manifest
                      </button>
                    </div>
                  </div>

                  {!useCustomAnalyzerInput ? (
                    <>
                      {/* Preset Selector Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {APP_ANALYSIS_PRESETS.map((preset) => {
                          const active = preset.id === selectedAnalysisPresetId;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedAnalysisPresetId(preset.id);
                                setCustomManifestInput(preset.sampleManifest);
                              }}
                              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                                active
                                  ? 'bg-slate-950 border-blue-500'
                                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-xs font-mono text-blue-400">
                                {preset.stackType}
                              </div>
                              <div className="text-sm font-bold text-white">{preset.name}</div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {preset.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* 4 KPI Score Cards (Max 3 data points per card, tabular-nums) */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                          <div className="text-xs text-slate-400">Hermeticity Score</div>
                          <div className="text-2xl font-bold font-mono text-white">
                            {currentAnalysisPreset.scores.hermeticity}%
                          </div>
                          <div className="text-[11px] text-slate-400">
                            SHA-256 SDK &amp; Action Env Isolation
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                          <div className="text-xs text-slate-400">Bzlmod Readiness</div>
                          <div className="text-2xl font-bold font-mono text-blue-400">
                            {currentAnalysisPreset.scores.bzlmodReadiness}%
                          </div>
                          <div className="text-[11px] text-slate-400">
                            MODULE.bazel &amp; Lockfile Coverage
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                          <div className="text-xs text-slate-400">Build Graph Granularity</div>
                          <div className="text-2xl font-bold font-mono text-emerald-400">
                            {currentAnalysisPreset.scores.cacheGranularity}%
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Incremental Package Cache Hit Ratio
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                          <div className="text-xs text-slate-400">SDK Deployment Maturity</div>
                          <div className="text-2xl font-bold font-mono text-amber-400">
                            {currentAnalysisPreset.scores.sdkDeploymentMaturity}%
                          </div>
                          <div className="text-[11px] text-slate-400">
                            AOT + Wasm + Distroless OCI Packaging
                          </div>
                        </div>
                      </div>

                      {/* Prioritized Findings & Actionable Recommendations */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Prioritized Architectural Recommendations &amp; Remediation Steps
                        </h3>
                        <div className="space-y-3">
                          {currentAnalysisPreset.diagnostics.map((diag, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                                      diag.severity === 'CRITICAL'
                                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                        : diag.severity === 'HIGH'
                                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                        : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                                    }`}
                                  >
                                    {diag.severity}
                                  </span>
                                  <span className="text-xs font-bold text-white">{diag.area}</span>
                                </div>
                                <code className="text-xs font-mono text-emerald-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                                  $ {diag.command}
                                </code>
                              </div>
                              <p className="text-xs text-slate-300">
                                <strong className="text-slate-200">Finding:</strong> {diag.finding}
                              </p>
                              <p className="text-xs text-emerald-300/90">
                                <strong className="text-emerald-300">Recommended Fix:</strong>{' '}
                                {diag.fix}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Generated Recommended MODULE.bazel & BUILD.bazel */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-white">
                              Recommended MODULE.bazel
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  'rec-module-bazel',
                                  currentAnalysisPreset.recommendedModuleBazel
                                )
                              }
                              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === 'rec-module-bazel' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto flex-1">
                            {currentAnalysisPreset.recommendedModuleBazel}
                          </pre>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-white">
                              Recommended BUILD.bazel (Dart AOT + Flutter Wasm)
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  'rec-build-bazel',
                                  currentAnalysisPreset.recommendedBuildBazel
                                )
                              }
                              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === 'rec-build-bazel' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto flex-1">
                            {currentAnalysisPreset.recommendedBuildBazel}
                          </pre>
                        </div>
                      </div>

                      {/* Step-by-Step Execution Pipeline for this Application */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                        <div className="text-xs font-semibold text-white">
                          Step-by-Step Execution Sequence
                        </div>
                        <pre className="bg-slate-900 border border-slate-800 rounded p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                          {currentAnalysisPreset.deploymentPipelineCommands
                            .map((cmd, idx) => `${idx + 1}. $ ${cmd}`)
                            .join('\n')}
                        </pre>
                      </div>
                    </>
                  ) : (
                    /* Custom Manifest Live Analyzer */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-6 space-y-2">
                        <label className="block text-xs font-semibold text-slate-300">
                          Paste MODULE.bazel, WORKSPACE, BUILD.bazel, or pubspec.yaml
                        </label>
                        <textarea
                          value={customManifestInput}
                          onChange={(e) => setCustomManifestInput(e.target.value)}
                          rows={14}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="lg:col-span-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <div className="text-xs text-slate-400">Hermeticity Score</div>
                            <div className="text-2xl font-bold font-mono text-white">
                              {customAnalysisResult.hermeticityScore}%
                            </div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <div className="text-xs text-slate-400">Bzlmod Readiness</div>
                            <div className="text-2xl font-bold font-mono text-blue-400">
                              {customAnalysisResult.bzlmodScore}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {customAnalysisResult.findings.map((f, i) => (
                            <div
                              key={i}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{f.title}</span>
                                <span className="text-[11px] font-mono text-blue-400">
                                  {f.severity}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300">{f.detail}</p>
                              <code className="block text-[11px] font-mono text-emerald-300 pt-1">
                                $ {f.fixCmd}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: COMPLETE AGENT BAZEL SKILL SPECIFICATION */}
            {bazelSection === 'skill-spec' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-white">
                      skills/developing-bazel/SKILL.md
                    </span>
                    <button
                      onClick={() => handleCopy('bazel-skill-md', BAZEL_SKILL_MD_CONTENT)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                    >
                      {copiedId === 'bazel-skill-md' ? 'Copied SKILL.md' : 'Copy SKILL.md'}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {BAZEL_SKILL_MD_CONTENT}
                  </pre>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        skills/developing-bazel/scripts/bazel_audit.py
                      </span>
                      <button
                        onClick={() => handleCopy('bazel-audit-py', BAZEL_AUDIT_SCRIPT_CONTENT)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'bazel-audit-py' ? 'Copied Script' : 'Copy Script'}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                      {BAZEL_AUDIT_SCRIPT_CONTENT}
                    </pre>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-white">
                      One-Click Harness² Surface Validation
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Load the complete <code>developing_bazel</code> +{' '}
                      <code>developing_genkit_dart</code> + <code>scripts/bazel_audit.py</code> +{' '}
                      <code>dart mcp-server</code> component tree into the Harness² Surface
                      Validator to inspect character budgets, frontmatter rules, and trigger lines.
                    </p>
                    <button
                      onClick={handleMountBazelSkillIntoValidator}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                    >
                      Open in Harness² Surface Validator
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-8">
            {/* Hero / Overview Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>github.com/chrisfbaileycb-arch/skill-genkit</span>
                    <span aria-hidden="true">·</span>
                    <span>Agent Skills Specification v1.0</span>
                    <span aria-hidden="true">·</span>
                    <span>4 Official SDK Skills</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Genkit Agent Skills — Step-by-Step Instruction Manual
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Complete engineering guide with runnable examples for installing, configuring,
                    and executing the four Genkit Agent Skills (
                    <code className="text-blue-300">developing-genkit-js</code>,{' '}
                    <code className="text-blue-300">developing-genkit-dart</code>,{' '}
                    <code className="text-blue-300">developing-genkit-go</code>, and{' '}
                    <code className="text-blue-300">developing-genkit-python</code>), wiring{' '}
                    <code className="text-emerald-300">dart mcp-server</code> over Model Context
                    Protocol, and verifying execution traces via the Genkit CLI.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={() => handleMountSkillIntoValidator(selectedLang)}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Validate {currentLangSpec.skillName} in Harness²
                  </button>
                  <button
                    onClick={() => setShowAllSteps((v) => !v)}
                    className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {showAllSteps ? 'Switch to Single-Step Focus' : 'Show All 6 Steps Stacked'}
                  </button>
                </div>
              </div>

              {/* Language Selector Segmented Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {(Object.keys(GENKIT_LANGUAGES) as GenkitLang[]).map((langKey) => {
                    const spec = GENKIT_LANGUAGES[langKey];
                    const active = selectedLang === langKey;
                    return (
                      <button
                        key={langKey}
                        onClick={() => {
                          setSelectedLang(langKey);
                          setSimulatedTraceLang(langKey);
                        }}
                        className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {spec.label} ({spec.skillName})
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Runtime: {currentLangSpec.runtime}</span>
                  <span aria-hidden="true">·</span>
                  <span>Schemas: {currentLangSpec.schemaLib}</span>
                </div>
              </div>

              {/* Quick Install Command Strip */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 font-mono text-xs overflow-x-auto">
                  <div className="text-slate-400">
                    $ <span className="text-emerald-300">{currentLangSpec.installSkillsSh}</span>
                  </div>
                  <div className="text-slate-500">
                    $ <span>{currentLangSpec.installUpstreamSh}</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopy(`install-${selectedLang}`, currentLangSpec.installSkillsSh)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedId === `install-${selectedLang}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Install Command
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Step Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SKILL_GENKIT_STEPS.map((step, idx) => {
                const isCurrent = !showAllSteps && activeStepIndex === idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setShowAllSteps(false);
                      setActiveStepIndex(idx);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {step.title}
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Cards */}
            <div className="space-y-6">
              {visibleSteps.map((step) => {
                const langExample = step.codeByLang[selectedLang];
                const copyKey = `${step.id}-${selectedLang}`;
                return (
                  <article
                    key={step.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <span>Step {step.number} of 06</span>
                          <span aria-hidden="true">·</span>
                          <span>{currentLangSpec.skillName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{langExample.filename}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{step.title}</h2>
                        <p className="text-xs text-slate-400">{step.subtitle}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(copyKey, langExample.code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedId === copyKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied Snippet
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy {currentLangSpec.label} Example
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{step.summary}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left 5 cols: Key Rules & Explanation */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-slate-200">
                            Implementation Rules ({currentLangSpec.label})
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {langExample.explanation}
                          </p>
                        </div>

                        <ul className="space-y-2.5 border-t border-slate-800 pt-3">
                          {step.keyRules.map((rule, rIdx) => (
                            <li
                              key={rIdx}
                              className="text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                            >
                              <span className="font-mono text-blue-400 select-none">
                                {rIdx + 1}.
                              </span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right 7 cols: Code Example */}
                      <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>{langExample.filename}</span>
                          <span>{currentLangSpec.label}</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                          {langExample.code}
                        </pre>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Interactive Trace Verification Simulator (Step 06 Companion) */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Interactive `genkit flow:run` &amp; `trace:get` Inspector
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simulate running `reconcileLedgerFlow` via the Genkit CLI and inspect the
                    captured machine-readable JSON trace spans.
                  </p>
                </div>
                <button
                  onClick={() => setSimulatedTraceLang(selectedLang)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run `genkit flow:run` ({currentLangSpec.label})
                </button>
              </div>

              {simulatedTraceLang && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      CLI Execution (`--non-interactive`)
                    </div>
                    <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {[
                        `$ ${GENKIT_LANGUAGES[simulatedTraceLang].flowRunCommand}`,
                        `[genkit] Starting runtime (${GENKIT_LANGUAGES[simulatedTraceLang].runtime})...`,
                        `[genkit] Registered flow: reconcileLedgerFlow`,
                        `[genkit] Registered tool: sumLedgerTool`,
                        `[genkit] Connected MCP host: my-host (dart mcp-server)`,
                        `[genkit] Flow output: "Account ACC-01 reconciled. Signed Net Total: 85.15"`,
                        `[genkit] Trace ID: tr_98f4a21c7e0b41d2`,
                      ].join('\n')}
                    </pre>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      $ genkit trace:get tr_98f4a21c7e0b41d2 --format json
                    </div>
                    <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                      {JSON.stringify(
                        {
                          traceId: 'tr_98f4a21c7e0b41d2',
                          displayName: 'reconcileLedgerFlow',
                          status: 'OK',
                          latencyMs: 412,
                          spans: {
                            '/flow/reconcileLedgerFlow': {
                              input: { accountId: 'ACC-01', amounts: [100.25, -20.1, 5.0] },
                              output: 'Account ACC-01 reconciled. Signed Net Total: 85.15',
                            },
                            '/tool/sumLedgerTool': {
                              input: { amounts: [100.25, -20.1, 5.0] },
                              output: 85.15,
                            },
                            '/mcp/my-host:tool/dart/analyze_files': {
                              server: 'dart (dart mcp-server)',
                              status: '0 issues found',
                            },
                          },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </section>

            {/* Genkit 1.0 vs Pre-1.0 Common Errors & Migration Reference Table */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Genkit 1.0 Troubleshooting &amp; Breaking API Reference (`references/common-errors.md`)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mandatory first-step lookup table before debugging ValidationError, type errors, or
                  pre-1.0 training data hallucinations.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-3">SDK</th>
                      <th className="py-2.5 px-3">Deprecated Pre-1.0 Pattern (Do Not Use)</th>
                      <th className="py-2.5 px-3">Genkit 1.0 Replacement</th>
                      <th className="py-2.5 px-3">Why It Changed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {V1_MIGRATION_RULES.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/50">
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {row.language}
                        </td>
                        <td className="py-3 px-3 font-mono text-red-300">
                          {row.deprecatedPattern}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-300">
                          {row.v1Replacement}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mcp' && (
          <div className="space-y-6">
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                mcpErrors.length === 0
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-red-950/25 border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {mcpErrors.length === 0 ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {mcpErrors.length === 0
                      ? `MCP Server Registry Valid (${mcpServerNames.length} configured)`
                      : `MCP Configuration Error (${mcpErrors.length})`}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Active `mcpServers` configuration injected into OpenCode (`opencode.json` / `mcp.json`), Genkit `defineMcpHost`, and Codex executor workspaces.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mcpSaveStatus && (
                  <span className="text-xs font-mono text-emerald-300">{mcpSaveStatus}</span>
                )}
                <button
                  onClick={() => handleSyncMcpToHarness(DART_MCP_JSON)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition cursor-pointer"
                >
                  Reset to Dart MCP Default
                </button>
              </div>
            </div>

            {mcpErrors.length > 0 && (
              <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4">
                <ul className="space-y-1 text-xs font-mono text-red-300">
                  {mcpErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Registered MCP Servers */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Registered MCP Servers (`mcpServers`)
                  </h3>

                  <div className="space-y-2.5">
                    {Object.entries(parsedMcpServers).map(([name, spec]) => (
                      <div
                        key={name}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-white">{name}</span>
                          <span className="text-slate-400">stdio transport</span>
                        </div>
                        <div className="text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                          $ {spec.command} {(spec.args ?? []).join(' ')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>command: "{spec.command}"</span>
                          <span>args: {JSON.stringify(spec.args ?? [])}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Another MCP Server */}
                <form
                  onSubmit={handleAddMcpServer}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Register Additional MCP Server
                  </h3>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Server Key</label>
                    <input
                      type="text"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      placeholder="e.g. dart, filesystem, git"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Command</label>
                      <input
                        type="text"
                        value={newMcpCommand}
                        onChange={(e) => setNewMcpCommand(e.target.value)}
                        placeholder="dart"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Args (space-separated)
                      </label>
                      <input
                        type="text"
                        value={newMcpArgs}
                        onChange={(e) => setNewMcpArgs(e.target.value)}
                        placeholder="mcp-server"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Add to mcpServers &amp; Sync to Harness
                  </button>
                </form>
              </div>

              {/* Right Column: Raw mcp.json Editor */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-blue-300">
                      mcp.json (`mcpServers` configuration)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Validated by `checkMcpServers()` and mounted into the Harness² editable
                      surface.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSyncMcpToHarness(mcpJsonText)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Save &amp; Sync to Harness Tree
                  </button>
                </div>

                <textarea
                  value={mcpJsonText}
                  onChange={(e) => handleSyncMcpToHarness(e.target.value)}
                  rows={14}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recursion' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="lg:col-span-7 flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Recursion Budget (--k)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[1, 2, 3, 4].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          setKBudget(val);
                          handleRunSweep(val, modeFilter);
                        }}
                        className={`px-3 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                          kBudget === val
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        k={val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Recursion Mode (--mode)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(['both', 'parallel', 'sequential'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setModeFilter(m);
                          handleRunSweep(kBudget, m);
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium capitalize transition cursor-pointer ${
                          modeFilter === m
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleRunSweep(kBudget, modeFilter)}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isRunning ? 'Executing...' : 'Run harness2-demo'}
                  </button>
                </div>
              </div>

              {/* Sweep Metrics Summary */}
              <div className="lg:col-span-5 grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
                <div>
                  <div className="text-[11px] text-slate-400">Tasks Done</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {sweepResult.done}/{sweepResult.tasks.length}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Rollouts</div>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    {sweepResult.executionCount}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Editor Calls</div>
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {sweepResult.editorCalls}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Cost Identity</div>
                  <div className="text-xs font-mono text-slate-200 mt-1">
                    4k={4 * sweepResult.k} · 3k={3 * sweepResult.k}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Stream & Detailed Trace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-slate-300">
                      Domain Task Stream (accounting)
                    </h2>
                    <button
                      onClick={handleResetTasks}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sweepResult.tasks.map((t, index) => {
                      const isSelected = t.taskId === currentTaskResult?.taskId;
                      return (
                        <button
                          key={t.taskId}
                          onClick={() => setSelectedTaskId(t.taskId)}
                          className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500/60'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-semibold text-white">
                              #{index + 1} {t.taskId}
                            </span>
                            <span className="text-emerald-400">{t.status}</span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="text-red-300">Base: {t.basePositiveOnlyTotal}</div>
                            <div className="text-emerald-300">Adapted: {t.expectedSignedTotal}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form
                  onSubmit={handleAddTask}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <h3 className="text-xs font-semibold text-slate-300">
                    Add Ledger Task to Stream
                  </h3>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Task ID</label>
                    <input
                      type="text"
                      value={newTaskId}
                      onChange={(e) => setNewTaskId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Signed Ledger Amounts (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTaskAmounts}
                      onChange={(e) => setNewTaskAmounts(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 border border-slate-700 transition cursor-pointer"
                  >
                    Append Task &amp; Re-run Stream
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {currentTaskResult && currentModeRecord && (
                  <>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <span className="font-bold text-white">{currentTaskResult.taskId}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            demo-oc-{currentModeRecord.mode}
                            {currentModeRecord.k}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {currentModeRecord.ledger.rollouts.length}/
                            {currentModeRecord.ledger.expectedRollouts} rollouts
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {Object.keys(currentTaskResult.modes).map((mKey) => {
                          const m = mKey as 'agg' | 'seq';
                          return (
                            <button
                              key={m}
                              onClick={() => setSelectedModeView(m)}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                                selectedModeView === m
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {m === 'agg' ? 'Parallel (agg)' : 'Sequential (seq)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300">
                        Propose–Probe–Compose Stages ({currentModeRecord.stages.length} sessions)
                      </h3>
                      <div className="space-y-2.5">
                        {currentModeRecord.stages.map((stage) => {
                          const rollout = currentModeRecord.rollouts[stage.label];
                          return (
                            <div
                              key={stage.label}
                              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span>
                                  <strong className="text-white">{stage.label}</strong> ·{' '}
                                  {stage.dim}
                                </span>
                                {rollout && (
                                  <span className="text-emerald-400">
                                    Probe Output: {rollout.deliverable.trim()}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300">{stage.notes}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Blind Candidate Selection
                        </h3>
                        <p className="text-xs font-mono text-slate-300">
                          Chosen: {currentModeRecord.selection.chosenId} (
                          {currentModeRecord.selection.chosenLabel})
                        </p>
                        <p className="text-xs text-slate-400">{currentModeRecord.selection.why}</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          Experience Library Reflection
                        </h3>
                        <p className="text-xs text-emerald-300">
                          {currentModeRecord.selection.experience.lesson}
                        </p>
                        <p className="text-xs text-slate-400">
                          {currentModeRecord.selection.experience.evidence}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'surface' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSubstrate('oc')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      substrate === 'oc'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OpenCode (oc)
                  </button>
                  <button
                    onClick={() => setSubstrate('cx')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      substrate === 'cx'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Codex (cx)
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(PRESET_TREES).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => handleLoadPreset(key)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoRepairTriggers}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Run autotrigger() Repair
                </button>
                <button
                  onClick={() => handleDownloadHarnessConfig(editorTree, substrate)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Harness Configuration
                </button>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                census.valid
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-red-950/25 border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {census.valid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {census.valid
                      ? 'Harness Tree Passes Surface Validation'
                      : `Validation Rejected (${census.errors.length} problem${
                          census.errors.length === 1 ? '' : 's'
                        })`}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Always-On Budget: {census.alwaysOnChars.toLocaleString()} /{' '}
                    {census.alwaysOnMax.toLocaleString()} chars · {census.skills} skills ·{' '}
                    {census.subAgents} subagents · {census.scripts} scripts · MCP Servers:{' '}
                    {census.mcpServers.join(', ') || 'none'}
                  </p>
                </div>
              </div>

              {census.errors.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-red-500/20 pt-3">
                  {census.errors.map((err, i) => (
                    <li key={i} className="text-xs font-mono text-red-300">
                      • {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  Harness Component Files ({Object.keys(editorTree).length})
                </h3>

                <div className="space-y-1">
                  {Object.keys(editorTree)
                    .sort()
                    .map((rel) => (
                      <div
                        key={rel}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono cursor-pointer transition ${
                          selectedFile === rel
                            ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                        onClick={() => setSelectedFile(rel)}
                      >
                        <span className="truncate">{rel}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = { ...editorTree };
                            delete next[rel];
                            setEditorTree(next);
                            if (selectedFile === rel) {
                              setSelectedFile(Object.keys(next)[0] ?? '');
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 ml-2 text-[11px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>

                <form
                  onSubmit={handleAddComponentFile}
                  className="pt-2 border-t border-slate-800 space-y-2"
                >
                  <label className="block text-[11px] text-slate-400">
                    Add Component File (e.g. `skills/audit/SKILL.md`)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFilePath}
                      onChange={(e) => setNewFilePath(e.target.value)}
                      placeholder="skills/new_skill/SKILL.md"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <span className="font-mono text-xs font-semibold text-blue-300">
                    {selectedFile || 'Select a file'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {(editorTree[selectedFile] ?? '').length} chars
                  </span>
                </div>
                {selectedFile ? (
                  <textarea
                    value={editorTree[selectedFile] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditorTree((prev) => ({
                        ...prev,
                        [selectedFile]: val,
                      }));
                      if (selectedFile === 'mcp.json') {
                        setMcpJsonText(val);
                      }
                    }}
                    rows={16}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <div className="text-xs text-slate-500 py-12 text-center">
                    Select or create a file in the harness tree to edit its contents.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Benchmark Evaluation Suites (WorkBuddy-Bench, JobBench, LAB)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Across three professional benchmarks, a single Harness² step (`k=1`) improves over
                  base harnesses by up to +11.5 pts on WorkBuddy-Bench, +4.5 pts on JobBench, and
                  +11.8 percentage points on LAB partial pass rate.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-3">Benchmark</th>
                      <th className="py-2.5 px-3">Model / Substrate</th>
                      <th className="py-2.5 px-3">Base</th>
                      <th className="py-2.5 px-3">Parallel (k=1)</th>
                      <th className="py-2.5 px-3">Sequential (k=1)</th>
                      <th className="py-2.5 px-3">Parallel (k=2)</th>
                      <th className="py-2.5 px-3">Sequential (k=2)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono">
                    {BENCHMARK_RESULTS.map((row: BenchmarkResultRow) => (
                      <tr key={row.benchmark} className="hover:bg-slate-950/50">
                        <td className="py-3 px-3 font-sans font-semibold text-white">
                          {row.benchmarkTitle}
                          <div className="text-[11px] font-normal text-slate-400">
                            {row.metricUnit}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {row.model} ({row.substrate})
                        </td>
                        <td className="py-3 px-3 text-slate-400">{row.baseScore.toFixed(1)}%</td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          {row.parallelK1Score.toFixed(1)}% (+
                          {(row.parallelK1Score - row.baseScore).toFixed(1)})
                        </td>
                        <td className="py-3 px-3 text-blue-400">
                          {row.sequentialK1Score.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-emerald-300 font-bold">
                          {row.parallelK2Score.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-blue-300 font-bold">
                          {row.sequentialK2Score.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Benchmark CLI Workflow Generator
              </h3>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Benchmark</label>
                  <select
                    value={cliBench}
                    onChange={(e) => setCliBench(e.target.value as 'lab' | 'jb' | 'wb')}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="lab">LAB (Legal Agent Benchmark)</option>
                    <option value="jb">JobBench (Professional Work)</option>
                    <option value="wb">WorkBuddy-Bench (Office / Web / Code)</option>
                  </select>
                </div>

                {cliBench === 'wb' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      WorkBuddy Subset
                    </label>
                    <select
                      value={cliSubset}
                      onChange={(e) => setCliSubset(e.target.value as 'office' | 'web' | 'code')}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="office">office</option>
                      <option value="web">web</option>
                      <option value="code">code</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Executor Substrate
                  </label>
                  <select
                    value={cliSubstrate}
                    onChange={(e) => setCliSubstrate(e.target.value as 'oc' | 'cx')}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="oc">OpenCode (default)</option>
                    <option value="cx">Codex (--substrate cx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Recursion Mode</label>
                  <select
                    value={cliMode}
                    onChange={(e) => setCliMode(e.target.value as 'parallel' | 'sequential')}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="parallel">parallel</option>
                    <option value="sequential">sequential</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Budget (--k)</label>
                  <select
                    value={cliK}
                    onChange={(e) => setCliK(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        k={n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                {[
                  `harness2-setup ${cliBench}${cliBench === 'wb' ? ` --subset ${cliSubset}` : ''}${
                    cliSubstrate === 'cx' ? ' --substrate cx' : ''
                  }`,
                  `harness2-check --bench ${cliBench}${
                    cliBench === 'wb' ? ` --subset ${cliSubset}` : ''
                  }${cliSubstrate === 'cx' ? ' --substrate cx' : ''}`,
                  `harness2 --bench ${cliBench}${
                    cliBench === 'wb' ? ` --subset ${cliSubset}` : ''
                  }${cliSubstrate === 'cx' ? ' --substrate cx' : ''} --k ${cliK} --mode ${cliMode}`,
                  `harness2-judge --bench ${cliBench}${
                    cliBench === 'wb' ? ` --subset ${cliSubset}` : ''
                  }${cliSubstrate === 'cx' ? ' --substrate cx' : ''} --k ${cliK} --mode ${cliMode}`,
                  `harness2-report --bench ${cliBench}${
                    cliBench === 'wb' ? ` --subset ${cliSubset}` : ''
                  }${cliSubstrate === 'cx' ? ' --substrate cx' : ''} --k ${cliK} --mode ${cliMode}`,
                ].join('\n')}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

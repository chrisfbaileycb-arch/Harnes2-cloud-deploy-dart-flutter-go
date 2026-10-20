import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { makeOwnerGate } from './owner-gate';
import fs from 'node:fs';
import {
  BENCHMARK_RESULTS,
  checkMcpServers,
  CODEX_SURFACE,
  DEFAULT_DEMO_TASKS,
  DEFAULT_MCP_CONFIG,
  DemoRunSweepResult,
  LedgerTaskSpec,
  McpConfig,
  OPENCODE_SURFACE,
  runDeterministicDemo,
  Tree,
  validateTree,
} from './src/core/harnessEngine';
import {
  GcpDeployTarget,
  INITIAL_MANAGED_DEPLOYMENTS,
  ManagedAgentDeployment,
} from './src/core/gcpAgentsCliManual';
import { synthesizeHarnessFromInput } from './src/core/harnessArchitectAgent';
import {
  executeByocWithSkills,
  getRegisteredSkillsCatalog,
  handleMcpJsonRpc,
} from './src/core/agentSkillConnector';
import {
  ATTACHED_OC_HARNESS_CONFIGURATION,
  HarnessConfigurationProfile,
  INITIAL_HARNESS_CONFIGURATION_PROFILES,
  parseAndValidateHarnessConfigJson,
} from './src/core/harnessConfigurationManager';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ status: 'ok', providerKeys: 'browser-only' }));
  if (process.env.NODE_ENV === 'production' || process.env.OWNER_PASSWORD) {
    app.use(makeOwnerGate(process.env.OWNER_PASSWORD || ''));
  }

  app.use(express.json({ limit: '10mb' }));

  // Serve attached AI Studio assets (/assets/aistudio/*) and repository assets (/assets/*)
  app.use(
    '/assets/aistudio',
    express.static(path.resolve(process.cwd(), 'public/assets/aistudio'))
  );
  app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));

  // In-memory state store
  const customTasksStore: LedgerTaskSpec[] = [...DEFAULT_DEMO_TASKS];
  const sweepRunsStore = new Map<string, DemoRunSweepResult>();
  const harnessProfilesStore: HarnessConfigurationProfile[] = structuredClone(
    INITIAL_HARNESS_CONFIGURATION_PROFILES
  );
  let activeHarnessProfileId = harnessProfilesStore[0]?.id ?? 'attached-oc-46a97fbf';
  let mcpConfigStore: McpConfig = (() => {
    try {
      return JSON.parse(ATTACHED_OC_HARNESS_CONFIGURATION.editorTree['mcp.json']) as McpConfig;
    } catch {
      return structuredClone(DEFAULT_MCP_CONFIG);
    }
  })();
  const gcpDeploymentsStore: ManagedAgentDeployment[] = structuredClone(
    INITIAL_MANAGED_DEPLOYMENTS
  );

  const initialDemo = runDeterministicDemo(2, 'both', customTasksStore);
  sweepRunsStore.set('latest', initialDemo);

  const dataDir = process.env.DATA_DIR || path.resolve('data');
  fs.mkdirSync(dataDir, { recursive: true });
  const stateFile = path.join(dataDir, 'workspace.json');
  if (fs.existsSync(stateFile)) {
    const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (Array.isArray(saved.tasks)) customTasksStore.splice(0, customTasksStore.length, ...saved.tasks);
    if (Array.isArray(saved.profiles) && saved.profiles.length) harnessProfilesStore.splice(0, harnessProfilesStore.length, ...saved.profiles);
    activeHarnessProfileId = saved.activeProfileId || activeHarnessProfileId;
    mcpConfigStore = saved.mcpConfig || mcpConfigStore;
    sweepRunsStore.set('latest', runDeterministicDemo(2, 'both', customTasksStore));
  }
  app.use((req, res, next) => {
    // Write before responding so a successful mutation survives process restart.
    const send = res.json.bind(res);
    res.json = (body) => {
      if (req.method === 'POST' && res.statusCode < 400) {
        fs.writeFileSync(stateFile + '.tmp', JSON.stringify({ tasks: customTasksStore, profiles: harnessProfilesStore, activeProfileId: activeHarnessProfileId, mcpConfig: mcpConfigStore }), { mode: 0o600 });
        fs.renameSync(stateFile + '.tmp', stateFile);
      }
      return send(body);
    };
    next();
  });

  app.get('/api/state', (_req, res) => {
    const activeProfile =
      harnessProfilesStore.find((p) => p.id === activeHarnessProfileId) ?? harnessProfilesStore[0];
    res.json({
      latestRun: sweepRunsStore.get('latest'),
      tasks: customTasksStore,
      benchmarks: BENCHMARK_RESULTS,
      mcpConfig: mcpConfigStore,
      gcpDeployments: gcpDeploymentsStore,
      activeHarnessProfile: activeProfile,
      harnessProfiles: harnessProfilesStore,
      surfaces: {
        opencode: OPENCODE_SURFACE,
        codex: CODEX_SURFACE,
      },
    });
  });

  app.get('/api/gcp-deployments', (_req, res) => {
    res.json({ deployments: gcpDeploymentsStore });
  });

  app.post('/api/gcp-deployments', (_req, res) => {
    res.status(501).json({ error: 'Google Cloud provisioning is not connected. Use the generated commands in your own cloud project. Displayed fleet data is sample data.' });
  });

  app.get('/api/mcp', (_req, res) => {
    res.json(mcpConfigStore);
  });

  app.post('/api/mcp', (req, res) => {
    const raw =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}, null, 2);
    const errors: string[] = [];
    const serverNames = checkMcpServers('mcp.json', raw, errors);
    if (errors.length > 0) {
      res.status(400).json({ valid: false, errors, serverNames });
      return;
    }
    mcpConfigStore = JSON.parse(raw) as McpConfig;
    res.json({ valid: true, errors: [], serverNames, mcpConfig: mcpConfigStore });
  });

  app.post('/api/demo/run', (req, res) => {
    const k = Math.max(0, Math.min(3, Math.floor(Number(req.body?.k) || 0)));
    const mode =
      req.body?.mode === 'parallel' || req.body?.mode === 'sequential' || req.body?.mode === 'both'
        ? req.body.mode
        : 'both';
    const result = runDeterministicDemo(k, mode, customTasksStore);
    sweepRunsStore.set('latest', result);
    res.json(result);
  });

  app.post('/api/tasks', (req, res) => {
    const { id, domain, amounts } = req.body ?? {};
    if (!id || typeof id !== 'string' || !Array.isArray(amounts) || amounts.length === 0) {
      res.status(400).json({ error: 'Task id and non-empty amounts array are required' });
      return;
    }
    const cleanId = id.trim().replace(/[^A-Za-z0-9_-]/g, '-');
    const numericAmounts = amounts.map((n: unknown) => Number(n)).filter((n: number) => !Number.isNaN(n));
    if (numericAmounts.length === 0) {
      res.status(400).json({ error: 'At least one valid numeric amount is required' });
      return;
    }
    const existingIdx = customTasksStore.findIndex((t) => t.id === cleanId);
    const newTask: LedgerTaskSpec = {
      id: cleanId,
      domain: typeof domain === 'string' && domain.trim() ? domain.trim() : 'accounting',
      prompt: 'Sum every signed amount in ledger.csv. Return Total: with two decimal places.',
      amounts: numericAmounts,
    };
    if (existingIdx >= 0) {
      customTasksStore[existingIdx] = newTask;
    } else {
      customTasksStore.push(newTask);
    }
    const updatedRun = runDeterministicDemo(
      sweepRunsStore.get('latest')?.k ?? 2,
      'both',
      customTasksStore
    );
    sweepRunsStore.set('latest', updatedRun);
    res.json({ tasks: customTasksStore, latestRun: updatedRun });
  });

  app.post('/api/tasks/reset', (_req, res) => {
    customTasksStore.length = 0;
    customTasksStore.push(...DEFAULT_DEMO_TASKS);
    const updatedRun = runDeterministicDemo(2, 'both', customTasksStore);
    sweepRunsStore.set('latest', updatedRun);
    res.json({ tasks: customTasksStore, latestRun: updatedRun });
  });

  app.post('/api/tree/validate', (req, res) => {
    const substrate = req.body?.substrate === 'cx' ? CODEX_SURFACE : OPENCODE_SURFACE;
    const tree: Tree = req.body?.tree && typeof req.body.tree === 'object' ? { ...req.body.tree } : {};
    const autoRepairTriggers = Boolean(req.body?.autoRepairTriggers);
    const allowSubagents = req.body?.allowSubagents !== false;
    const census = validateTree(substrate, tree, { allowSubagents, autoRepairTriggers });
    res.json({ census, tree });
  });

  app.post('/api/harness-architect/synthesize', async (req, res) => {
    const { title, rawInstructions, videoTranscript, preferredSubstrate, videoBase64, videoMimeType } =
      req.body ?? {};
    const baseResult = synthesizeHarnessFromInput({
      title: typeof title === 'string' && title.trim() ? title.trim() : undefined,
      rawInstructions: String(rawInstructions ?? ''),
      videoTranscript: typeof videoTranscript === 'string' ? videoTranscript : undefined,
      preferredSubstrate: preferredSubstrate === 'cx' ? 'cx' : 'oc',
    });

    res.json(baseResult);
  });

  // 1. Agent Skill REST API Connector: List all skills
  app.get('/api/agent-connector/skills', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const catalog = getRegisteredSkillsCatalog();
    const filtered = category
      ? catalog.filter((s) => s.category.toLowerCase().includes(category.toLowerCase()))
      : catalog;
    res.json({
      count: filtered.length,
      skills: filtered,
    });
  });

  // 2. Agent Skill REST API Connector: Fetch a single skill specification & verifier script
  app.get('/api/agent-connector/skills/:skillId', (req, res) => {
    const { skillId } = req.params;
    const catalog = getRegisteredSkillsCatalog();
    const found = catalog.find((s) => s.id === skillId || s.name === skillId);
    if (!found) {
      res.status(404).json({
        error: `Skill '${skillId}' not found`,
        availableSkillIds: catalog.map((s) => s.id),
      });
      return;
    }
    res.json(found);
  });

  // 3. Agent Skill REST API & BYOC Execution Endpoint
  app.post('/api/agent-connector/execute', (req, res) => {
    const body = req.body ?? {};
    const language =
      body.language === 'dart' || body.language === 'python' ? body.language : 'typescript';
    const code = String(body.code ?? 'return { status: "ok", input };');
    const inputJson =
      typeof body.inputJson === 'string'
        ? body.inputJson
        : JSON.stringify(body.input ?? {}, null, 2);
    const skillIds = Array.isArray(body.skillIds)
      ? body.skillIds.map(String)
      : ['developing_bazel', 'developing_genkit_dart', 'google_agents_cli_deploy'];
    const targetHarnessPath =
      typeof body.targetHarnessPath === 'string' ? body.targetHarnessPath : undefined;

    const result = executeByocWithSkills({
      code,
      language,
      inputJson,
      skillIds,
      targetHarnessPath,
    });
    res.json(result);
  });

  // 4. Model Context Protocol (MCP) JSON-RPC 2.0 Connector Endpoint
  app.post('/api/mcp/rpc', (req, res) => {
    const activeProfile =
      harnessProfilesStore.find((p) => p.id === activeHarnessProfileId) ?? harnessProfilesStore[0];
    const rpcResponse = handleMcpJsonRpc(req.body ?? {}, activeProfile?.config.editorTree);
    res.json(rpcResponse);
  });

  // 5. Harness Configuration Registry & Import Endpoints (harness2.v1)
  app.get('/api/harness-configurations', (_req, res) => {
    const activeProfile =
      harnessProfilesStore.find((p) => p.id === activeHarnessProfileId) ?? harnessProfilesStore[0];
    res.json({
      activeProfileId: activeHarnessProfileId,
      activeProfile,
      profiles: harnessProfilesStore,
    });
  });

  app.post('/api/harness-configurations/import', (req, res) => {
    const body = req.body ?? {};
    const name = String(body.name || `harness-configuration-${Date.now()}.json`).trim();
    const rawJson =
      typeof body.rawJson === 'string' ? body.rawJson : JSON.stringify(body.config ?? body);
    const fallbackSubstrate = body.substrate === 'cx' ? 'cx' : 'oc';

    const parsed = parseAndValidateHarnessConfigJson(rawJson, fallbackSubstrate);
    if (!parsed.ok || !parsed.config) {
      res.status(400).json({
        ok: false,
        error: parsed.error ?? 'Failed to validate harness configuration JSON',
      });
      return;
    }

    const newProfile: HarnessConfigurationProfile = {
      id: `cfg-${Date.now()}`,
      name,
      badge: `${parsed.config.substrate.toUpperCase()} · ${parsed.config.validationCensus.nFiles} files`,
      sourceAssetPath: parsed.config.sourceAssetPath,
      config: parsed.config,
    };

    harnessProfilesStore.unshift(newProfile);
    activeHarnessProfileId = newProfile.id;

    if (typeof parsed.config.editorTree['mcp.json'] === 'string') {
      try {
        mcpConfigStore = JSON.parse(parsed.config.editorTree['mcp.json']) as McpConfig;
      } catch {
        // Keep existing mcpConfigStore if custom mcp.json is invalid
      }
    }

    res.json({
      ok: true,
      activeProfileId: activeHarnessProfileId,
      profile: newProfile,
      profiles: harnessProfilesStore,
    });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Harness² server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export type Tree = Record<string, string>;

export interface McpServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerEntry>;
}

export const DEFAULT_MCP_CONFIG: McpConfig = {
  mcpServers: {
    dart: {
      command: 'dart',
      args: ['mcp-server'],
    },
  },
};

export interface SurfaceSpec {
  name: 'opencode' | 'codex';
  substrateCode: 'oc' | 'cx';
  alwaysOn: readonly string[];
  alwaysOnMax: number;
  alwaysOnCapReason: string;
  skillDir: string;
  skillNameRule: 'must_match' | 'overrides_dir';
  triggerHint: string;
  autotriggerFile: string;
  triggerLine: string;
  subagentRequiresMode: boolean;
  pluginDir: string | null;
  hooksFile: string | null;
  mcpFile: string;
  hookEvents: readonly string[];
  compileSkillScripts: boolean;
  rejectEmptyAlwaysOn: boolean;
}

export const OPENCODE_SURFACE: SurfaceSpec = {
  name: 'opencode',
  substrateCode: 'oc',
  alwaysOn: [
    'systemprompt.md',
    'guardrails.md',
    'LongTermMEMORY.md',
    'tool_descriptions/tool_guidance.md',
  ],
  alwaysOnMax: 24000,
  alwaysOnCapReason: "every token here competes with the agent's own output budget",
  skillDir: 'skills',
  skillNameRule: 'must_match',
  triggerHint:
    'Fix it by adding a trigger line naming `{name}` to systemprompt.md or guardrails.md, e.g. "When <the situation this skill handles>, load the `{name}` skill."',
  autotriggerFile: 'guardrails.md',
  triggerLine: '- When {desc}, load the `{name}` skill.\n',
  subagentRequiresMode: true,
  pluginDir: 'plugin',
  hooksFile: null,
  mcpFile: 'mcp.json',
  hookEvents: [],
  compileSkillScripts: false,
  rejectEmptyAlwaysOn: false,
};

export const CODEX_SURFACE: SurfaceSpec = {
  name: 'codex',
  substrateCode: 'cx',
  alwaysOn: ['AGENTS.md'],
  alwaysOnMax: 8000,
  alwaysOnCapReason:
    'AGENTS.md is injected whole into EVERY turn, and codex additionally truncates it silently at 32,768 bytes',
  skillDir: '.agents/skills',
  skillNameRule: 'overrides_dir',
  triggerHint:
    'Fix it by adding a trigger line naming `{name}` to AGENTS.md, e.g. "When <the situation this skill handles>, read .agents/skills/{name}/SKILL.md and follow it."',
  autotriggerFile: 'AGENTS.md',
  triggerLine: '- When {desc}, read .agents/skills/{name}/SKILL.md and follow it.\n',
  subagentRequiresMode: false,
  pluginDir: null,
  hooksFile: '.codex/hooks.json',
  mcpFile: 'mcp.json',
  hookEvents: [
    'PreToolUse',
    'PostToolUse',
    'PermissionRequest',
    'PreCompact',
    'PostCompact',
    'SessionStart',
    'SubagentStart',
    'SubagentStop',
    'UserPromptSubmit',
    'Stop',
  ],
  compileSkillScripts: true,
  rejectEmptyAlwaysOn: true,
};

export const RESERVED_SCRIPTS = new Set(['read_doc.py', 'pack.py', 'unpack.py']);

const NAME_PAT = '[a-z0-9][a-z0-9_\\-]*';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeRel(rel: string): string {
  let r = String(rel).trim().replace(/\\/g, '/');
  if (r.startsWith('/') || r.split('/').includes('..')) {
    throw new Error(`path escapes the harness: ${rel}`);
  }
  while (r.startsWith('./')) {
    r = r.slice(2);
  }
  return r.replace(/^\/+|\/+$/g, '');
}

export function isAllowed(surface: SurfaceSpec, rel: string): boolean {
  try {
    rel = normalizeRel(rel);
  } catch {
    return false;
  }
  if (surface.alwaysOn.includes(rel)) return true;
  if (surface.hooksFile && rel === surface.hooksFile) return true;
  if (surface.mcpFile && rel === surface.mcpFile) return true;
  const sd = escapeRegex(surface.skillDir);
  const skillRe = new RegExp(`^${sd}/(${NAME_PAT})/SKILL\\.md$`);
  const skillScriptRe = new RegExp(`^${sd}/${NAME_PAT}/scripts/[A-Za-z0-9_.\\-]+$`);
  const subagentRe = new RegExp(`^sub_agents/(${NAME_PAT})/AGENT\\.md$`);
  const scriptRe = /^scripts\/[a-z0-9_][a-z0-9_]*\.py$/;
  if (
    skillRe.test(rel) ||
    skillScriptRe.test(rel) ||
    subagentRe.test(rel) ||
    scriptRe.test(rel)
  ) {
    return true;
  }
  if (surface.pluginDir) {
    const pluginRe = new RegExp(`^${escapeRegex(surface.pluginDir)}/(${NAME_PAT})\\.ts$`);
    return pluginRe.test(rel);
  }
  return false;
}

export function skillNames(surface: SurfaceSpec, tree: Tree): string[] {
  const sd = escapeRegex(surface.skillDir);
  const rx = new RegExp(`^${sd}/(${NAME_PAT})/SKILL\\.md$`);
  const names = new Set<string>();
  for (const rel of Object.keys(tree)) {
    const m = rx.exec(rel);
    if (m) names.add(m[1]);
  }
  return Array.from(names).sort();
}

export function subagentNames(tree: Tree): string[] {
  const rx = new RegExp(`^sub_agents/(${NAME_PAT})/AGENT\\.md$`);
  const names = new Set<string>();
  for (const rel of Object.keys(tree)) {
    const m = rx.exec(rel);
    if (m) names.add(m[1]);
  }
  return Array.from(names).sort();
}

export function alwaysOnText(surface: SurfaceSpec, tree: Tree): string {
  return surface.alwaysOn.map((a) => tree[a] ?? '').join('\n\n');
}

export function autotrigger(
  surface: SurfaceSpec,
  tree: Tree,
  alwaysOnMax?: number
): string[] {
  const cap = alwaysOnMax ?? surface.alwaysOnMax;
  let body = alwaysOnText(surface, tree);
  const fixed: string[] = [];
  for (const name of skillNames(surface, tree)) {
    if (body.includes(name)) continue;
    const fm = (tree[`${surface.skillDir}/${name}/SKILL.md`] ?? '').slice(0, 600);
    const m = /^description:\s*(.+)$/m.exec(fm);
    const desc = m ? m[1].trim().replace(/\.$/, '') : `the ${name} workflow applies`;
    const line = surface.triggerLine
      .replace('{name}', name)
      .replace('{desc}', desc);
    const cur = tree[surface.autotriggerFile] ?? '';
    if (alwaysOnText(surface, tree).length + line.length + 2 > cap) continue;
    tree[surface.autotriggerFile] = cur.trim()
      ? `${cur.replace(/\s+$/, '')}\n${line}`
      : line;
    body = alwaysOnText(surface, tree);
    fixed.push(name);
  }
  return fixed;
}

export function checkHooks(surface: SurfaceSpec, src: string, errs: string[]): void {
  const hf = surface.hooksFile;
  if (!hf) return;
  let doc: unknown;
  try {
    doc = JSON.parse(src);
  } catch (e) {
    errs.push(`${hf} is not valid JSON: ${(e as Error).message}`);
    return;
  }
  const hooks =
    doc && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>).hooks
      : null;
  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks) || Object.keys(hooks).length === 0) {
    errs.push(`${hf} needs a top-level {"hooks": {"<Event>": [...]}} object`);
    return;
  }
  for (const [event, entries] of Object.entries(hooks as Record<string, unknown>)) {
    if (!surface.hookEvents.includes(event)) {
      errs.push(
        `${hf}: unknown event '${event}'; the framework dispatches ${[...surface.hookEvents].sort().join(', ')} (PascalCase)`
      );
      continue;
    }
    if (!Array.isArray(entries)) {
      errs.push(`${hf}: ${event} must map to a LIST of matcher entries`);
      continue;
    }
    entries.forEach((entry, i) => {
      if (
        !entry ||
        typeof entry !== 'object' ||
        !Array.isArray((entry as Record<string, unknown>).hooks)
      ) {
        errs.push(`${hf}: ${event}[${i}] needs a \`hooks\` list`);
        return;
      }
      for (const h of (entry as { hooks: unknown[] }).hooks) {
        if (!h || typeof h !== 'object' || (h as Record<string, unknown>).type !== 'command') {
          errs.push(
            `${hf}: ${event}[${i}] hook type must be "command" — async/prompt/agent hooks are skipped as 'not supported yet'`
          );
        } else if (!String((h as Record<string, unknown>).command ?? '').trim()) {
          errs.push(`${hf}: ${event}[${i}] has an empty \`command\``);
        }
      }
    });
  }
}

export function checkMcpServers(mcpFile: string, src: string, errs: string[]): string[] {
  let doc: unknown;
  try {
    doc = JSON.parse(src);
  } catch (e) {
    errs.push(`${mcpFile} is not valid JSON: ${(e as Error).message}`);
    return [];
  }
  const servers =
    doc && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>).mcpServers
      : null;
  if (!servers || typeof servers !== 'object' || Array.isArray(servers) || Object.keys(servers).length === 0) {
    errs.push(`${mcpFile} needs a top-level {"mcpServers": {"<name>": {"command": "...", "args": [...]}}} object`);
    return [];
  }
  const validNames: string[] = [];
  for (const [serverName, spec] of Object.entries(servers as Record<string, unknown>)) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
      errs.push(`${mcpFile}: mcpServers.${serverName} must be an object`);
      continue;
    }
    const cmd = (spec as Record<string, unknown>).command;
    const args = (spec as Record<string, unknown>).args;
    if (typeof cmd !== 'string' || !cmd.trim()) {
      errs.push(`${mcpFile}: mcpServers.${serverName}.command must be a non-empty string`);
      continue;
    }
    if (args !== undefined && (!Array.isArray(args) || args.some((a) => typeof a !== 'string'))) {
      errs.push(`${mcpFile}: mcpServers.${serverName}.args must be an array of strings`);
      continue;
    }
    validNames.push(serverName);
  }
  return validNames;
}

export interface ValidationCensus {
  valid: boolean;
  errors: string[];
  repairedSkills: string[];
  alwaysOnChars: number;
  alwaysOnMax: number;
  nFiles: number;
  skills: number;
  subAgents: number;
  scripts: number;
  plugins: number;
  hooks: number;
  mcpServers: string[];
  offSurfacePaths: string[];
}

export function validateTree(
  surface: SurfaceSpec,
  inputTree: Tree,
  options?: { allowSubagents?: boolean; autoRepairTriggers?: boolean }
): ValidationCensus {
  const allowSubagents = options?.allowSubagents ?? true;
  const tree: Tree = { ...inputTree };
  const offSurfacePaths: string[] = [];
  for (const rel of Object.keys(tree)) {
    if (!isAllowed(surface, rel)) {
      offSurfacePaths.push(rel);
    }
  }

  const repairedSkills = options?.autoRepairTriggers ? autotrigger(surface, tree) : [];
  const errs: string[] = [];
  if (offSurfacePaths.length > 0) {
    errs.push(
      `these files are off the editable surface and were not applied: ${offSurfacePaths.slice(0, 6).join(', ')}`
    );
  }

  const cap = surface.alwaysOnMax;
  const body = alwaysOnText(surface, tree);
  if (body.length > cap) {
    errs.push(
      `always-on content is ${body.length} chars, over the ${cap} cap; ${surface.alwaysOnCapReason}`
    );
  }
  if (surface.rejectEmptyAlwaysOn && !body.trim()) {
    errs.push(
      `${surface.alwaysOn[0]} is empty — it is the only always-on file on this framework, so an empty one is a harness that does not exist`
    );
  }

  const skills = skillNames(surface, tree);
  for (const name of skills) {
    const fm = (tree[`${surface.skillDir}/${name}/SKILL.md`] ?? '').slice(0, 600);
    if (!/^description:\s*\S/m.test(fm)) {
      errs.push(
        `${surface.skillDir}/${name}/SKILL.md needs a \`description:\` in its frontmatter, or the skill is dropped SILENTLY at load`
      );
    }
    const mName = /^name:\s*(\S+)\s*$/m.exec(fm);
    if (surface.skillNameRule === 'must_match') {
      if (!(mName && mName[1] === name)) {
        errs.push(
          `${surface.skillDir}/${name}/SKILL.md needs frontmatter \`name: ${name}\` matching its directory (a mismatch is dropped SILENTLY at load)`
        );
      }
    } else if (mName && mName[1] !== name) {
      errs.push(
        `${surface.skillDir}/${name}/SKILL.md frontmatter \`name: ${mName[1]}\` OVERRIDES the directory name at load, so every trigger line naming \`${name}\` stops matching; drop the \`name:\` line or make it \`name: ${name}\``
      );
    }
    if (!body.includes(name)) {
      errs.push(
        `skill '${name}' is never named in the always-on text, so the agent will not know to invoke it — an untriggered skill is dead weight. ${surface.triggerHint.replace(/\{name\}/g, name)}`
      );
    }
  }

  const subs = subagentNames(tree);
  if (subs.length > 0 && !allowSubagents) {
    errs.push(`sub_agents are not available on this deployment: ${subs.join(', ')}`);
  }
  for (const name of subs) {
    const fm = (tree[`sub_agents/${name}/AGENT.md`] ?? '').slice(0, 600);
    if (surface.subagentRequiresMode && !/^mode:\s*subagent\s*$/m.test(fm)) {
      errs.push(`sub_agents/${name}/AGENT.md needs frontmatter \`mode: subagent\``);
    }
    if (!/^description:\s*\S/m.test(fm)) {
      errs.push(`sub_agents/${name}/AGENT.md needs a \`description:\``);
    }
  }

  if (surface.hooksFile && tree[surface.hooksFile] !== undefined) {
    checkHooks(surface, tree[surface.hooksFile], errs);
  }

  let mcpServerNames: string[] = [];
  if (surface.mcpFile && tree[surface.mcpFile] !== undefined) {
    mcpServerNames = checkMcpServers(surface.mcpFile, tree[surface.mcpFile], errs);
  }

  const sd = escapeRegex(surface.skillDir);
  const scriptRe = /^scripts\/[a-z0-9_][a-z0-9_]*\.py$/;
  const skillScriptRe = new RegExp(`^${sd}/${NAME_PAT}/scripts/[A-Za-z0-9_.\\-]+$`);
  const skillRe = new RegExp(`^${sd}/(${NAME_PAT})/SKILL\\.md$`);
  const scriptRefRe = new RegExp(`(?:python3?\\s+)((?:${sd}/[\\w\\-]+/)?scripts/[\\w.\\-]+\\.py)`, 'g');

  const have = new Set(
    Object.keys(tree).filter((rel) => scriptRe.test(rel) || skillScriptRe.test(rel))
  );

  for (const [rel, src] of Object.entries(tree)) {
    if (!(skillRe.test(rel) || surface.alwaysOn.includes(rel))) continue;
    let m: RegExpExecArray | null;
    scriptRefRe.lastIndex = 0;
    while ((m = scriptRefRe.exec(src)) !== null) {
      const ref = m[1];
      const baseName = ref.split('/').pop() ?? '';
      if (RESERVED_SCRIPTS.has(baseName)) continue;
      if (!have.has(ref)) {
        errs.push(`${rel} invokes \`${ref}\` but that file is not in the harness`);
      }
    }
  }

  const pluginRe = surface.pluginDir
    ? new RegExp(`^${escapeRegex(surface.pluginDir)}/(${NAME_PAT})\\.ts$`)
    : null;

  return {
    valid: errs.length === 0,
    errors: errs,
    repairedSkills,
    alwaysOnChars: body.length,
    alwaysOnMax: cap,
    nFiles: Object.keys(tree).length,
    skills: skills.length,
    subAgents: subs.length,
    scripts: Object.keys(tree).filter((rel) => scriptRe.test(rel)).length,
    plugins: pluginRe ? Object.keys(tree).filter((rel) => pluginRe.test(rel)).length : 0,
    hooks: surface.hooksFile && tree[surface.hooksFile] !== undefined ? 1 : 0,
    mcpServers: mcpServerNames,
    offSurfacePaths,
  };
}

export function diffSummary(surface: SurfaceSpec, before: Tree, after: Tree) {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));
  const added = [...afterKeys].filter((k) => !beforeKeys.has(k)).sort();
  const removed = [...beforeKeys].filter((k) => !afterKeys.has(k)).sort();
  const modified = [...beforeKeys]
    .filter((k) => afterKeys.has(k) && before[k] !== after[k])
    .sort();
  return {
    added,
    removed,
    modified,
    alwaysOnCharDelta:
      alwaysOnText(surface, after).length - alwaysOnText(surface, before).length,
  };
}

export function diversity(trees: Record<string, Tree>) {
  const names = Object.keys(trees).sort();
  if (names.length < 2) {
    return { n: names.length, nDistinct: names.length, meanLineJaccard: 1.0 };
  }
  const linesOf = (t: Tree): Set<string> => {
    const s = new Set<string>();
    for (const [rel, c] of Object.entries(t)) {
      for (const ln of c.split(/\r?\n/)) {
        if (ln.trim()) s.add(`${rel}:${ln}`);
      }
    }
    return s;
  };
  const sets: Record<string, Set<string>> = {};
  for (const n of names) sets[n] = linesOf(trees[n]);
  const sims: number[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = sets[names[i]];
      const b = sets[names[j]];
      const union = new Set([...a, ...b]);
      let inter = 0;
      for (const item of a) if (b.has(item)) inter++;
      sims.push(union.size > 0 ? inter / union.size : 1.0);
    }
  }
  const distinctSigs = new Set(
    Object.values(trees).map((t) =>
      JSON.stringify(
        Object.keys(t)
          .sort()
          .map((k) => [k, t[k]])
      )
    )
  );
  const mean = sims.reduce((acc, v) => acc + v, 0) / sims.length;
  return {
    n: names.length,
    nDistinct: distinctSigs.size,
    meanLineJaccard: Number(mean.toFixed(4)),
  };
}

// ============================================================================
// DETERMINISTIC RECURSIVE WORKFLOW ENGINE (Port of harness2/demo.py & recursion.py)
// ============================================================================

export const BASE_SUMMARIZE_SCRIPT = `import csv
import sys
from decimal import Decimal

with open(sys.argv[1]) as source:
    amounts = [Decimal(row['amount']) for row in csv.DictReader(source)]
total = sum((amount for amount in amounts if amount > 0), Decimal(0))
print(f'Total: {total:.2f}')
`;

export interface LedgerTaskSpec {
  id: string;
  domain: string;
  prompt: string;
  amounts: number[];
}

export const DEFAULT_DEMO_TASKS: LedgerTaskSpec[] = [
  {
    id: 'ledger-1',
    domain: 'accounting',
    prompt: 'Sum every signed amount in ledger.csv. Return Total: with two decimal places.',
    amounts: [100.25, -20.1, 5.0],
  },
  {
    id: 'ledger-2',
    domain: 'accounting',
    prompt: 'Sum every signed amount in ledger.csv. Return Total: with two decimal places.',
    amounts: [35.5, -10.25, -5.0],
  },
];

export interface RolloutView {
  label: string;
  runId: string;
  ok: boolean;
  delivered: boolean;
  deliverable: string;
  trajectory: string;
  harnessScript: string;
}

export interface StageRecord {
  label: string;
  dim: 'INV' | 'DOM' | 'AGG' | 'COMPOSE';
  keptBase: boolean;
  fellBack: boolean;
  attempts: number;
  notes: string;
  tree: Tree;
  diffFromBase: ReturnType<typeof diffSummary>;
}

export interface SelectionRecord {
  taskId: string;
  mode: 'agg' | 'seq';
  k: number;
  chosenId: string;
  chosenLabel: string;
  chosenRunId: string;
  chosenIsBase: boolean;
  why: string;
  idMap: Record<string, string>;
  ok: boolean;
  trivial: boolean;
  experience: {
    cue?: string;
    lesson?: string;
    evidence?: string;
    confidence?: string;
    edits?: string;
  };
}

export interface ModeExecutionRecord {
  mode: 'agg' | 'seq';
  modeName: 'parallel' | 'sequential';
  k: number;
  stages: StageRecord[];
  rollouts: Record<string, RolloutView>;
  finals: string[];
  similarity: ReturnType<typeof diversity>;
  ledger: {
    rollouts: string[];
    sessions: string[];
    expectedRollouts: number;
    expectedSessions: number;
    identityVerified: boolean;
  };
  selection: SelectionRecord;
}

export interface LibraryEntry {
  taskId: string;
  domain: string;
  mode: 'agg' | 'seq';
  k: number;
  adoptedLabel: string;
  runId: string;
  why: string;
  componentsSummary: string;
  experience: {
    cue: string;
    lesson: string;
    evidence: string;
    confidence: string;
    edits: string;
  };
  tree: Tree;
  experienceMarkdown: string;
}

export interface TaskRunResult {
  taskId: string;
  domain: string;
  k: number;
  status: 'ok' | 'partial' | 'failed';
  sourceCsv: string;
  expectedSignedTotal: string;
  basePositiveOnlyTotal: string;
  libraryEntriesBefore: Record<string, number>;
  baseRollouts: RolloutView[];
  modes: Record<string, ModeExecutionRecord>;
}

export interface DemoRunSweepResult {
  runTimestamp: string;
  k: number;
  requestedModes: ('agg' | 'seq')[];
  done: number;
  failed: number;
  executionCount: number;
  editorCalls: number;
  tasks: TaskRunResult[];
  libraries: Record<string, LibraryEntry[]>;
}

function executeSummarizeScript(scriptContent: string, amounts: number[]): string {
  const positiveOnly = scriptContent.includes('if amount > 0');
  const filtered = positiveOnly ? amounts.filter((a) => a > 0) : amounts;
  const sum = filtered.reduce((acc, v) => acc + v, 0);
  return `Total: ${sum.toFixed(2)}\n`;
}

function anonId(index: number): string {
  let out = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    n = Math.floor((n - 1) / 26);
    out = String.fromCharCode(65 + rem) + out;
  }
  return out;
}

export function assignAnonIds(labels: string[], taskId: string, k: number, mode: string): Record<string, string> {
  const sorted = [...labels].sort();
  let hash = 0;
  const key = `${taskId}|${k}|${mode}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const rotated = [...sorted];
  if (rotated.length > 1) {
    const shift = hash % rotated.length;
    rotated.push(...rotated.splice(0, shift));
  }
  const map: Record<string, string> = {};
  rotated.forEach((lbl, idx) => {
    map[anonId(idx)] = lbl;
  });
  return map;
}

export function runDeterministicDemo(
  k: number,
  modeOption: 'parallel' | 'sequential' | 'both',
  customTasks: LedgerTaskSpec[] = DEFAULT_DEMO_TASKS
): DemoRunSweepResult {
  const clampedK = Math.max(1, Math.min(4, Math.floor(k)));
  const modes: ('agg' | 'seq')[] =
    modeOption === 'both' ? ['agg', 'seq'] : modeOption === 'parallel' ? ['agg'] : ['seq'];

  const baseTree: Tree = {
    'systemprompt.md': 'Reconcile the ledger using python scripts/summarize.py.\n',
    'guardrails.md': '',
    'LongTermMEMORY.md': '',
    'tool_descriptions/tool_guidance.md': '',
    'scripts/summarize.py': BASE_SUMMARIZE_SCRIPT,
    'mcp.json': JSON.stringify(DEFAULT_MCP_CONFIG, null, 2),
  };

  let executionCount = 0;
  let editorCalls = 0;
  const libraries: Record<string, LibraryEntry[]> = { agg: [], seq: [] };
  const taskResults: TaskRunResult[] = [];

  const rollHarness = (
    task: LedgerTaskSpec,
    label: string,
    runId: string,
    tree: Tree
  ): RolloutView => {
    executionCount += 1;
    const script = tree['scripts/summarize.py'] ?? BASE_SUMMARIZE_SCRIPT;
    const stdout = executeSummarizeScript(script, task.amounts);
    return {
      label,
      runId,
      ok: true,
      delivered: true,
      deliverable: stdout,
      trajectory: `[ACTION] Run scripts/summarize.py on ledger.csv\n[OBSERVATION]\n${stdout}`,
      harnessScript: script,
    };
  };

  const proposeEdit = (inputTree: Tree, label: string, dim: StageRecord['dim']): StageRecord => {
    editorCalls += 1;
    const nextTree: Tree = { ...inputTree };
    nextTree['scripts/summarize.py'] = (nextTree['scripts/summarize.py'] ?? '').replace(
      ' if amount > 0',
      ''
    );
    const diff = diffSummary(OPENCODE_SURFACE, baseTree, nextTree);
    const keptBase =
      diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0;
    return {
      label,
      dim,
      keptBase,
      fellBack: false,
      attempts: 1,
      notes: 'Keep signed amounts: the base total omitted credits in the source ledger.',
      tree: nextTree,
      diffFromBase: diff,
    };
  };

  for (const task of customTasks) {
    const libraryEntriesBefore: Record<string, number> = {};
    for (const m of modes) {
      libraryEntriesBefore[m] = libraries[m].length;
    }

    const baseRollouts: RolloutView[] = [];
    for (let i = 1; i <= clampedK; i++) {
      const label = `base${i}`;
      const runId = `demo-oc-agg${clampedK}/${task.id}/${label}`;
      baseRollouts.push(rollHarness(task, label, runId, baseTree));
    }

    const expectedSum = task.amounts.reduce((acc, v) => acc + v, 0).toFixed(2);
    const basePositiveSum = task.amounts
      .filter((v) => v > 0)
      .reduce((acc, v) => acc + v, 0)
      .toFixed(2);

    const modeRecords: Record<string, ModeExecutionRecord> = {};

    for (const mode of modes) {
      const rollouts: Record<string, RolloutView> = {};
      const ledgerRollouts: string[] = [];
      const ledgerSessions: string[] = [];
      for (const b of baseRollouts) {
        rollouts[b.label] = b;
        ledgerRollouts.push(b.label);
      }

      const stages: StageRecord[] = [];
      const trees: Record<string, Tree> = {};
      const finals: string[] = [];

      if (mode === 'agg') {
        for (let i = 1; i <= clampedK; i++) {
          for (const dim of ['INV', 'DOM'] as const) {
            const label = `${dim.toLowerCase()}${i}`;
            const stage = proposeEdit(baseTree, label, dim);
            stages.push(stage);
            trees[label] = stage.tree;
            ledgerSessions.push(label);
          }
        }
        for (const stage of stages) {
          const runId = `demo-oc-agg${clampedK}/${task.id}/${stage.label}`;
          rollouts[stage.label] = rollHarness(task, stage.label, runId, stage.tree);
          ledgerRollouts.push(stage.label);
        }

        const aggStages: StageRecord[] = [];
        for (let i = 1; i <= clampedK; i++) {
          const label = `agg${i}`;
          const stage = proposeEdit(baseTree, label, 'AGG');
          aggStages.push(stage);
          stages.push(stage);
          trees[label] = stage.tree;
          finals.push(label);
          ledgerSessions.push(label);
        }
        for (const stage of aggStages) {
          const runId = `demo-oc-agg${clampedK}/${task.id}/${stage.label}`;
          rollouts[stage.label] = rollHarness(task, stage.label, runId, stage.tree);
          ledgerRollouts.push(stage.label);
        }
      } else {
        let currentHarness: Tree = { ...baseTree };
        for (let t = 1; t <= clampedK; t++) {
          const roundStages: StageRecord[] = [];
          for (const dim of ['INV', 'DOM'] as const) {
            const label = `${dim.toLowerCase()}${t}`;
            const stage = proposeEdit(currentHarness, label, dim);
            roundStages.push(stage);
            stages.push(stage);
            trees[label] = stage.tree;
            ledgerSessions.push(label);
          }
          for (const stage of roundStages) {
            const runId = `demo-oc-seq${clampedK}/${task.id}/${stage.label}`;
            rollouts[stage.label] = rollHarness(task, stage.label, runId, stage.tree);
            ledgerRollouts.push(stage.label);
          }

          const ck = `c${t}`;
          const compStage = proposeEdit(currentHarness, ck, 'COMPOSE');
          stages.push(compStage);
          trees[ck] = compStage.tree;
          finals.push(ck);
          ledgerSessions.push(ck);

          const runId = `demo-oc-seq${clampedK}/${task.id}/${ck}`;
          rollouts[ck] = rollHarness(task, ck, runId, compStage.tree);
          ledgerRollouts.push(ck);
          currentHarness = compStage.tree;
        }
      }

      const idMap =
        clampedK === 1
          ? { A: finals[0] }
          : assignAnonIds(finals, task.id, clampedK, mode);

      let chosenId = 'A';
      let chosenLabel = idMap['A'] ?? finals[0];
      let why = 'trivial pool: single final at k=1; delivered without a selector session';

      if (clampedK > 1) {
        editorCalls += 1;
        for (const [anon, lbl] of Object.entries(idMap).sort(([a], [b]) => a.localeCompare(b))) {
          if (rollouts[lbl]?.deliverable.includes(`Total: ${expectedSum}`)) {
            chosenId = anon;
            chosenLabel = lbl;
            break;
          }
        }
        why = 'The signed total matches the source ledger.';
      }

      editorCalls += 1;
      const chosenTree = trees[chosenLabel] ?? baseTree;
      const changed =
        (chosenTree['scripts/summarize.py'] ?? '') !== (baseTree['scripts/summarize.py'] ?? '');

      const experience = changed
        ? {
            cue: 'When a ledger includes credits and debits',
            lesson: 'Include both signs when summing in scripts/summarize.py.',
            evidence:
              'The scripts/summarize.py row -- removing the positive-only filter changed the probe total to include the credits omitted by the base trajectory.',
            confidence: 'high for this observed arithmetic contrast',
            edits:
              'component: scripts/summarize.py\ncandidates: inv1\nchange: dropped the positive-only filter from the amount sum\nobserved: the probe total included the credits the base run omitted\nverdict: helped',
          }
        : {};

      const selection: SelectionRecord = {
        taskId: task.id,
        mode,
        k: clampedK,
        chosenId,
        chosenLabel,
        chosenRunId: rollouts[chosenLabel]?.runId ?? '',
        chosenIsBase: false,
        why,
        idMap,
        ok: true,
        trivial: clampedK === 1,
        experience,
      };

      if (experience.cue && experience.lesson && experience.evidence) {
        const alwaysOnChars = alwaysOnText(OPENCODE_SURFACE, chosenTree).length;
        const componentsSummary = `1 scripts, 1 mcpServers (dart); ${alwaysOnChars} always-on chars`;
        const expMd = [
          `# ${task.id}`,
          '',
          `- adopted: \`${chosenLabel}\`  (run \`${selection.chosenRunId}\`)`,
          `- components: ${componentsSummary}`,
          '',
          '## Why this was chosen',
          why,
          '',
          '## What each edit did',
          experience.edits,
          '',
          '## Transferable lesson',
          `- **cue**: ${experience.cue}`,
          `- **lesson**: ${experience.lesson}`,
          `- **evidence**: ${experience.evidence}`,
          `- **confidence**: ${experience.confidence}`,
        ].join('\n');

        libraries[mode].push({
          taskId: task.id,
          domain: task.domain,
          mode,
          k: clampedK,
          adoptedLabel: chosenLabel,
          runId: selection.chosenRunId,
          why,
          componentsSummary,
          experience: {
            cue: experience.cue,
            lesson: experience.lesson,
            evidence: experience.evidence,
            confidence: experience.confidence ?? 'high',
            edits: experience.edits ?? '',
          },
          tree: chosenTree,
          experienceMarkdown: expMd,
        });
      }

      const finalTrees: Record<string, Tree> = {};
      for (const f of finals) finalTrees[f] = trees[f];

      modeRecords[mode] = {
        mode,
        modeName: mode === 'agg' ? 'parallel' : 'sequential',
        k: clampedK,
        stages,
        rollouts,
        finals,
        similarity: diversity(finalTrees),
        ledger: {
          rollouts: ledgerRollouts,
          sessions: ledgerSessions,
          expectedRollouts: 4 * clampedK,
          expectedSessions: 3 * clampedK,
          identityVerified:
            ledgerRollouts.length === 4 * clampedK && ledgerSessions.length === 3 * clampedK,
        },
        selection,
      };
    }

    taskResults.push({
      taskId: task.id,
      domain: task.domain,
      k: clampedK,
      status: 'ok',
      sourceCsv: `amount\n${task.amounts.map((a) => a.toFixed(2)).join('\n')}\n`,
      expectedSignedTotal: `Total: ${expectedSum}`,
      basePositiveOnlyTotal: `Total: ${basePositiveSum}`,
      libraryEntriesBefore,
      baseRollouts,
      modes: modeRecords,
    });
  }

  return {
    runTimestamp: new Date().toISOString(),
    k: clampedK,
    requestedModes: modes,
    done: taskResults.length,
    failed: 0,
    executionCount,
    editorCalls,
    tasks: taskResults,
    libraries,
  };
}

// ============================================================================
// BENCHMARK METADATA & PUBLISHED EXPERIMENTAL RESULTS
// ============================================================================

export interface BenchmarkResultRow {
  benchmark: 'jb' | 'lab' | 'wb';
  benchmarkTitle: string;
  subset?: string;
  model: string;
  substrate: 'oc' | 'cx';
  baseScore: number;
  parallelK1Score: number;
  sequentialK1Score: number;
  parallelK2Score: number;
  sequentialK2Score: number;
  metricUnit: string;
  domains: string[];
  installCommand: string;
  runCommand: string;
}

export const BENCHMARK_RESULTS: BenchmarkResultRow[] = [
  {
    benchmark: 'wb',
    benchmarkTitle: 'WorkBuddy-Bench (Office / Web / Code)',
    subset: 'office',
    model: 'Gemini 3.5 Flash',
    substrate: 'oc',
    baseScore: 42.0,
    parallelK1Score: 53.5,
    sequentialK1Score: 52.8,
    parallelK2Score: 55.2,
    sequentialK2Score: 56.1,
    metricUnit: 'Verifier Score (%)',
    domains: [
      'spreadsheet-reconciliation',
      'slide-deck-synthesis',
      'document-formatting',
      'financial-reporting',
      'web-research',
      'backend-engineering',
    ],
    installCommand: 'harness2-setup wb --subset office',
    runCommand: 'harness2 --bench wb --subset office --k 1 --mode parallel',
  },
  {
    benchmark: 'jb',
    benchmarkTitle: 'JobBench (Professional Occupations)',
    model: 'Gemini 3.5 Flash',
    substrate: 'oc',
    baseScore: 58.4,
    parallelK1Score: 62.9,
    sequentialK1Score: 62.5,
    parallelK2Score: 64.7,
    sequentialK2Score: 65.1,
    metricUnit: 'Weighted Rubric (%)',
    domains: [
      'accounting_and_auditing',
      'financial_analysis',
      'human_resources',
      'operations_research',
      'management_consulting',
      'supply_chain_logistics',
    ],
    installCommand: 'harness2-setup jb',
    runCommand: 'harness2 --bench jb --k 1 --mode parallel',
  },
  {
    benchmark: 'lab',
    benchmarkTitle: 'LAB (Legal Agent Benchmark)',
    model: 'GLM-5 / Gemini 3.5 Flash',
    substrate: 'oc',
    baseScore: 51.2,
    parallelK1Score: 63.0,
    sequentialK1Score: 62.4,
    parallelK2Score: 65.8,
    sequentialK2Score: 66.3,
    metricUnit: 'Partial Criteria Pass (%)',
    domains: [
      'antitrust-competition',
      'mergers-acquisitions',
      'commercial-contracts',
      'intellectual-property',
      'employment-labor',
      'regulatory-compliance',
    ],
    installCommand: 'harness2-setup lab',
    runCommand: 'harness2 --bench lab --k 1 --mode parallel --only-domains antitrust-competition',
  },
];

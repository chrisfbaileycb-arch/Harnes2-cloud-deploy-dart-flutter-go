import { Tree } from './harnessEngine';

export type GenkitLang = 'js' | 'dart' | 'go' | 'python';

export interface LanguageSpec {
  id: GenkitLang;
  label: string;
  skillName: string;
  runtime: string;
  schemaLib: string;
  installSkillsSh: string;
  installUpstreamSh: string;
  startCommand: string;
  flowRunCommand: string;
  skillPathInRepo: string;
}

export const GENKIT_LANGUAGES: Record<GenkitLang, LanguageSpec> = {
  js: {
    id: 'js',
    label: 'Node.js / TypeScript',
    skillName: 'developing-genkit-js',
    runtime: 'Node.js 20+ / tsx',
    schemaLib: 'Zod (z.object)',
    installSkillsSh: 'npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-js',
    installUpstreamSh: 'npx skills add genkit-ai/skills --skill developing-genkit-js',
    startCommand: 'genkit start --non-interactive -- npx tsx --watch src/index.ts',
    flowRunCommand: `genkit flow:run jokeFlow '{"topic": "recursion"}' -- npx tsx src/index.ts`,
    skillPathInRepo: 'skills/developing-genkit-js/SKILL.md',
  },
  dart: {
    id: 'dart',
    label: 'Dart / Flutter',
    skillName: 'developing-genkit-dart',
    runtime: 'Dart 3.5+ / genkit ^1.0.0',
    schemaLib: 'schemantic (@Schema)',
    installSkillsSh: 'npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-dart',
    installUpstreamSh: 'npx skills add genkit-ai/skills --skill developing-genkit-dart',
    startCommand: 'genkit start --non-interactive -- dart run bin/server.dart',
    flowRunCommand: `genkit flow:run analyzePackageFlow '{"packageName": "genkit_mcp"}' -- dart run bin/server.dart`,
    skillPathInRepo: 'skills/developing-genkit-dart/SKILL.md',
  },
  go: {
    id: 'go',
    label: 'Go',
    skillName: 'developing-genkit-go',
    runtime: 'Go 1.22+',
    schemaLib: 'Go Structs + jsonschema tags',
    installSkillsSh: 'npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-go',
    installUpstreamSh: 'npx skills add genkit-ai/skills --skill developing-genkit-go',
    startCommand: 'genkit start --non-interactive -- go run .',
    flowRunCommand: `genkit flow:run jokeFlow '"distributed systems"' -- go run .`,
    skillPathInRepo: 'skills/developing-genkit-go/SKILL.md',
  },
  python: {
    id: 'python',
    label: 'Python',
    skillName: 'developing-genkit-python',
    runtime: 'Python 3.10+ & uv',
    schemaLib: 'Pydantic BaseModel',
    installSkillsSh: 'npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-python',
    installUpstreamSh: 'npx skills add genkit-ai/skills --skill developing-genkit-python',
    startCommand: 'genkit start --non-interactive -- uv run src/main.py',
    flowRunCommand: `genkit flow:run summarizeFlow '{"document": "Q3 Ledger"}' -- uv run src/main.py`,
    skillPathInRepo: 'skills/developing-genkit-python/SKILL.md',
  },
};

export interface ManualStep {
  number: string;
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  keyRules: string[];
  codeByLang: Record<GenkitLang, { filename: string; code: string; explanation: string }>;
}

export const SKILL_GENKIT_STEPS: ManualStep[] = [
  {
    number: '01',
    id: 'install-and-mount',
    title: '01. Install & Mount Agent Skills',
    subtitle: 'Install from chrisfbaileycb-arch/skill-genkit and wire into your agent harness',
    summary:
      'Genkit Agent Skills follow the Agent Skills Specification (agentskills.io). Each skill folder contains a SKILL.md with YAML frontmatter (name, description, metadata) and modular reference guides under references/.',
    keyRules: [
      'Frontmatter must include `name:` matching the skill directory and a clear `description:` so the agent knows when to load it.',
      'In Harness² (OpenCode or Codex), every skill in `skills/<name>/SKILL.md` must have a matching trigger line in `systemprompt.md`, `guardrails.md`, or `AGENTS.md`.',
      'Install Global Genkit CLI (`npm install -g genkit-cli`) alongside the skill so the agent can run `genkit docs:search`, `genkit flow:run`, and `genkit trace:get`.',
    ],
    codeByLang: {
      js: {
        filename: 'skills/developing_genkit_js/SKILL.md',
        explanation:
          'Install the Node.js/TypeScript Genkit skill via skills.sh and add its trigger rule to systemprompt.md.',
        code: `# 1. Install via skills.sh CLI
npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-js
npm install -g genkit-cli

# 2. Required SKILL.md Frontmatter (skills/developing_genkit_js/SKILL.md)
---
name: developing_genkit_js
description: Develop AI-powered applications, flows, tools, and multi-turn agents using Genkit v1.x in Node.js and TypeScript
metadata:
  version: "1.0.0"
  category: AiAndMachineLearning
---

# 3. Required Always-On Trigger Line (systemprompt.md or guardrails.md)
- When building Genkit flows, tools, or agents in TypeScript, load the \`developing_genkit_js\` skill.`,
      },
      dart: {
        filename: 'skills/developing_genkit_dart/SKILL.md',
        explanation:
          'Install the Dart 1.0 Genkit skill and pair it with the `dart mcp-server` configuration in mcp.json.',
        code: `# 1. Install via skills.sh CLI
npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-dart
npm install -g genkit-cli

# 2. Required SKILL.md Frontmatter (skills/developing_genkit_dart/SKILL.md)
---
name: developing_genkit_dart
description: Generates code and provides documentation for the Genkit Dart 1.0 SDK, schemantic types, and genkit_mcp
metadata:
  version: "1.0.0"
  category: AiAndMachineLearning
---

# 3. Required Always-On Trigger Line (systemprompt.md or guardrails.md)
- When building Genkit Dart flows, schemantic models, or MCP hosts, load the \`developing_genkit_dart\` skill.`,
      },
      go: {
        filename: 'skills/developing_genkit_go/SKILL.md',
        explanation:
          'Install the Go Genkit skill covering genkit.Init, DefineFlow, DefineTool, and experimental agents.',
        code: `# 1. Install via skills.sh CLI
npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-go
npm install -g genkit-cli

# 2. Required SKILL.md Frontmatter (skills/developing_genkit_go/SKILL.md)
---
name: developing_genkit_go
description: Develop AI-powered applications using Genkit in Go with DefineFlow, GenerateData, and genkitx.DefineAgent
metadata:
  version: "1.0.0"
  category: AiAndMachineLearning
---

# 3. Required Always-On Trigger Line (systemprompt.md or guardrails.md)
- When writing Genkit Go flows, prompts, or HTTP handlers, load the \`developing_genkit_go\` skill.`,
      },
      python: {
        filename: 'skills/developing_genkit_python/SKILL.md',
        explanation:
          'Install the Python Genkit skill (requires Python 3.10+ and uv) and add its trigger rule.',
        code: `# 1. Install via skills.sh CLI
npx skills add chrisfbaileycb-arch/skill-genkit --skill developing-genkit-python
npm install -g genkit-cli

# 2. Required SKILL.md Frontmatter (skills/developing_genkit_python/SKILL.md)
---
name: developing_genkit_python
description: Develop AI-powered applications using Genkit in Python with GoogleAI, flows, tools, and multi-turn agents
metadata:
  version: "1.0.0"
  category: AiAndMachineLearning
---

# 3. Required Always-On Trigger Line (systemprompt.md or guardrails.md)
- When developing Genkit Python flows, FastAPI handlers, or agents, load the \`developing_genkit_python\` skill.`,
      },
    },
  },
  {
    number: '02',
    id: 'init-and-generate',
    title: '02. SDK Initialization & Structured Generation',
    subtitle: 'Initialize the Genkit v1.0 instance, configure Google AI / Vertex AI plugins, and generate typed data',
    summary:
      'Genkit 1.0 unified initialization around an explicit instance (`ai = genkit(...)` / `Genkit()` / `genkit.Init(ctx, ...)`). Never use legacy pre-1.0 global `configureGenkit()` or `response.text()` method calls.',
    keyRules: [
      'In JS/TS and Python, `response.text` is a getter property, NOT a method (`response.text()` throws a TypeError in v1.0).',
      'In Dart, always define structured schemas with `@Schema()` from `package:schemantic/schemantic.dart` and run `dart run build_runner build`.',
      'In Go, add `jsonschema:"description=..."` struct tags to every output struct field so the model knows what to populate.',
    ],
    codeByLang: {
      js: {
        filename: 'src/index.ts',
        explanation:
          'Initialize Genkit v1.x with @genkit-ai/google-genai and generate structured output using Zod.',
        code: `import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

const AuditSchema = z.object({
  summary: z.string().describe('Concise audit summary'),
  netBalance: z.number().describe('Signed net total including credits and debits'),
  discrepanciesFound: z.boolean(),
});

async function main() {
  const { output, text } = await ai.generate({
    prompt: 'Audit ledger entries: +100.25, -20.10, +5.00',
    output: { schema: AuditSchema },
  });
  console.log('Raw text:', text); // Property getter, NOT text()
  console.log('Structured output:', output);
}

main();`,
      },
      dart: {
        filename: 'bin/main.dart',
        explanation:
          'Initialize Genkit Dart 1.0 with googleAI.gemini() and @Schema() from package:schemantic.',
        code: `import 'package:genkit/genkit.dart';
import 'package:genkit_google_genai/genkit_google_genai.dart';
import 'package:schemantic/schemantic.dart';

part 'main.g.dart';

@Schema()
abstract class $AuditReport {
  @Field(description: 'Concise audit summary')
  String get summary;

  @Field(description: 'Signed net balance including credits and debits')
  double get netBalance;
}

void main() async {
  final ai = Genkit(plugins: [googleAI()]);

  final result = await ai.generate(
    model: googleAI.gemini('gemini-flash-latest'),
    prompt: 'Audit ledger entries: +100.25, -20.10, +5.00',
    outputSchema: AuditReport.$schema,
  );

  print('Summary: \${result.output?.summary}');
  print('Net Balance: \${result.output?.netBalance}');
}`,
      },
      go: {
        filename: 'main.go',
        explanation:
          'Use genkit.Init and genkit.GenerateData with jsonschema struct tags for typed responses.',
        code: `package main

import (
	"context"
	"fmt"
	"log"

	"github.com/genkit-ai/genkit/go/ai"
	"github.com/genkit-ai/genkit/go/genkit"
	"github.com/genkit-ai/genkit/go/plugins/googlegenai"
)

type AuditReport struct {
	Summary    string  \`json:"summary" jsonschema:"description=Concise audit summary"\`
	NetBalance float64 \`json:"netBalance" jsonschema:"description=Signed net total including credits and debits"\`
}

func main() {
	ctx := context.Background()
	g := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))

	report, _, err := genkit.GenerateData[AuditReport](ctx, g,
		ai.WithModelName("googleai/gemini-flash-latest"),
		ai.WithPrompt("Audit ledger entries: +100.25, -20.10, +5.00"),
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Summary: %s | Net: %.2f\\n", report.Summary, report.NetBalance)
}`,
      },
      python: {
        filename: 'src/main.py',
        explanation:
          'Enter via ai.run_main(main()) so Genkit CLI trace collection hooks properly attach.',
        code: `from pydantic import BaseModel, Field
from genkit import Genkit
from genkit_google_genai import GoogleAI

ai = Genkit(
    plugins=[GoogleAI()],
    model='googleai/gemini-flash-latest',
)

class AuditReport(BaseModel):
    summary: str = Field(description='Concise audit summary')
    net_balance: float = Field(description='Signed net total including credits and debits')

async def main():
    response = await ai.generate(
        prompt='Audit ledger entries: +100.25, -20.10, +5.00',
        output_schema=AuditReport,
    )
    print('Text:', response.text)
    print('Output:', response.output)

if __name__ == '__main__':
    ai.run_main(main())`,
      },
    },
  },
  {
    number: '03',
    id: 'flows-and-tools',
    title: '03. Flows, Tools & HTTP Serving',
    subtitle: 'Wrap generation and tools inside observable flows and expose them over HTTP',
    summary:
      'Every non-trivial AI operation belongs in a Flow (`defineFlow`). Flows give you automatic trace capture, CLI invocation via `genkit flow:run`, evaluation support, and one-line HTTP serving (`GenkitRouter` in Dart, `genkit.Handler` in Go, `serve_flow` in Python).',
    keyRules: [
      'Write descriptive tool descriptions and field descriptions — the model decides when and how to invoke tools solely from those strings.',
      'In Dart 1.0, `startFlowServer` is replaced by `GenkitRouter` (`package:genkit/io.dart` or `package:genkit_shelf/genkit_shelf.dart`).',
      'For human-in-the-loop tool approval, use the `toolApproval()` middleware or return `.interrupt(...)` from the tool implementation.',
    ],
    codeByLang: {
      js: {
        filename: 'src/flows.ts',
        explanation:
          'Define a typed tool with ai.defineTool and invoke it inside an observable ai.defineFlow.',
        code: `import { z } from 'genkit';
import { ai } from './index';

export const sumLedgerTool = ai.defineTool(
  {
    name: 'sumLedgerTool',
    description: 'Sum signed credit and debit amounts from a transaction list',
    inputSchema: z.object({
      amounts: z.array(z.number()).describe('Signed transaction amounts'),
    }),
    outputSchema: z.number(),
  },
  async ({ amounts }) => amounts.reduce((acc, n) => acc + n, 0)
);

export const reconcileLedgerFlow = ai.defineFlow(
  {
    name: 'reconcileLedgerFlow',
    inputSchema: z.object({ accountId: z.string(), amounts: z.array(z.number()) }),
    outputSchema: z.string(),
  },
  async ({ accountId, amounts }) => {
    const response = await ai.generate({
      prompt: \`Reconcile account \${accountId} with amounts: \${amounts.join(', ')}\`,
      tools: [sumLedgerTool],
    });
    return response.text;
  }
);`,
      },
      dart: {
        filename: 'bin/server.dart',
        explanation:
          'Define a tool and flow in Genkit Dart 1.0 and serve over HTTP using GenkitRouter.',
        code: `import 'package:genkit/genkit.dart';
import 'package:genkit/io.dart';
import 'package:genkit_google_genai/genkit_google_genai.dart';
import 'package:schemantic/schemantic.dart';

part 'server.g.dart';

@Schema()
abstract class $LedgerInput {
  String get accountId;
  List<double> get amounts;
}

void main() async {
  final ai = Genkit(plugins: [googleAI()]);

  final sumTool = ai.defineTool<LedgerInput, double>(
    name: 'sumLedgerTool',
    description: 'Calculates the exact signed sum of credit and debit amounts',
    inputSchema: LedgerInput.$schema,
    outputSchema: SchemanticType.double(),
    fn: (input, ctx) async => input.amounts.fold(0.0, (a, b) => a + b),
  );

  final reconcileFlow = ai.defineFlow<LedgerInput, String>(
    name: 'reconcileLedgerFlow',
    inputSchema: LedgerInput.$schema,
    outputSchema: SchemanticType.string(),
    fn: (input, ctx) async {
      final res = await ai.generate(
        model: googleAI.gemini('gemini-flash-latest'),
        prompt: 'Reconcile account \${input.accountId}: \${input.amounts}',
        tools: [sumTool],
      );
      return res.text;
    },
  );

  final router = GenkitRouter()..addFlow(reconcileFlow);
  await router.serve(port: 8080);
}`,
      },
      go: {
        filename: 'flows.go',
        explanation:
          'Register tools with genkit.DefineTool and expose flows on standard net/http ServeMux via genkit.Handler.',
        code: `package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/genkit-ai/genkit/go/ai"
	"github.com/genkit-ai/genkit/go/genkit"
	"github.com/genkit-ai/genkit/go/plugins/googlegenai"
	"github.com/genkit-ai/genkit/go/plugins/server"
)

type LedgerInput struct {
	AccountID string    \`json:"accountId" jsonschema:"description=Account identifier"\`
	Amounts   []float64 \`json:"amounts" jsonschema:"description=Signed transaction amounts"\`
}

func main() {
	ctx := context.Background()
	g := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))

	sumTool := genkit.DefineTool(g, "sumLedgerTool",
		"Calculates the exact signed sum of credit and debit amounts",
		func(ctx *ai.ToolContext, in LedgerInput) (float64, error) {
			var total float64
			for _, v := range in.Amounts {
				total += v
			}
			return total, nil
		},
	)

	genkit.DefineFlow(g, "reconcileLedgerFlow", func(ctx context.Context, in LedgerInput) (string, error) {
		return genkit.GenerateText(ctx, g,
			ai.WithModelName("googleai/gemini-flash-latest"),
			ai.WithPrompt("Reconcile account %s: %v", in.AccountID, in.Amounts),
			ai.WithTools(sumTool),
		)
	})

	mux := http.NewServeMux()
	for _, f := range genkit.ListFlows(g) {
		mux.HandleFunc("POST /"+f.Name(), genkit.Handler(f))
	}
	log.Fatal(server.Start(ctx, "127.0.0.1:8080", mux))
}`,
      },
      python: {
        filename: 'src/flows.py',
        explanation:
          'Decorate functions with @ai.tool() and @ai.flow(), and expose over FastAPI with serve_flow.',
        code: `from pydantic import BaseModel, Field
from genkit import Genkit
from genkit_google_genai import GoogleAI

ai = Genkit(plugins=[GoogleAI()], model='googleai/gemini-flash-latest')

class LedgerInput(BaseModel):
    account_id: str = Field(description='Account identifier')
    amounts: list[float] = Field(description='Signed transaction amounts')

@ai.tool(description='Sum signed credit and debit amounts accurately')
def sum_ledger_tool(input: LedgerInput) -> float:
    return round(sum(input.amounts), 2)

@ai.flow()
async def reconcile_ledger_flow(input: LedgerInput) -> str:
    response = await ai.generate(
        prompt=f'Reconcile account {input.account_id} with amounts {input.amounts}',
        tools=[sum_ledger_tool],
    )
    return response.text`,
      },
    },
  },
  {
    number: '04',
    id: 'multi-turn-agents',
    title: '04. Stateful Multi-Turn Agents & Sub-Agent Delegation',
    subtitle: 'Build conversational agents with sessions, snapshots, branching, and human-in-the-loop interrupts',
    summary:
      'Whenever a task is conversational, multi-turn, or requires persistent state, use `defineAgent` rather than hand-rolling a generate loop inside a flow. Genkit agents support pluggable session stores (`InMemorySessionStore`, `FileSessionStore`), branching from snapshots, and sub-agent orchestration.',
    keyRules: [
      'Use `defineAgent` for conversational/stateful workflows; reserve `defineFlow` for single-shot stateless pipelines.',
      'To test an agent via `genkit flow:run`, wrap a single turn `agent.chat().send(...)` inside a thin wrapper flow.',
      'In Go, enable experimental agent APIs via `genkit.Init(ctx, genkit.WithExperimental())` and import `genkit/exp` as `genkitx`.',
    ],
    codeByLang: {
      js: {
        filename: 'src/agent.ts',
        explanation:
          'Define a persistent multi-turn agent with session storage and Built-in Skills/Middleware.',
        code: `import { ai } from './index';
import { sumLedgerTool } from './flows';
import { skills, filesystem } from '@genkit-ai/middleware';

export const auditorAgent = ai.defineAgent({
  name: 'auditorAgent',
  description: 'Stateful financial auditor that inspects ledgers and answers follow-up questions',
  system: 'You are a meticulous financial auditor. Always verify totals with sumLedgerTool.',
  tools: [sumLedgerTool],
  use: [
    skills({ skillPaths: ['./skills'] }),
    filesystem({ rootDir: './workspace' }),
  ],
});

export async function runAgentTurn(userMessage: string) {
  const chat = auditorAgent.chat();
  const response = await chat.send(userMessage);
  return response.text;
}`,
      },
      dart: {
        filename: 'bin/agent.dart',
        explanation:
          'Use package:genkit/experimental.dart and package:genkit_middleware for multi-agent delegation.',
        code: `import 'package:genkit/genkit.dart';
import 'package:genkit/experimental.dart';
import 'package:genkit_google_genai/genkit_google_genai.dart';
import 'package:genkit_middleware/genkit_middleware.dart';

void main() async {
  final ai = Genkit(plugins: [googleAI()]);
  final store = InMemorySessionStore();

  final specialist = ai.defineAgent(
    name: 'taxSpecialist',
    description: 'Computes regional tax withholdings and credit adjustments',
    model: googleAI.gemini('gemini-flash-latest'),
    system: 'Provide exact tax treatment rules for ledger credits.',
  );

  final leadAuditor = ai.defineAgent(
    name: 'leadAuditor',
    description: 'Primary accounting agent that coordinates ledger audits',
    model: googleAI.gemini('gemini-flash-latest'),
    system: 'Coordinate the audit and delegate tax questions to taxSpecialist.',
    use: [
      agents([specialist]),
      skills(skillDirs: ['skills']),
    ],
    sessionStore: store,
  );

  final chat = leadAuditor.chat();
  final reply = await chat.send('Audit account A-104 with credit -20.10 and debit 100.25');
  print(reply.text);
}`,
      },
      go: {
        filename: 'agent.go',
        explanation:
          'Initialize with genkit.WithExperimental() and define a stateful agent using genkitx.DefineAgent.',
        code: `package main

import (
	"context"
	"fmt"
	"log"

	"github.com/genkit-ai/genkit/go/ai"
	aix "github.com/genkit-ai/genkit/go/ai/exp"
	"github.com/genkit-ai/genkit/go/ai/exp/localstore"
	"github.com/genkit-ai/genkit/go/genkit"
	genkitx "github.com/genkit-ai/genkit/go/genkit/exp"
	"github.com/genkit-ai/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithExperimental(),
	)

	store := localstore.NewInMemorySessionStore()
	agent := genkitx.DefineAgent(g, "auditorAgent",
		aix.WithModelName("googleai/gemini-flash-latest"),
		aix.WithSystem("You are a financial auditor."),
		aix.WithSessionStore(store),
	)

	chat := agent.Chat(ctx)
	resp, err := chat.Send(ctx, ai.WithPrompt("Hello! Ready to audit the Q3 ledger."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(resp.Text())
}`,
      },
      python: {
        filename: 'src/agent.py',
        explanation:
          'Use ai.define_agent with InMemorySessionStore and chat.send() / chat.send_stream().',
        code: `from genkit import Genkit
from genkit.agent import InMemorySessionStore
from genkit_google_genai import GoogleAI

ai = Genkit(plugins=[GoogleAI()], model='googleai/gemini-flash-latest')

auditor_agent = ai.define_agent(
    name='auditor_agent',
    description='Multi-turn accounting auditor',
    system='You verify signed transaction ledgers and explain every adjustment.',
    session_store=InMemorySessionStore(),
)

async def main():
    chat = auditor_agent.chat()
    res = await chat.send('Verify ledger rows: +100.25, -20.10, +5.00')
    print(res.text)

if __name__ == '__main__':
    ai.run_main(main())`,
      },
    },
  },
  {
    number: '05',
    id: 'mcp-integration',
    title: '05. Model Context Protocol (MCP) & Dart MCP Server',
    subtitle: 'Connect `dart mcp-server` and external MCP tools into the Genkit registry via `defineMcpHost`',
    summary:
      'Genkit integrates natively with the Model Context Protocol (`genkit_mcp` in Dart, `@genkit-ai/mcp` in JS). You can aggregate multiple stdio or Streamable HTTP MCP servers (such as `dart mcp-server`) into a cached MCP Host and expose their tools via wildcards (`my-host:tool/dart/*`).',
    keyRules: [
      'Namespaced MCP tool names (e.g. `dart/analyze_files`) are shortened on the wire to `analyze_files` while preserving `metadata.originalName`.',
      'Prefer `defineMcpHost` with `McpHostOptionsWithCache` to register tools into the Genkit registry automatically.',
      'For remote MCP servers over Streamable HTTP, pass `url: Uri.parse("https://...")` to `McpServerConfig`.',
    ],
    codeByLang: {
      js: {
        filename: 'src/mcp_host.ts',
        explanation:
          'Register the `dart mcp-server` stdio server in Node.js/TypeScript and invoke its tools.',
        code: `import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineMcpHost } from '@genkit-ai/mcp';

const ai = genkit({ plugins: [googleAI()] });

export const mcpHost = defineMcpHost(ai, {
  name: 'workspace-mcp',
  mcpServers: {
    dart: {
      command: 'dart',
      args: ['mcp-server'],
    },
  },
});

export async function analyzeDartWorkspace() {
  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: 'Run static analysis and summarize any issues in the Dart project.',
    tools: ['workspace-mcp:tool/dart/*'],
  });
  return response.text;
}`,
      },
      dart: {
        filename: 'bin/mcp_host.dart',
        explanation:
          'Official developing-genkit-dart pattern using defineMcpHost and McpHostOptionsWithCache with `dart mcp-server`.',
        code: `import 'package:genkit/genkit.dart';
import 'package:genkit_google_genai/genkit_google_genai.dart';
import 'package:genkit_mcp/genkit_mcp.dart';

void main() async {
  final ai = Genkit(plugins: [googleAI()]);

  // Connect to the Dart MCP server over stdio
  final host = defineMcpHost(
    ai,
    McpHostOptionsWithCache(
      name: 'my-host',
      mcpServers: {
        'dart': McpServerConfig(
          command: 'dart',
          args: ['mcp-server'],
        ),
      },
    ),
  );

  // Discover and execute tools dynamically using a wildcard
  final response = await ai.generate(
    model: googleAI.gemini('gemini-flash-latest'),
    prompt: 'Inspect the workspace packages and run dart analyze via MCP',
    toolNames: ['my-host:tool/dart/*'],
  );

  print(response.text);
  await host.close();
}`,
      },
      go: {
        filename: 'mcp_bridge.go',
        explanation:
          'Configure mcp.json alongside Genkit Go flows to expose MCP tools to your agent workspace.',
        code: `// mcp.json in workspace root:
// {
//   "mcpServers": {
//     "dart": {
//       "command": "dart",
//       "args": ["mcp-server"]
//     }
//   }
// }

package main

import (
	"context"
	"fmt"

	"github.com/genkit-ai/genkit/go/ai"
	"github.com/genkit-ai/genkit/go/genkit"
	"github.com/genkit-ai/genkit/go/plugins/googlegenai"
	"github.com/genkit-ai/genkit/go/plugins/middleware"
)

func runWithSkillsAndMcp(ctx context.Context) (string, error) {
	g := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	return genkit.GenerateText(ctx, g,
		ai.WithModelName("googleai/gemini-flash-latest"),
		ai.WithUse(middleware.Skills("./skills")),
		ai.WithPrompt("Load developing-genkit-go and verify flow handlers."),
	)
}`,
      },
      python: {
        filename: 'src/mcp_workflow.py',
        explanation:
          'Combine Genkit Python flows with MCP server configurations and skill middleware.',
        code: `import json
from pathlib import Path
from genkit import Genkit
from genkit_google_genai import GoogleAI

ai = Genkit(plugins=[GoogleAI()], model='googleai/gemini-flash-latest')

@ai.flow()
async def verify_mcp_config() -> dict:
    mcp_cfg = json.loads(Path('mcp.json').read_text(encoding='utf-8'))
    servers = list(mcp_cfg.get('mcpServers', {}).keys())
    res = await ai.generate(
        prompt=f'Registered MCP servers: {servers}. Confirm dart mcp-server readiness.'
    )
    return {'servers': servers, 'summary': res.text}`,
      },
    },
  },
  {
    number: '06',
    id: 'trace-verification',
    title: '06. Trace-Driven Debugging & Non-Interactive CLI Verification',
    subtitle: 'Wrap execution with `genkit start`, test one-shot flows with `genkit flow:run`, and inspect JSON traces',
    summary:
      'Running your app directly (`node`, `dart run`, `go run`, `uv run`) skips Genkit trace collection — leaving you debugging blind. All 4 skills in `skill-genkit` enforce verifying every flow and tool call by inspecting captured telemetry traces.',
    keyRules: [
      'Use `genkit flow:run <flowName> \'<json>\' -- <runCmd>` for self-terminating checks in CI and autonomous agent loops.',
      'Pass `--non-interactive` before `--` so the CLI never blocks on first-run prompts.',
      'Use `genkit trace:get <traceId> --format json` when piping trace output into `jq` or automated validators.',
    ],
    codeByLang: {
      js: {
        filename: 'terminal-workflow-js.sh',
        explanation:
          'Run a self-terminating flow check and inspect the resulting Trace ID in JSON format.',
        code: `# 1. Self-terminating one-shot flow run (captures trace & exits cleanly)
genkit flow:run --non-interactive reconcileLedgerFlow '{"accountId":"ACC-01","amounts":[100.25,-20.10,5.00]}' -- npx tsx src/flows.ts

# 2. List recent traces and inspect the full execution tree
genkit trace:list
genkit trace:get <traceId> --format json | jq '.spans'

# 3. Persistent Dev UI server for interactive debugging
genkit start --non-interactive -- npx tsx --watch src/index.ts`,
      },
      dart: {
        filename: 'terminal-workflow-dart.sh',
        explanation:
          'Verify Dart compilation with `dart analyze` first, then run under Genkit CLI.',
        code: `# 1. Always verify clean compilation and schemantic codegen first
dart run build_runner build --delete-conflicting-outputs
dart analyze

# 2. Execute one-shot flow with trace capture
genkit flow:run --non-interactive reconcileLedgerFlow '{"accountId":"ACC-01","amounts":[100.25,-20.10,5.00]}' -- dart run bin/server.dart

# 3. Inspect tool calls and model I/O in the captured trace
genkit trace:get <traceId> --format json`,
      },
      go: {
        filename: 'terminal-workflow-go.sh',
        explanation:
          'Run Go flows through `genkit flow:run` to prove tool calls fired and inspect struct output.',
        code: `# 1. Verify compilation
go vet ./...

# 2. Run flow once and capture trace ID
genkit flow:run --non-interactive reconcileLedgerFlow '{"accountId":"ACC-01","amounts":[100.25,-20.10,5.00]}' -- go run .

# 3. Inspect trace spans
genkit trace:list
genkit trace:get <traceId> --format json`,
      },
      python: {
        filename: 'terminal-workflow-python.sh',
        explanation:
          'Wrap `uv run` with `genkit flow:run` or `genkit start` so `ai.run_main()` records full traces.',
        code: `# 1. One-shot flow execution via uv
genkit flow:run --non-interactive reconcile_ledger_flow '{"account_id":"ACC-01","amounts":[100.25,-20.10,5.00]}' -- uv run src/flows.py

# 2. Fetch machine-readable trace JSON
genkit trace:get <traceId> --format json

# 3. Start persistent Dev UI with uv
genkit start --non-interactive -- uv run src/main.py`,
      },
    },
  },
];

export interface MigrationRule {
  language: string;
  deprecatedPattern: string;
  v1Replacement: string;
  reason: string;
}

export const V1_MIGRATION_RULES: MigrationRule[] = [
  {
    language: 'JS / Python',
    deprecatedPattern: 'response.text()',
    v1Replacement: 'response.text',
    reason: 'In Genkit 1.0, `text` and `output` are getter properties on GenerateResponse, not methods.',
  },
  {
    language: 'JS / TS',
    deprecatedPattern: 'configureGenkit({ plugins: [...] })',
    v1Replacement: 'const ai = genkit({ plugins: [...] })',
    reason: 'Global singleton configuration was removed in v1.0 in favor of explicit `ai` instances.',
  },
  {
    language: 'Dart 1.0',
    deprecatedPattern: 'startFlowServer(flows: [...])',
    v1Replacement: 'GenkitRouter()..addFlow(myFlow)..serve()',
    reason: 'HTTP flow serving is now handled by `GenkitRouter` in `package:genkit/io.dart` or `genkit_shelf`.',
  },
  {
    language: 'Dart 1.0',
    deprecatedPattern: 'ctx.interrupt() / ToolInterruptException',
    v1Replacement: 'return .interrupt(...) / ai.defineInterrupt(...)',
    reason: 'Human-in-the-loop interrupts return structured interrupt results rather than throwing exceptions.',
  },
  {
    language: 'Dotprompt',
    deprecatedPattern: 'fieldName(description): string',
    v1Replacement: 'fieldName: string, description',
    reason: 'Spec-compliant Picoschema places the description after a comma following the type.',
  },
];

export function buildSkillGenkitHarnessTree(lang: GenkitLang): Tree {
  const spec = GENKIT_LANGUAGES[lang];
  const step2 = SKILL_GENKIT_STEPS[1].codeByLang[lang];
  const step3 = SKILL_GENKIT_STEPS[2].codeByLang[lang];
  const skillId = `developing_genkit_${lang}`;

  return {
    'systemprompt.md': `You are an expert Genkit 1.0 engineer.
When building, debugging, or verifying Genkit applications in ${spec.label}, load the \`${skillId}\` skill.
Always verify execution using \`genkit flow:run\` and inspect traces via \`genkit trace:get <id> --format json\`.\n`,
    'guardrails.md': `- Never run the application blind without capturing Genkit traces.\n- Never use pre-1.0 deprecated APIs (such as configureGenkit or response.text()).\n- When ${spec.label} Genkit tasks arise, load the \`${skillId}\` skill.\n`,
    'LongTermMEMORY.md': `Genkit 1.0 uses explicit SDK instances, typed schemas (${spec.schemaLib}), and MCP server integration via mcp.json.\n`,
    'tool_descriptions/tool_guidance.md': `Use the Genkit CLI (\`genkit docs:search\`, \`genkit flow:run\`, \`genkit trace:get\`) and the configured \`dart mcp-server\` MCP server to inspect and verify code.\n`,
    [`skills/${skillId}/SKILL.md`]: `---
name: ${skillId}
description: Develop and verify Genkit 1.0 applications, flows, tools, MCP hosts, and multi-turn agents in ${spec.label}
---

# ${spec.skillName} (from chrisfbaileycb-arch/skill-genkit)

## 1. Initialization & Structured Output (${step2.filename})
\`\`\`
${step2.code}
\`\`\`

## 2. Flows & Tool Calling (${step3.filename})
\`\`\`
${step3.code}
\`\`\`

## 3. Trace Verification Commands
- Start with trace capture: \`${spec.startCommand}\`
- One-shot flow test: \`${spec.flowRunCommand}\`
`,
    'scripts/verify_genkit_trace.py': `import json
import sys

def verify_trace(path: str) -> None:
    data = json.loads(open(path, encoding="utf-8").read())
    spans = data.get("spans", {})
    print(f"Verified {len(spans)} Genkit trace spans.")

if __name__ == "__main__":
    verify_trace(sys.argv[1])
`,
    'mcp.json': JSON.stringify(
      {
        mcpServers: {
          dart: {
            command: 'dart',
            args: ['mcp-server'],
          },
        },
      },
      null,
      2
    ),
  };
}

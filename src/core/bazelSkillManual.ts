import { Tree } from './harnessEngine';

export type BazelTargetStack = 'bazel-core' | 'dart-genkit' | 'flutter-multiplatform' | 'sdk-release';

export interface BazelStackProfile {
  id: BazelTargetStack;
  label: string;
  subtitle: string;
  badge: string;
  keyRules: string[];
  primaryCommand: string;
}

export interface BazelStepGuide {
  stepNumber: number;
  id: string;
  title: string;
  category: 'Skill Setup' | 'Bzlmod Core' | 'Dart & Genkit' | 'Flutter & SDK' | 'CI & RBE';
  summary: string;
  whyItMatters: string;
  executionChecklist: string[];
  codeBlocks: Record<
    BazelTargetStack,
    {
      filename: string;
      language: string;
      code: string;
      verificationCmd: string;
      expectedOutput: string;
    }
  >;
}

export interface AppAnalysisPreset {
  id: string;
  name: string;
  stackType: string;
  description: string;
  filesSummary: string[];
  sampleManifest: string;
  scores: {
    hermeticity: number;
    bzlmodReadiness: number;
    cacheGranularity: number;
    sdkDeploymentMaturity: number;
  };
  diagnostics: {
    severity: 'CRITICAL' | 'HIGH' | 'RECOMMENDED';
    area: string;
    finding: string;
    fix: string;
    command: string;
  }[];
  recommendedModuleBazel: string;
  recommendedBuildBazel: string;
  deploymentPipelineCommands: string[];
}

export const BAZEL_STACK_PROFILES: BazelStackProfile[] = [
  {
    id: 'dart-genkit',
    label: 'Dart SDK + Genkit + MCP Server',
    subtitle: 'Hermetic Dart 3.10+ AOT binaries, build_runner .g.dart schemas & dart mcp-server',
    badge: 'rules_dart + genkit',
    keyRules: ['dart_sdk_extension', 'dart_codegen_library', 'dart_aot_binary', 'dart_test'],
    primaryCommand: 'bazel build //bin:genkit_agent_aot && bazel test //test:all',
  },
  {
    id: 'flutter-multiplatform',
    label: 'Flutter Web (Wasm) + Mobile + Desktop',
    subtitle: 'Hermetic Flutter SDK engine, multi-package feature graph, Web Wasm & Android/iOS bundles',
    badge: 'rules_flutter',
    keyRules: ['flutter_sdk_repo', 'flutter_library', 'flutter_web_wasm', 'flutter_apk_release'],
    primaryCommand: 'bazel build --config=release //apps/customer_portal:flutter_web_bundle',
  },
  {
    id: 'sdk-release',
    label: 'Multi-Language SDK & OCI Deployment',
    subtitle: 'Packaging Dart, Flutter & Protobuf SDKs into OCI containers, tarballs & pub/npm registries',
    badge: 'rules_pkg + rules_oci',
    keyRules: ['pkg_tar', 'oci_image', 'oci_push', 'sdk_checksum_manifest'],
    primaryCommand: 'bazel run //deploy:push_genkit_sdk_oci -- --tag=v1.4.0',
  },
  {
    id: 'bazel-core',
    label: 'Bazel Master Core (chrisfbaileycb-arch/bazel)',
    subtitle: 'Bzlmod MODULE.bazel, hermetic LLVM cross-compile, RBE Ubuntu 24.04 & Starlark rules',
    badge: 'Bazel 10.0 Bzlmod',
    keyRules: ['bazel_dep', 'single_version_override', 'http_file', 'rbe_config_extension'],
    primaryCommand: 'bazel mod deps --lockfile_mode=update && bazel build --config=llvm //src:bazel',
  },
];

export const BAZEL_SKILL_MD_CONTENT = `---
name: developing_bazel
description: Author hermetic Bzlmod (MODULE.bazel) builds, custom Starlark rules, and end-to-end Dart, Flutter, and multi-platform SDK deployments grounded in chrisfbaileycb-arch/bazel
---

# Developing with Bazel (\`chrisfbaileycb-arch/bazel\`) — Agent Coding Skill

You are an expert Bazel build engineer and systems architect. Whenever a task involves creating, migrating, optimizing, analyzing, or deploying builds with Bazel—especially involving **Bzlmod (\`MODULE.bazel\`)**, **Dart (\`dart_binary\`, \`dart_library\`, \`build_runner\`, \`dart mcp-server\`)**, **Flutter (\`flutter_web\`, \`flutter_apk\`, \`flutter_ipa\`)**, or **SDK packaging (\`rules_pkg\`, \`rules_oci\`)**—follow these strict instructions.

## 1. Mandatory Core Rules (Bzlmod & Hermeticity)

1. **Always Use Bzlmod (\`MODULE.bazel\`) Over Legacy \`WORKSPACE\`**:
   - Declare \`module(name = "...", version = "...", repo_name = "...")\`.
   - Declare direct dependencies with \`bazel_dep(name = "...", version = "...")\`.
   - Set \`repo_name = None\` on indirect version-pinning \`bazel_dep\` entries so targets cannot accidentally import transitive modules directly.
   - Always refresh the lockfile after editing \`MODULE.bazel\`:
     \`\`\`bash
     bazel mod deps --lockfile_mode=update
     \`\`\`
2. **Pin External SDKs & Binaries with SHA-256 Integrity**:
   - Use \`use_repo_rule("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")\` or \`http_file\` with explicit \`integrity = "sha256-..."\` hashes for every target OS/CPU (\`linux_amd64\`, \`linux_arm64\`, \`macos_arm64\`, \`windows_amd64\`).
   - Never invoke unpinned host binaries (\`/usr/bin/dart\`, \`flutter\`, \`protoc\`) inside a Starlark \`ctx.actions.run\`.
3. **Enforce \`.bazelrc\` Guardrails (from \`chrisfbaileycb-arch/bazel/.bazelrc\`)**:
   - \`common --check_direct_dependencies=error\`
   - \`common --module_mirrors=https://bcr.cloudflaremirrors.com\`
   - \`common:ci-common --lockfile_mode=error\`
   - \`try-import %workspace%/user.bazelrc\`
4. **Style Guide (\`.gemini/styleguide.md\`)**:
   - Do not mention the PR author in Pull Request Summaries.
   - Keep summaries concise and focused on build graph and toolchain changes.

## 2. Hermetic Dart, Genkit & Flutter Rules

1. **Hermetic Dart & Genkit Codegen**:
   - Run \`dart run build_runner build --delete-conflicting-outputs\` via a hermetic Starlark rule that takes \`pubspec.lock\` and \`lib/**/*.dart\` as explicit inputs and declares \`.g.dart\` files as outputs.
   - Compile production servers to self-contained native executables with \`dart compile exe\`.
2. **Flutter Multi-Package Build Graph**:
   - Decompose monolithic Flutter apps into granular Bazel packages (\`//packages/design_system\`, \`//packages/domain\`, \`//packages/genkit_client\`, \`//apps/mobile_web\`) with strict \`visibility\` declarations.
3. **Deterministic SDK & Container Deployment**:
   - Package artifacts with \`@rules_pkg//pkg:tar.bzl\` (\`pkg_tar\`) and \`@rules_oci//oci:defs.bzl\` (\`oci_image\`, \`oci_push\`) for zero-drift container and SDK releases.
4. **Verification Script**:
   - Always run \`python scripts/bazel_audit.py\` to verify \`MODULE.bazel\`, \`.bazelrc\`, and \`mcp.json\` compliance.
`;

export const BAZEL_AUDIT_SCRIPT_CONTENT = `import json
import pathlib
import sys

def audit(root_dir: str) -> dict:
    root = pathlib.Path(root_dir)
    findings = []
    if not (root / "MODULE.bazel").exists():
        findings.append("MISSING_MODULE_BAZEL: Migrate legacy WORKSPACE to MODULE.bazel")
    if (root / ".bazelrc").exists():
        rc = (root / ".bazelrc").read_text()
        if "--check_direct_dependencies=error" not in rc:
            findings.append("BAZELRC_DIRECT_DEPS: Add common --check_direct_dependencies=error")
    return {"ok": len(findings) == 0, "findings": findings}

if __name__ == "__main__":
    print(json.dumps(audit(sys.argv[1] if len(sys.argv) > 1 else "."), indent=2))
`;

export const BAZEL_IMPLEMENTATION_STEPS: BazelStepGuide[] = [
  {
    stepNumber: 1,
    id: 'step-1-install-skill',
    title: 'Step 1: Implement & Register the Agent Bazel Coding Skill',
    category: 'Skill Setup',
    summary:
      'Create the developing_bazel skill directory, companion audit script, trigger rules in guardrails.md / AGENTS.md, and .gemini/styleguide.md.',
    whyItMatters:
      'Coding agents require both an explicit SKILL.md instruction surface and an always-on trigger line in guardrails.md or AGENTS.md so the skill is loaded automatically whenever MODULE.bazel, BUILD.bazel, .bzl, Dart, or Flutter build tasks appear.',
    executionChecklist: [
      'Create skills/developing_bazel/SKILL.md (OpenCode) or .agents/skills/developing_bazel/SKILL.md (Codex / Claude Code).',
      'Add scripts/bazel_audit.py so the agent can deterministically verify MODULE.bazel and .bazelrc invariants.',
      'Add the trigger line to guardrails.md or AGENTS.md so Harness² validateTree passes with 0 errors.',
      'Configure .gemini/styleguide.md with concise PR summary rules from chrisfbaileycb-arch/bazel.',
    ],
    codeBlocks: {
      'dart-genkit': {
        filename: 'install-bazel-skill.sh',
        language: 'bash',
        code: `# 1. Create the Agent Bazel Skill directory structure
mkdir -p .claude/skills/developing_bazel \\
         .agents/skills/developing_bazel \\
         skills/developing_bazel \\
         scripts .gemini

# 2. Copy SKILL.md into your active agent harness surface
cp skills/developing-bazel/SKILL.md skills/developing_bazel/SKILL.md
cp skills/developing-bazel/SKILL.md .claude/skills/developing_bazel/SKILL.md
cp skills/developing-bazel/SKILL.md .agents/skills/developing_bazel/SKILL.md

# 3. Install the deterministic Bazel workspace audit script
cp skills/developing-bazel/scripts/bazel_audit.py scripts/bazel_audit.py

# 4. Register the trigger rule in guardrails.md / AGENTS.md
cat << 'EOF' >> guardrails.md
- When authoring MODULE.bazel, BUILD.bazel, Starlark .bzl rules, or deploying Dart, Flutter, and SDK targets, load the \`developing_bazel\` skill.
EOF

# 5. Add .gemini/styleguide.md from chrisfbaileycb-arch/bazel
cat << 'EOF' > .gemini/styleguide.md
# Gemini Code Assist Style Guide

## Pull Request Summary
*   Do not mention the PR author in the Pull Request Summary.
*   Be concise.
EOF`,
        verificationCmd: 'python3 scripts/bazel_audit.py .',
        expectedOutput: '{"status": "ok", "checks": ["MODULE.bazel present (Bzlmod enabled)", ".bazelrc enforces --check_direct_dependencies=error", "dart mcp-server configured in mcp.json"], "issues": []}',
      },
      'flutter-multiplatform': {
        filename: 'AGENTS.md',
        language: 'markdown',
        code: `# Agent Workspace Instructions (Bazel + Flutter + Dart SDK)

- When authoring MODULE.bazel, BUILD.bazel, Starlark .bzl rules, or deploying Dart, Flutter, and SDK targets, read .agents/skills/developing_bazel/SKILL.md and follow it.
- When building Genkit flows, tools, or @Schema() models in Dart, read .agents/skills/developing_genkit_dart/SKILL.md and follow it.
- Always run \`python3 scripts/bazel_audit.py\` and \`bazel mod deps --lockfile_mode=update\` after modifying MODULE.bazel.`,
        verificationCmd: 'ls -la .agents/skills/developing_bazel/SKILL.md .gemini/styleguide.md',
        expectedOutput: '-rw-r--r-- 1 dev staff 3412 Oct 19 05:05 .agents/skills/developing_bazel/SKILL.md\n-rw-r--r-- 1 dev staff  126 Oct 19 05:05 .gemini/styleguide.md',
      },
      'sdk-release': {
        filename: 'mcp.json',
        language: 'json',
        code: `{
  "mcpServers": {
    "dart": {
      "command": "dart",
      "args": ["mcp-server"]
    },
    "genkit": {
      "command": "genkit",
      "args": ["mcp"]
    }
  }
}`,
        verificationCmd: 'dart mcp-server --help | head -n 5',
        expectedOutput: 'Dart MCP Server — Exposes Dart & Flutter analyzer, pub, test, and tooling over Model Context Protocol (stdio).',
      },
      'bazel-core': {
        filename: '.gemini/styleguide.md',
        language: 'markdown',
        code: `# Gemini Code Assist Style Guide

## Pull Request Summary
*   Do not mention the PR author in the Pull Request Summary.
*   Be concise.

## Bazel & Starlark Review Standards
*   Verify MODULE.bazel changes include updated MODULE.bazel.lock via \`bazel mod deps --lockfile_mode=update\`.
*   Ensure all http_archive / http_file declarations include SHA-256 \`integrity\` attributes.
*   Prefer \`repo_name = None\` on indirect \`bazel_dep\` declarations.`,
        verificationCmd: 'git status --short .gemini/styleguide.md skills/developing_bazel/SKILL.md',
        expectedOutput: 'A  .gemini/styleguide.md\nA  skills/developing_bazel/SKILL.md',
      },
    },
  },
  {
    stepNumber: 2,
    id: 'step-2-bzlmod-foundation',
    title: 'Step 2: Configure Bzlmod (MODULE.bazel) & .bazelrc Guardrails',
    category: 'Bzlmod Core',
    summary:
      'Set up MODULE.bazel, .bazelversion, and .bazelrc following chrisfbaileycb-arch/bazel standards with strict direct-dependency checks and BCR mirrors.',
    whyItMatters:
      'Legacy WORKSPACE files evaluate sequentially and suffer from diamond dependency conflicts. Bzlmod resolves module versions deterministically using Minimal Version Selection (MVS) and locks cryptographic hashes in MODULE.bazel.lock.',
    executionChecklist: [
      'Pin the Bazel version in .bazelversion (e.g., 8.1.1 or 10.0.0-prerelease) so Bazelisk uses the exact binary across dev and CI.',
      'Declare module() and direct bazel_dep() entries in MODULE.bazel (platforms, bazel_skylib, rules_pkg, rules_oci).',
      'Configure .bazelrc with --check_direct_dependencies=error, --module_mirrors=https://bcr.cloudflaremirrors.com, and --lockfile_mode=error for CI.',
      'Generate or update MODULE.bazel.lock with bazel mod deps --lockfile_mode=update.',
    ],
    codeBlocks: {
      'dart-genkit': {
        filename: 'MODULE.bazel',
        language: 'python',
        code: `"""Hermetic Bazel Bzlmod configuration for Dart + Genkit + Flutter SDK workspace."""

# NOTE: When editing this file, also update the lockfile:
#   bazel mod deps --lockfile_mode=update
module(
    name = "genkit_dart_workspace",
    version = "1.0.0",
    repo_name = "com_example_genkit_dart",
)

bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")
bazel_dep(name = "rules_oci", version = "2.2.0")
bazel_dep(name = "rules_shell", version = "0.8.0")

# Indirect module dependencies pinned with repo_name = None to prevent accidental direct imports
bazel_dep(name = "buildozer", version = "10.1.0.bcr.1", repo_name = None)
bazel_dep(name = "bazel_lib", version = "3.1.0", repo_name = None)

# Hermetic Dart & Flutter SDK extension (defined in Step 3)
dart_sdk = use_extension("//tools/build_defs:dart_sdk.bzl", "dart_sdk_extension")
dart_sdk.toolchain(
    name = "dart_sdk",
    dart_version = "3.10.0",
    flutter_version = "3.32.0",
)
use_repo(dart_sdk, "dart_sdk", "flutter_sdk")

register_toolchains(
    "@dart_sdk//:dart_toolchain",
    "@flutter_sdk//:flutter_toolchain",
)`,
        verificationCmd: 'bazel mod deps --lockfile_mode=update && bazel mod graph',
        expectedOutput: '<root> (genkit_dart_workspace@1.0.0)\n├───bazel_skylib@1.9.0\n├───platforms@1.1.0\n├───rules_oci@2.2.0\n├───rules_pkg@1.1.0\n└───rules_shell@0.8.0',
      },
      'flutter-multiplatform': {
        filename: '.bazelrc',
        language: 'ini',
        code: `# Hermetic Bzlmod & Toolchain flags (grounded in chrisfbaileycb-arch/bazel/.bazelrc)
common --check_direct_dependencies=error
common --module_mirrors=https://bcr.cloudflaremirrors.com
common --experimental_one_version_enforcement=ERROR

# Keep host environment variables from leaking into Dart/Flutter compile actions
build --incompatible_strict_action_env
test --incompatible_strict_action_env
test --test_output=errors

# Release profile for Flutter Web Wasm & Dart AOT binaries
build:release --compilation_mode=opt
build:release --stamp

# Remote Build Execution (RBE) shared profile
common:remote_shared --remote_executor=grpcs://remotebuildexecution.googleapis.com
common:remote_shared --remote_download_toplevel
common:remote_shared --remote_timeout=600
common:remote_shared --google_default_credentials
common:remote_shared --jobs=100

# CI enforcement: fail immediately if MODULE.bazel.lock is out of sync
common:ci-common --lockfile_mode=error

# User-specific overrides (ignored by git)
try-import %workspace%/user.bazelrc`,
        verificationCmd: 'bazel info release && bazel config',
        expectedOutput: 'release 8.1.1\nAvailable configurations: ci-common, release, remote_shared',
      },
      'sdk-release': {
        filename: 'MODULE.bazel',
        language: 'python',
        code: `module(
    name = "enterprise_polyglot_sdk",
    version = "2.4.0",
)

bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "protobuf", version = "29.3", repo_name = "com_google_protobuf")
bazel_dep(name = "grpc", version = "1.76.0.bcr.1", repo_name = "com_github_grpc_grpc")
bazel_dep(name = "rules_go", version = "0.62.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")
bazel_dep(name = "rules_oci", version = "2.2.0")

oci = use_extension("@rules_oci//oci:extensions.bzl", "oci")
oci.pull(
    name = "distroless_cc_debian12",
    digest = "sha256:6714977f9f02632c31377650c15d89a7efaebf4efbdb0f37c713c30fc013a86b",
    image = "gcr.io/distroless/cc-debian12",
    platforms = ["linux/amd64", "linux/arm64"],
)
use_repo(oci, "distroless_cc_debian12")`,
        verificationCmd: 'bazel mod show_repo @distroless_cc_debian12',
        expectedOutput: '@@rules_oci+//oci:distroless_cc_debian12 (pulled multi-arch OCI base image)',
      },
      'bazel-core': {
        filename: 'MODULE.bazel',
        language: 'python',
        code: `"""Bazel build and test dependencies (from chrisfbaileycb-arch/bazel)."""

# NOTE: When editing this file, also update the lockfile.
#   bazel mod deps --lockfile_mode=update
module(
    name = "bazel",
    version = "10.0.0-prerelease",
    repo_name = "io_bazel",
)

bazel_dep(name = "abseil-cpp", version = "20250814.1")
bazel_dep(name = "bazel_features", version = "1.50.0")
bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "blake3", version = "1.8.2.bcr.1")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_cc", version = "0.2.25")
bazel_dep(name = "rules_go", version = "0.62.0")
bazel_dep(name = "rules_java", version = "9.9.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")
bazel_dep(name = "rules_python", version = "1.9.2")
bazel_dep(name = "rules_shell", version = "0.8.0")
bazel_dep(name = "llvm", version = "0.8.21")

# Indirect module dependencies with repo_name = None
bazel_dep(name = "buildozer", version = "10.1.0.bcr.1", repo_name = None)
bazel_dep(name = "bazel_lib", version = "3.1.0", repo_name = None)`,
        verificationCmd: 'bazel mod deps --lockfile_mode=error',
        expectedOutput: 'INFO: Lockfile MODULE.bazel.lock is up-to-date and verified.',
      },
    },
  },
  {
    stepNumber: 3,
    id: 'step-3-dart-flutter-sdk-toolchain',
    title: 'Step 3: Pin Hermetic Dart & Flutter SDK Toolchains in Starlark',
    category: 'Dart & Genkit',
    summary:
      'Create a Bzlmod module extension (tools/build_defs/dart_sdk.bzl) that downloads and verifies the exact Dart SDK and Flutter SDK archives with SHA-256 integrity hashes.',
    whyItMatters:
      'Developer machines and CI runners often have mismatched Dart/Flutter versions installed globally. Pinning the SDK archive via http_archive with SHA-256 integrity guarantees byte-for-byte identical Dart AOT binaries and Flutter bundles everywhere.',
    executionChecklist: [
      'Create tools/build_defs/BUILD.bazel and tools/build_defs/dart_sdk.bzl.',
      'Detect host OS/architecture in repository_ctx (linux_x64, linux_arm64, macos_arm64, windows_x64) and select the matching SHA-256 integrity hash.',
      'Generate a synthetic BUILD.bazel inside the downloaded @dart_sdk and @flutter_sdk external repositories exposing dart, dartaotruntime, and flutter binaries.',
      'Verify toolchain resolution with bazel build @dart_sdk//:dart_bin.',
    ],
    codeBlocks: {
      'dart-genkit': {
        filename: 'tools/build_defs/dart_sdk.bzl',
        language: 'python',
        code: `"""Bzlmod module extension for hermetic Dart & Flutter SDK provisioning."""

_DART_SDK_ARTIFACTS = {
    "linux_x86_64": struct(
        url = "https://storage.googleapis.com/dart-archive/channels/stable/release/3.10.0/sdk/dartsdk-linux-x64-release.zip",
        sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ),
    "macos_aarch64": struct(
        url = "https://storage.googleapis.com/dart-archive/channels/stable/release/3.10.0/sdk/dartsdk-macos-arm64-release.zip",
        sha256 = "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    ),
}

def _dart_sdk_repo_impl(rctx):
    os_name = rctx.os.name.lower()
    arch = rctx.os.arch.lower()
    key = "macos_aarch64" if "mac" in os_name else "linux_x86_64"
    artifact = _DART_SDK_ARTIFACTS[key]

    rctx.download_and_extract(
        url = artifact.url,
        sha256 = artifact.sha256,
        stripPrefix = "dart-sdk",
    )

    rctx.file("BUILD.bazel", """
package(default_visibility = ["//visibility:public"])

exports_files(["bin/dart", "bin/dartaotruntime"])

filegroup(
    name = "sdk_files",
    srcs = glob(["bin/**", "lib/**", "version"]),
)
""")

dart_sdk_repo = repository_rule(
    implementation = _dart_sdk_repo_impl,
    attrs = {"dart_version": attr.string(default = "3.10.0")},
)

def _dart_sdk_ext_impl(mctx):
    for mod in mctx.modules:
        for tc in mod.tags.toolchain:
            dart_sdk_repo(name = tc.name, dart_version = tc.dart_version)

dart_sdk_extension = module_extension(
    implementation = _dart_sdk_ext_impl,
    tag_classes = {
        "toolchain": tag_class(attrs = {
            "name": attr.string(mandatory = True),
            "dart_version": attr.string(default = "3.10.0"),
            "flutter_version": attr.string(default = "3.32.0"),
        }),
    },
)`,
        verificationCmd: 'bazel query "@dart_sdk//..."',
        expectedOutput: '@dart_sdk//:bin/dart\n@dart_sdk//:bin/dartaotruntime\n@dart_sdk//:sdk_files',
      },
      'flutter-multiplatform': {
        filename: 'tools/build_defs/flutter_sdk.bzl',
        language: 'python',
        code: `"""Hermetic Flutter SDK repository rule with pinned engine artifacts."""

def _flutter_sdk_repo_impl(rctx):
    rctx.download_and_extract(
        url = "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.32.0-stable.tar.xz",
        sha256 = "f91a5d9024957e5e63f6f4421b60679a1e3c4c714bc1a39988d7f553b9f58f1a",
        stripPrefix = "flutter",
    )
    rctx.file("BUILD.bazel", """
package(default_visibility = ["//visibility:public"])

exports_files(["bin/flutter", "bin/dart"])

filegroup(
    name = "flutter_sdk_files",
    srcs = glob(["bin/**", "packages/**", "version"]),
)
""")

flutter_sdk_repo = repository_rule(
    implementation = _flutter_sdk_repo_impl,
    attrs = {"flutter_version": attr.string(default = "3.32.0")},
)`,
        verificationCmd: 'bazel query "@flutter_sdk//..."',
        expectedOutput: '@flutter_sdk//:bin/flutter\n@flutter_sdk//:bin/dart\n@flutter_sdk//:flutter_sdk_files',
      },
      'sdk-release': {
        filename: 'tools/build_defs/BUILD.bazel',
        language: 'python',
        code: `package(default_visibility = ["//visibility:public"])

exports_files([
    "dart_sdk.bzl",
    "flutter_sdk.bzl",
    "dart_rules.bzl",
    "flutter_rules.bzl",
])`,
        verificationCmd: 'bazel query //tools/build_defs:all',
        expectedOutput: '//tools/build_defs:dart_sdk.bzl\n//tools/build_defs:flutter_sdk.bzl',
      },
      'bazel-core': {
        filename: 'MODULE.bazel (http_file pattern)',
        language: 'python',
        code: `# Pattern from chrisfbaileycb-arch/bazel/MODULE.bazel:
# Pin platform-specific tool binaries with explicit SHA-256 integrity
http_file = use_repo_rule("@bazel_tools//tools/build_defs/repo:http.bzl", "http_file")

http_file(
    name = "jq_linux_arm64",
    executable = True,
    integrity = "sha256-TdLYoGYd8LIvG7mh+YMPBrbzuPfZEhGh7118TwaotKU=",
    urls = ["https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-arm64"],
)

http_file(
    name = "jq_macos_arm64",
    executable = True,
    integrity = "sha256-C75hnmY+DeLFUL4v4NJA0HZ5nW+KZStw+gSuqKg2Loo=",
    urls = ["https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-arm64"],
)`,
        verificationCmd: 'bazel build @jq_linux_arm64//file',
        expectedOutput: 'INFO: Found 1 target...\nTarget @@+http_file+jq_linux_arm64//file:file up-to-date.',
      },
    },
  },
  {
    stepNumber: 4,
    id: 'step-4-starlark-dart-genkit-rules',
    title: 'Step 4: Author Custom Starlark Rules for Dart AOT, Tests & Genkit Schemas',
    category: 'Dart & Genkit',
    summary:
      'Write tools/build_defs/dart_rules.bzl providing dart_library, dart_codegen_schema (for @Schema() .g.dart generation), dart_aot_binary, and dart_test.',
    whyItMatters:
      'Genkit Dart flows use schemantic (@Schema() annotations) requiring build_runner codegen (.g.dart). Wrapping build_runner and dart compile exe in Starlark actions ensures Bazel tracks every input .dart file, caches generated schemas, and produces self-contained native AOT binaries.',
    executionChecklist: [
      'Define DartLibraryInfo provider in tools/build_defs/dart_rules.bzl to propagate transitive Dart sources and pub package configs.',
      'Implement dart_codegen_schema rule to invoke build_runner hermetically and emit generated .g.dart outputs.',
      'Implement dart_aot_binary rule running `@dart_sdk//:bin/dart compile exe` to compile a standalone native binary.',
      'Implement dart_test rule with executable = True and test = True for `bazel test //...`.',
    ],
    codeBlocks: {
      'dart-genkit': {
        filename: 'tools/build_defs/dart_rules.bzl',
        language: 'python',
        code: `"""Custom Starlark rules for hermetic Dart libraries, Genkit @Schema codegen, and AOT binaries."""

DartLibraryInfo = provider(
    doc = "Propagates transitive Dart sources and package_config.json",
    fields = ["transitive_srcs", "package_config"],
)

def _dart_library_impl(ctx):
    trans_srcs = depset(
        direct = ctx.files.srcs,
        transitive = [dep[DartLibraryInfo].transitive_srcs for dep in ctx.attr.deps],
    )
    return [
        DefaultInfo(files = trans_srcs),
        DartLibraryInfo(
            transitive_srcs = trans_srcs,
            package_config = ctx.file.package_config,
        ),
    ]

dart_library = rule(
    implementation = _dart_library_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = [".dart"], mandatory = True),
        "deps": attr.label_list(providers = [DartLibraryInfo]),
        "package_config": attr.label(allow_single_file = [".json"]),
    },
)

def _dart_aot_binary_impl(ctx):
    out_bin = ctx.actions.declare_file(ctx.label.name)
    all_inputs = depset(
        direct = ctx.files.srcs + ctx.files.sdk_files,
        transitive = [dep[DartLibraryInfo].transitive_srcs for dep in ctx.attr.deps],
    )
    args = ctx.actions.args()
    args.add("compile")
    args.add("exe")
    if ctx.file.package_config:
        args.add("--packages=" + ctx.file.package_config.path)
    args.add(ctx.file.main.path)
    args.add("-o", out_bin.path)

    ctx.actions.run(
        executable = ctx.executable._dart_bin,
        arguments = [args],
        inputs = all_inputs,
        outputs = [out_bin],
        mnemonic = "DartCompileExe",
        progress_message = "Compiling Dart AOT binary %{label}",
        use_default_shell_env = False,
    )
    return [DefaultInfo(executable = out_bin, files = depset([out_bin]))]

dart_aot_binary = rule(
    implementation = _dart_aot_binary_impl,
    executable = True,
    attrs = {
        "main": attr.label(allow_single_file = [".dart"], mandatory = True),
        "srcs": attr.label_list(allow_files = [".dart"]),
        "deps": attr.label_list(providers = [DartLibraryInfo]),
        "package_config": attr.label(allow_single_file = [".json"]),
        "sdk_files": attr.label(default = Label("@dart_sdk//:sdk_files")),
        "_dart_bin": attr.label(
            default = Label("@dart_sdk//:bin/dart"),
            executable = True,
            cfg = "exec",
        ),
    },
)`,
        verificationCmd: 'bazel aquery "mnemonic(\'DartCompileExe\', //...)"',
        expectedOutput: 'action \'Compiling Dart AOT binary //bin:genkit_agent_aot\'\n  Mnemonic: DartCompileExe\n  Inputs: [bin/server.dart, lib/flows/recipe_flow.dart, lib/flows/recipe_flow.g.dart, ...]\n  Outputs: [bazel-out/k8-opt/bin/bin/genkit_agent_aot]',
      },
      'flutter-multiplatform': {
        filename: 'tools/build_defs/flutter_rules.bzl',
        language: 'python',
        code: `"""Hermetic Starlark rules for Flutter Web (Wasm/CanvasKit) and Mobile bundles."""

def _flutter_web_bundle_impl(ctx):
    out_dir = ctx.actions.declare_directory(ctx.label.name + "_web_build")
    args = ctx.actions.args()
    args.add("build")
    args.add("web")
    if ctx.attr.wasm:
        args.add("--wasm")
    args.add("--release")
    args.add("--output=" + out_dir.path)

    ctx.actions.run(
        executable = ctx.executable._flutter_bin,
        arguments = [args],
        inputs = ctx.files.srcs + ctx.files.assets + ctx.files.sdk_files,
        outputs = [out_dir],
        mnemonic = "FlutterBuildWeb",
        progress_message = "Building Flutter Web (Wasm) bundle %{label}",
        use_default_shell_env = False,
    )
    return [DefaultInfo(files = depset([out_dir]))]

flutter_web_bundle = rule(
    implementation = _flutter_web_bundle_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = [".dart", ".yaml", ".lock"], mandatory = True),
        "assets": attr.label_list(allow_files = True),
        "wasm": attr.bool(default = True),
        "sdk_files": attr.label(default = Label("@flutter_sdk//:flutter_sdk_files")),
        "_flutter_bin": attr.label(
            default = Label("@flutter_sdk//:bin/flutter"),
            executable = True,
            cfg = "exec",
        ),
    },
)`,
        verificationCmd: 'bazel aquery "mnemonic(\'FlutterBuildWeb\', //...)"',
        expectedOutput: 'action \'Building Flutter Web (Wasm) bundle //apps/customer_portal:web_bundle\'\n  Mnemonic: FlutterBuildWeb\n  Arguments: [build, web, --wasm, --release, --output=...]',
      },
      'sdk-release': {
        filename: 'tools/build_defs/sdk_checksum.bzl',
        language: 'python',
        code: `"""Starlark rule to generate SHA-256 release manifests for SDK artifacts."""

def _sdk_checksum_manifest_impl(ctx):
    out = ctx.actions.declare_file(ctx.label.name + ".sha256")
    ctx.actions.run_shell(
        inputs = ctx.files.artifacts,
        outputs = [out],
        command = "sha256sum $@ > " + out.path,
        arguments = [f.path for f in ctx.files.artifacts],
        mnemonic = "SdkChecksumManifest",
    )
    return [DefaultInfo(files = depset([out]))]

sdk_checksum_manifest = rule(
    implementation = _sdk_checksum_manifest_impl,
    attrs = {
        "artifacts": attr.label_list(allow_files = True, mandatory = True),
    },
)`,
        verificationCmd: 'bazel build //deploy:sdk_release_checksums',
        expectedOutput: 'Target //deploy:sdk_release_checksums up-to-date:\n  bazel-bin/deploy/sdk_release_checksums.sha256',
      },
      'bazel-core': {
        filename: 'src/test/shell/bazel/list_source_repository.bzl',
        language: 'python',
        code: `# Pattern from chrisfbaileycb-arch/bazel/MODULE.bazel:
# Expose custom repository rules to Bzlmod via use_repo_rule()
list_source_repository = use_repo_rule(
    "//src/test/shell/bazel:list_source_repository.bzl",
    "list_source_repository",
)
list_source_repository(name = "local_bazel_source_list")`,
        verificationCmd: 'bazel query @local_bazel_source_list//:all',
        expectedOutput: '@local_bazel_source_list//:sources',
      },
    },
  },
  {
    stepNumber: 5,
    id: 'step-5-dart-genkit-build-targets',
    title: 'Step 5: Build & Test Dart + Genkit Flows with BUILD.bazel',
    category: 'Dart & Genkit',
    summary:
      'Wire up BUILD.bazel targets for your Dart Genkit library (lib/flows/), generated .g.dart schemas, native AOT server binary (bin/), and unit tests (test/).',
    whyItMatters:
      'Instead of recompiling the entire Dart application on every edit, Bazel only rebuilds the specific dart_library package whose sources or schemas changed, cutting incremental build and test latency to milliseconds.',
    executionChecklist: [
      'Run `dart run build_runner build --delete-conflicting-outputs` or the Bazel codegen target whenever @Schema() interfaces change.',
      'Declare `dart_library` in `lib/flows/BUILD.bazel` including both `recipe_flow.dart` and `recipe_flow.g.dart`.',
      'Declare `dart_aot_binary` in `bin/BUILD.bazel` depending on `//lib/flows:recipe_flow_lib`.',
      'Execute `bazel build //bin:genkit_agent_aot` and `bazel test //test:recipe_flow_test`.',
    ],
    codeBlocks: {
      'dart-genkit': {
        filename: 'bin/BUILD.bazel',
        language: 'python',
        code: `load("//tools/build_defs:dart_rules.bzl", "dart_aot_binary", "dart_library")

package(default_visibility = ["//visibility:public"])

dart_library(
    name = "recipe_flow_lib",
    srcs = [
        "lib/flows/recipe_flow.dart",
        "lib/flows/recipe_flow.g.dart",
    ],
    package_config = "//:.dart_tool/package_config.json",
)

dart_aot_binary(
    name = "genkit_agent_aot",
    main = "bin/server.dart",
    srcs = ["bin/server.dart"],
    deps = [":recipe_flow_lib"],
    package_config = "//:.dart_tool/package_config.json",
)`,
        verificationCmd: 'bazel build --config=release //bin:genkit_agent_aot && ./bazel-bin/bin/genkit_agent_aot --version',
        expectedOutput: 'INFO: Analyzed target //bin:genkit_agent_aot (14 packages loaded, 82 targets configured).\nINFO: Found 1 target...\nTarget //bin:genkit_agent_aot up-to-date:\n  bazel-bin/bin/genkit_agent_aot\ngenkit_agent_aot v1.0.0 (Dart 3.10.0 AOT)',
      },
      'flutter-multiplatform': {
        filename: 'packages/genkit_client/BUILD.bazel',
        language: 'python',
        code: `load("//tools/build_defs:dart_rules.bzl", "dart_library")

package(default_visibility = ["//apps:__subpackages__"])

dart_library(
    name = "genkit_client",
    srcs = glob([
        "lib/**/*.dart",
    ]),
    package_config = "//:.dart_tool/package_config.json",
)`,
        verificationCmd: 'bazel build //packages/genkit_client:genkit_client',
        expectedOutput: 'Target //packages/genkit_client:genkit_client up-to-date.',
      },
      'sdk-release': {
        filename: 'sdk/dart/BUILD.bazel',
        language: 'python',
        code: `load("@rules_pkg//pkg:tar.bzl", "pkg_tar")

pkg_tar(
    name = "dart_genkit_sdk_tar",
    srcs = [
        "//bin:genkit_agent_aot",
        "//packages/genkit_client:genkit_client",
    ],
    extension = "tar.gz",
    package_dir = "/opt/genkit-dart-sdk",
)`,
        verificationCmd: 'bazel build //sdk/dart:dart_genkit_sdk_tar',
        expectedOutput: 'Target //sdk/dart:dart_genkit_sdk_tar up-to-date:\n  bazel-bin/sdk/dart/dart_genkit_sdk_tar.tar.gz',
      },
      'bazel-core': {
        filename: 'BUILD.bazel (Root)',
        language: 'python',
        code: `package(default_visibility = ["//visibility:public"])

exports_files([
    ".dart_tool/package_config.json",
    "pubspec.yaml",
    "pubspec.lock",
    "mcp.json",
])`,
        verificationCmd: 'bazel query //:all',
        expectedOutput: '//:mcp.json\n//:pubspec.lock\n//:pubspec.yaml',
      },
    },
  },
  {
    stepNumber: 6,
    id: 'step-6-flutter-multiplatform-deployments',
    title: 'Step 6: Flutter Web (Wasm), Android, iOS & Desktop Bazel Targets',
    category: 'Flutter & SDK',
    summary:
      'Structure a multi-package Flutter workspace under Bazel so design system widgets, domain logic, and Genkit client libraries compile incrementally into Web Wasm, Android APK/AAB, and iOS IPA bundles.',
    whyItMatters:
      'Monolithic Flutter builds re-analyze and re-bundle the entire app on every change. Splitting into //packages/design_system, //packages/domain, and //apps/customer_portal lets Bazel cache 90%+ of the widget tree across local and CI runs.',
    executionChecklist: [
      'Organize Flutter features into isolated packages with explicit `deps` in `BUILD.bazel`.',
      'Enable `--wasm` in `flutter_web_bundle` for WebAssembly Skwasm rendering performance.',
      'Configure platform transitions (`--platforms=@build_bazel_rules_android//...` or `--config=release`) for mobile artifacts.',
      'Verify dependency isolation with `bazel query "somepath(//apps/customer_portal:all, //packages/design_system:all)"`.',
    ],
    codeBlocks: {
      'flutter-multiplatform': {
        filename: 'apps/customer_portal/BUILD.bazel',
        language: 'python',
        code: `load("//tools/build_defs:flutter_rules.bzl", "flutter_web_bundle")
load("@rules_pkg//pkg:tar.bzl", "pkg_tar")

package(default_visibility = ["//deploy:__subpackages__"])

flutter_web_bundle(
    name = "customer_portal_wasm",
    srcs = glob(["lib/**/*.dart"]) + [
        "pubspec.yaml",
        "pubspec.lock",
    ],
    assets = glob(["assets/**", "web/**"]),
    wasm = True,
)

pkg_tar(
    name = "customer_portal_cdn_archive",
    srcs = [":customer_portal_wasm"],
    extension = "tar.gz",
    strip_prefix = ".",
)`,
        verificationCmd: 'bazel build --config=release //apps/customer_portal:customer_portal_cdn_archive',
        expectedOutput: 'INFO: Executing FlutterBuildWeb //apps/customer_portal:customer_portal_wasm\nTarget //apps/customer_portal:customer_portal_cdn_archive up-to-date:\n  bazel-bin/apps/customer_portal/customer_portal_cdn_archive.tar.gz',
      },
      'dart-genkit': {
        filename: 'apps/customer_portal/lib/genkit_bridge.dart',
        language: 'dart',
        code: `import 'dart:convert';
import 'package:http/http.dart' as http;

/// Connects the Flutter Web Wasm client to the Bazel-built Dart Genkit AOT backend.
class GenkitFlowClient {
  final Uri baseUrl;
  const GenkitFlowClient(this.baseUrl);

  Future<Map<String, dynamic>> generateRecipe({
    required String ingredient,
    String dietaryRestriction = 'none',
  }) async {
    final response = await http.post(
      baseUrl.resolve('/api/flows/recipeGenerator'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'ingredient': ingredient,
        'dietaryRestriction': dietaryRestriction,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Flow error \${response.statusCode}: \${response.body}');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}`,
        verificationCmd: 'bazel test //apps/customer_portal/test:genkit_bridge_test',
        expectedOutput: '//apps/customer_portal/test:genkit_bridge_test                          PASSED in 0.4s',
      },
      'sdk-release': {
        filename: 'deploy/flutter_firebase_deploy.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Build hermetic Flutter Web Wasm bundle & Dart Genkit AOT backend via Bazel
bazel build --config=release \\
  //apps/customer_portal:customer_portal_wasm \\
  //bin:genkit_agent_aot

# 2. Stage deterministic output for CDN / Cloud Run deployment
rm -rf dist/web && mkdir -p dist/web
cp -R bazel-bin/apps/customer_portal/customer_portal_wasm_web_build/* dist/web/
echo "Staged hermetic Flutter Wasm bundle to dist/web/"`,
        verificationCmd: 'bash deploy/flutter_firebase_deploy.sh',
        expectedOutput: 'Staged hermetic Flutter Wasm bundle to dist/web/',
      },
      'bazel-core': {
        filename: '.bazelrc (Multi-Platform Flags)',
        language: 'ini',
        code: `# Cross-platform execution profiles (adapted from chrisfbaileycb-arch/bazel/.bazelrc)
common --host_macos_minimum_os=10.13
common --macos_minimum_os=10.13

common:windows_arm64 --platforms=//:windows_arm64
common:windows_arm64 --extra_toolchains=@local_config_cc//:cc-toolchain-arm64_windows

# Hermetic LLVM cross-compilation
common:llvm --extra_toolchains=@llvm//toolchain:all`,
        verificationCmd: 'bazel build --config=llvm --platforms=@llvm//platforms:linux_x86_64 //...',
        expectedOutput: 'INFO: Build completed successfully, 48 total actions',
      },
    },
  },
  {
    stepNumber: 7,
    id: 'step-7-sdk-oci-deployments',
    title: 'Step 7: Hermetic SDK Packaging & Distroless OCI Container Deployment',
    category: 'Flutter & SDK',
    summary:
      'Package your compiled Dart Genkit AOT binary, Flutter Web assets, and multi-language SDK artifacts into a reproducible Distroless OCI container and release tarball using rules_pkg and rules_oci.',
    whyItMatters:
      'Dockerfiles run `apt-get` and `pub get` with non-deterministic network state. `rules_oci` assembles OCI container layers directly from Bazel build outputs without requiring a Docker daemon, producing identical image digests on every build.',
    executionChecklist: [
      'Wrap `//bin:genkit_agent_aot` and `//apps/customer_portal:customer_portal_wasm` into a `pkg_tar` layer.',
      'Build a `rules_oci` `oci_image` on top of `@distroless_cc_debian12` with non-root user 65532.',
      'Generate a `sdk_checksum_manifest` containing SHA-256 digests for all published SDK archives.',
      'Push the image to Artifact Registry or GHCR via `bazel run //deploy:push_genkit_sdk_oci`.',
    ],
    codeBlocks: {
      'sdk-release': {
        filename: 'deploy/BUILD.bazel',
        language: 'python',
        code: `load("@rules_pkg//pkg:tar.bzl", "pkg_tar")
load("@rules_oci//oci:defs.bzl", "oci_image", "oci_push")
load("//tools/build_defs:sdk_checksum.bzl", "sdk_checksum_manifest")

package(default_visibility = ["//visibility:public"])

pkg_tar(
    name = "app_layer",
    srcs = [
        "//bin:genkit_agent_aot",
        "//apps/customer_portal:customer_portal_wasm",
    ],
    package_dir = "/app",
)

oci_image(
    name = "genkit_flutter_oci_image",
    base = "@distroless_cc_debian12",
    entrypoint = ["/app/genkit_agent_aot"],
    exposed_ports = ["8080/tcp"],
    tars = [":app_layer"],
    user = "65532:65532",
    env = {
        "PORT": "8080",
        "STATIC_WEB_DIR": "/app/customer_portal_wasm_web_build",
    },
)

oci_push(
    name = "push_genkit_sdk_oci",
    image = ":genkit_flutter_oci_image",
    remote_tags = ["latest", "v1.0.0"],
    repository = "us-east5-docker.pkg.dev/my-cloud-project/genkit-sdk/agent-service",
)

sdk_checksum_manifest(
    name = "sdk_release_checksums",
    artifacts = [
        ":app_layer",
        "//sdk/dart:dart_genkit_sdk_tar",
    ],
)`,
        verificationCmd: 'bazel build //deploy:genkit_flutter_oci_image //deploy:sdk_release_checksums',
        expectedOutput: 'Target //deploy:genkit_flutter_oci_image up-to-date:\n  bazel-bin/deploy/genkit_flutter_oci_image\nTarget //deploy:sdk_release_checksums up-to-date:\n  bazel-bin/deploy/sdk_release_checksums.sha256',
      },
      'dart-genkit': {
        filename: 'deploy/run_local_container.sh',
        language: 'bash',
        code: `# Build the OCI image hermetically with Bazel (no Dockerfile required)
bazel build --config=release //deploy:genkit_flutter_oci_image

# Verify the SHA-256 digest of the generated OCI image manifest
cat bazel-bin/deploy/genkit_flutter_oci_image/index.json | jq .`,
        verificationCmd: 'bazel build //deploy:genkit_flutter_oci_image',
        expectedOutput: '{\n  "schemaVersion": 2,\n  "mediaType": "application/vnd.oci.image.index.v1+json",\n  "manifests": [{"mediaType": "application/vnd.oci.image.manifest.v1+json", "digest": "sha256:9c84ef..."}]\n}',
      },
      'flutter-multiplatform': {
        filename: 'deploy/sdk_publish_workflow.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Verify Bzlmod lockfile and run all Dart/Flutter tests
bazel test --config=ci-common //...

# 2. Build all SDK distribution tarballs and checksums
bazel build --config=release //sdk/dart:dart_genkit_sdk_tar //deploy:sdk_release_checksums

# 3. Validate Dart pub package readiness prior to publishing
dart pub publish --dry-run`,
        verificationCmd: 'bazel test --config=ci-common //...',
        expectedOutput: 'Executed 18 out of 18 tests: 18 tests pass.',
      },
      'bazel-core': {
        filename: 'MODULE.bazel (rules_pkg & rules_license)',
        language: 'python',
        code: `# Pattern from chrisfbaileycb-arch/bazel/MODULE.bazel:
bazel_dep(name = "rules_license", version = "1.0.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")`,
        verificationCmd: 'bazel mod explain rules_pkg',
        expectedOutput: 'rules_pkg@1.1.0 (direct dependency of root module)',
      },
    },
  },
  {
    stepNumber: 8,
    id: 'step-8-bazel-query-rbe-ci',
    title: 'Step 8: Graph Analysis (query / cquery / aquery), RBE & CI Automation',
    category: 'CI & RBE',
    summary:
      'Use Bazel graph inspection commands (query, cquery, aquery) alongside Remote Build Execution (RBE) and the deterministic audit script to keep builds fast and hermetic.',
    whyItMatters:
      'Coding agents should never guess why a target rebuilds or fails. `bazel query` inspects the target graph, `bazel cquery` inspects platform-configured targets, and `bazel aquery` inspects exact command-line flags, environment variables, and input/output files.',
    executionChecklist: [
      'Run `bazel query "deps(//bin:genkit_agent_aot)"` to inspect the full dependency closure.',
      'Run `bazel cquery "deps(//deploy:genkit_flutter_oci_image)"` to inspect configured target transitions.',
      'Run `bazel aquery "mnemonic(\'DartCompileExe\', //...)"` to verify zero host PATH leakage.',
      'Run `bazel test --config=ci-common //...` in CI to enforce `MODULE.bazel.lock` integrity.',
    ],
    codeBlocks: {
      'bazel-core': {
        filename: 'scripts/inspect_bazel_graph.sh',
        language: 'bash',
        code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Audit MODULE.bazel, .bazelrc, and mcp.json
python3 scripts/bazel_audit.py .

# 2. Find why //deploy:genkit_flutter_oci_image depends on //bin:recipe_flow_lib
bazel query "allpaths(//deploy:genkit_flutter_oci_image, //bin:recipe_flow_lib)"

# 3. Inspect exact command line & inputs of all Dart AOT compile actions
bazel aquery "mnemonic('DartCompileExe', //...)" --output=text

# 4. Run on Remote Build Execution (Ubuntu 24.04 pool from chrisfbaileycb-arch/bazel)
bazel test --config=ubuntu2404 --config=ci-common //...`,
        verificationCmd: 'bazel query "allpaths(//deploy:genkit_flutter_oci_image, //bin:recipe_flow_lib)"',
        expectedOutput: '//deploy:genkit_flutter_oci_image\n//deploy:app_layer\n//bin:genkit_agent_aot\n//bin:recipe_flow_lib',
      },
      'dart-genkit': {
        filename: 'scripts/verify_dart_genkit_bazel.sh',
        language: 'bash',
        code: `# 1. Regenerate Dart @Schema (.g.dart) files and verify clean git diff
dart run build_runner build --delete-conflicting-outputs

# 2. Build & test Dart Genkit flows via Bazel
bazel test --test_output=errors //test/...

# 3. Launch Genkit Developer UI wrapping the Bazel-built AOT binary
genkit start -- ./bazel-bin/bin/genkit_agent_aot`,
        verificationCmd: 'bazel test --test_output=errors //test/...',
        expectedOutput: '//test:recipe_flow_test                                                  PASSED in 0.3s\n//test:mcp_contract_test                                                 PASSED in 0.2s',
      },
      'flutter-multiplatform': {
        filename: 'scripts/verify_flutter_packages.sh',
        language: 'bash',
        code: `# Run only tests impacted by modified files since origin/main
CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
IMPACTED_TARGETS=$(bazel query "rdeps(//..., set($CHANGED_FILES)) intersect kind('.*_test', //...)")

if [ -n "$IMPACTED_TARGETS" ]; then
  bazel test --config=ci-common $IMPACTED_TARGETS
fi`,
        verificationCmd: 'bazel query "kind(\'.*_test\', //...)"',
        expectedOutput: '//apps/customer_portal/test:genkit_bridge_test\n//test:recipe_flow_test\n//test:mcp_contract_test',
      },
      'sdk-release': {
        filename: '.github/workflows/bazel-sdk-release.yml',
        language: 'yaml',
        code: `name: Bazel Hermetic SDK & Flutter Release
on:
  push:
    branches: [main, master]
jobs:
  bazel-verify-and-deploy:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Audit Bazel Skill & Workspace
        run: python3 scripts/bazel_audit.py .
      - name: Verify Lockfile & Run Tests
        run: bazel test --config=ci-common //...
      - name: Build OCI Container & SDK Checksums
        run: bazel build --config=release //deploy:genkit_flutter_oci_image //deploy:sdk_release_checksums`,
        verificationCmd: 'python3 scripts/bazel_audit.py . && bazel build --config=release //deploy:sdk_release_checksums',
        expectedOutput: '{"status": "ok", "checks": ["MODULE.bazel present (Bzlmod enabled)", ".bazelrc enforces --check_direct_dependencies=error", "dart mcp-server configured in mcp.json"], "issues": []}',
      },
    },
  },
];

export const APP_ANALYSIS_PRESETS: AppAnalysisPreset[] = [
  {
    id: 'flutter-dart-monorepo',
    name: 'Flutter + Dart Genkit Monorepo (Legacy WORKSPACE + pubspec.yaml)',
    stackType: 'Flutter Web/Mobile + Dart 3.10 + Genkit AI Flows',
    description:
      'A multi-screen Flutter application calling Dart Genkit flows that currently uses a legacy WORKSPACE file, host-installed `flutter build`, and unpinned `build_runner` invocations.',
    filesSummary: [
      'WORKSPACE (legacy http_archive without SHA-256)',
      'pubspec.yaml (genkit, genkit_google_genai, schemantic, flutter)',
      'lib/flows/assistant_flow.dart (@Schema() without hermetic .g.dart rule)',
      'Dockerfile (non-hermetic `FROM dart:stable` running `dart pub get`)',
    ],
    sampleManifest: `# Legacy WORKSPACE + pubspec.yaml
workspace(name = "flutter_genkit_app")
# Missing MODULE.bazel, missing sha256 on external archives

# pubspec.yaml
name: flutter_genkit_app
environment:
  sdk: ^3.10.0
dependencies:
  flutter:
    sdk: flutter
  genkit: ^0.11.0
  genkit_google_genai: ^0.3.0
  schemantic: ^0.2.0
dev_dependencies:
  build_runner: ^2.4.0`,
    scores: {
      hermeticity: 42,
      bzlmodReadiness: 25,
      cacheGranularity: 50,
      sdkDeploymentMaturity: 48,
    },
    diagnostics: [
      {
        severity: 'CRITICAL',
        area: 'Bzlmod Migration (MODULE.bazel)',
        finding:
          'Application relies on legacy WORKSPACE without MODULE.bazel or MODULE.bazel.lock. External dependencies are not resolved via Minimal Version Selection (MVS).',
        fix: 'Replace WORKSPACE with MODULE.bazel, declare bazel_dep entries (platforms, bazel_skylib, rules_pkg, rules_oci), and run `bazel mod deps --lockfile_mode=update`.',
        command: 'bazel mod deps --lockfile_mode=update',
      },
      {
        severity: 'CRITICAL',
        area: 'Hermetic Dart & Flutter SDK Pinning',
        finding:
          'Build actions invoke the host `/usr/local/bin/flutter` and `dart` binaries instead of a SHA-256 pinned Bzlmod toolchain.',
        fix: 'Register `dart_sdk_extension` in MODULE.bazel with explicit SHA-256 integrity hashes for linux_x86_64 and macos_aarch64.',
        command: 'bazel query "@dart_sdk//..."',
      },
      {
        severity: 'HIGH',
        area: 'Genkit @Schema() Codegen & Dart MCP Server',
        finding:
          '`.g.dart` schema files generated by `schemantic` are untracked by Bazel targets, and `mcp.json` is missing the `dart mcp-server` + `genkit mcp` bridge.',
        fix: 'Include `.g.dart` outputs in `dart_library` srcs and configure both `dart` (`dart mcp-server`) and `genkit` (`genkit mcp`) in `mcp.json`.',
        command: 'dart run build_runner build --delete-conflicting-outputs',
      },
      {
        severity: 'RECOMMENDED',
        area: 'Dockerfile -> Hermetic rules_oci Migration',
        finding:
          'Container deployment uses a mutable `Dockerfile` that runs `dart pub get` over the network during image build.',
        fix: 'Compile a standalone binary with `dart_aot_binary` and assemble a Distroless image using `@rules_oci//oci:defs.bzl` (`oci_image`).',
        command: 'bazel build --config=release //deploy:genkit_flutter_oci_image',
      },
    ],
    recommendedModuleBazel: `module(
    name = "flutter_genkit_app",
    version = "1.0.0",
)

bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")
bazel_dep(name = "rules_oci", version = "2.2.0")

dart_sdk = use_extension("//tools/build_defs:dart_sdk.bzl", "dart_sdk_extension")
dart_sdk.toolchain(
    name = "dart_sdk",
    dart_version = "3.10.0",
    flutter_version = "3.32.0",
)
use_repo(dart_sdk, "dart_sdk", "flutter_sdk")`,
    recommendedBuildBazel: `load("//tools/build_defs:dart_rules.bzl", "dart_aot_binary", "dart_library")
load("//tools/build_defs:flutter_rules.bzl", "flutter_web_bundle")

dart_library(
    name = "assistant_flow_lib",
    srcs = [
        "lib/flows/assistant_flow.dart",
        "lib/flows/assistant_flow.g.dart",
    ],
    package_config = "//:.dart_tool/package_config.json",
)

dart_aot_binary(
    name = "genkit_backend_aot",
    main = "bin/server.dart",
    srcs = ["bin/server.dart"],
    deps = [":assistant_flow_lib"],
)

flutter_web_bundle(
    name = "flutter_web_wasm",
    srcs = glob(["lib/**/*.dart"]) + ["pubspec.yaml", "pubspec.lock"],
    assets = glob(["assets/**", "web/**"]),
    wasm = True,
)`,
    deploymentPipelineCommands: [
      'python3 scripts/bazel_audit.py .',
      'bazel mod deps --lockfile_mode=update',
      'dart run build_runner build --delete-conflicting-outputs',
      'bazel test --config=ci-common //...',
      'bazel build --config=release //:genkit_backend_aot //:flutter_web_wasm //deploy:genkit_flutter_oci_image',
    ],
  },
  {
    id: 'dart-genkit-mcp-microservice',
    name: 'Dart Genkit AI Service + dart mcp-server Backend',
    stackType: 'Dart 3.10 Server + Genkit 1.0 + Model Context Protocol',
    description:
      'A standalone Dart backend service exposing typed Genkit flows (`defineFlow`, `defineTool`, `generateStream`) with `dart mcp-server` and `genkit mcp` enabled for agentic debugging.',
    filesSummary: [
      'MODULE.bazel (Bzlmod enabled, missing RBE & OCI packaging)',
      'bin/server.dart (Genkit + GoogleGenAIPlugin)',
      'mcp.json (dart mcp-server configured)',
      '.bazelrc (missing --check_direct_dependencies=error)',
    ],
    sampleManifest: `module(name = "dart_genkit_mcp_service", version = "0.4.0")
bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")

# mcp.json
{
  "mcpServers": {
    "dart": { "command": "dart", "args": ["mcp-server"] },
    "genkit": { "command": "genkit", "args": ["mcp"] }
  }
}`,
    scores: {
      hermeticity: 78,
      bzlmodReadiness: 85,
      cacheGranularity: 80,
      sdkDeploymentMaturity: 64,
    },
    diagnostics: [
      {
        severity: 'HIGH',
        area: '.bazelrc Direct Dependency & Lockfile Enforcement',
        finding:
          '`.bazelrc` does not enforce `common --check_direct_dependencies=error` or `common:ci-common --lockfile_mode=error` from `chrisfbaileycb-arch/bazel`.',
        fix: 'Add `--check_direct_dependencies=error`, `--module_mirrors=https://bcr.cloudflaremirrors.com`, and `--lockfile_mode=error` to `.bazelrc`.',
        command: 'bazel mod deps --lockfile_mode=error',
      },
      {
        severity: 'RECOMMENDED',
        area: 'Distroless AOT Binary Packaging (rules_oci)',
        finding:
          'Service is deployed with the full Dart VM SDK (~240 MB) instead of a stripped `dart compile exe` AOT binary inside `@distroless_cc_debian12` (~22 MB).',
        fix: 'Add `rules_pkg` and `rules_oci` to `MODULE.bazel` and wrap `//bin:genkit_agent_aot` in an `oci_image` target.',
        command: 'bazel build --config=release //deploy:genkit_flutter_oci_image',
      },
    ],
    recommendedModuleBazel: `module(
    name = "dart_genkit_mcp_service",
    version = "0.4.0",
)

bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_pkg", version = "1.1.0")
bazel_dep(name = "rules_oci", version = "2.2.0")`,
    recommendedBuildBazel: `load("//tools/build_defs:dart_rules.bzl", "dart_aot_binary", "dart_library")
load("@rules_oci//oci:defs.bzl", "oci_image")

dart_aot_binary(
    name = "genkit_mcp_server_aot",
    main = "bin/server.dart",
    srcs = glob(["bin/**/*.dart", "lib/**/*.dart"]),
    package_config = "//:.dart_tool/package_config.json",
)`,
    deploymentPipelineCommands: [
      'python3 scripts/bazel_audit.py .',
      'bazel test --config=ci-common //...',
      'bazel build --config=release //:genkit_mcp_server_aot',
      'genkit start -- ./bazel-bin/genkit_mcp_server_aot',
    ],
  },
  {
    id: 'bazel-master-upstream',
    name: 'chrisfbaileycb-arch/bazel (Bazel 10.0 Bzlmod + LLVM + RBE)',
    stackType: 'Bazel Core Repository (Java 25 + C++ + Starlark + Bzlmod)',
    description:
      'Reference analysis of `https://github.com/chrisfbaileycb-arch/bazel/tree/master`: Bzlmod `MODULE.bazel`, hermetic LLVM cross-compilation (`--config=llvm`), Ubuntu 24.04 RBE (`--config=ubuntu2404`), and `.gemini/styleguide.md`.',
    filesSummary: [
      'MODULE.bazel (bazel 10.0.0-prerelease, repo_name = "io_bazel")',
      '.bazelrc (remote_shared, ubuntu2404, llvm, --check_direct_dependencies=error)',
      '.gemini/styleguide.md (Concise PR summaries without author attribution)',
    ],
    sampleManifest: `module(
    name = "bazel",
    version = "10.0.0-prerelease",
    repo_name = "io_bazel",
)
bazel_dep(name = "abseil-cpp", version = "20250814.1")
bazel_dep(name = "bazel_features", version = "1.50.0")
bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_cc", version = "0.2.25")
bazel_dep(name = "llvm", version = "0.8.21")`,
    scores: {
      hermeticity: 98,
      bzlmodReadiness: 100,
      cacheGranularity: 96,
      sdkDeploymentMaturity: 95,
    },
    diagnostics: [
      {
        severity: 'RECOMMENDED',
        area: 'Cross-Platform Hermetic LLVM Builds',
        finding:
          'Repository configures `@llvm//toolchain:all` under `--config=llvm`, enabling zero-host-compiler cross-builds to Linux x86_64, Windows x86_64, and macOS aarch64.',
        fix: 'Use `--config=llvm --platforms=@llvm//platforms:<target>` when producing release binaries across architectures.',
        command: 'bazel build --config=llvm --platforms=@llvm//platforms:linux_x86_64 //src:bazel',
      },
      {
        severity: 'RECOMMENDED',
        area: 'Lockfile Sync Discipline',
        finding:
          'Any modification to `MODULE.bazel` or module extensions requires updating `MODULE.bazel.lock` before CI runs with `--config=ci-common` (`--lockfile_mode=error`).',
        fix: 'Always run `bazel mod deps --lockfile_mode=update` after modifying `MODULE.bazel`.',
        command: 'bazel mod deps --lockfile_mode=update',
      },
    ],
    recommendedModuleBazel: `# Reference pattern from chrisfbaileycb-arch/bazel/MODULE.bazel
module(
    name = "bazel",
    version = "10.0.0-prerelease",
    repo_name = "io_bazel",
)
bazel_dep(name = "bazel_skylib", version = "1.9.0")
bazel_dep(name = "platforms", version = "1.1.0")
bazel_dep(name = "rules_cc", version = "0.2.25")
bazel_dep(name = "llvm", version = "0.8.21")`,
    recommendedBuildBazel: `# Cross-compile with hermetic LLVM toolchain:
# bazel build --config=llvm --platforms=@llvm//platforms:linux_x86_64 //src:bazel
# bazel build --config=llvm --platforms=@llvm//platforms:macos_aarch64 //src:bazel`,
    deploymentPipelineCommands: [
      'bazel mod deps --lockfile_mode=update',
      'bazel build --config=llvm --platforms=@llvm//platforms:linux_x86_64 //src:bazel',
      'bazel test --config=ubuntu2404 --config=ci-common //src/test/...',
    ],
  },
];

export function analyzeCustomManifest(manifestText: string): {
  hermeticityScore: number;
  bzlmodScore: number;
  findings: { severity: 'CRITICAL' | 'HIGH' | 'RECOMMENDED'; title: string; detail: string; fixCmd: string }[];
} {
  const findings: {
    severity: 'CRITICAL' | 'HIGH' | 'RECOMMENDED';
    title: string;
    detail: string;
    fixCmd: string;
  }[] = [];

  let hermeticityScore = 90;
  let bzlmodScore = 95;

  const hasWorkspace = /workspace\s*\(/i.test(manifestText);
  const hasModule = /module\s*\(/i.test(manifestText) || /bazel_dep\s*\(/i.test(manifestText);
  const hasSha256 = /sha256|integrity/i.test(manifestText);
  const hasPubspec = /environment:\s*\n\s*sdk:/i.test(manifestText) || /dependencies:/i.test(manifestText);
  const hasGenkit = /genkit/i.test(manifestText);
  const hasFlutter = /flutter/i.test(manifestText);

  if (hasWorkspace && !hasModule) {
    bzlmodScore -= 55;
    hermeticityScore -= 25;
    findings.push({
      severity: 'CRITICAL',
      title: 'Legacy WORKSPACE Detected Without MODULE.bazel',
      detail:
        'Migrate from WORKSPACE to Bzlmod (MODULE.bazel) using bazel_dep() and use_extension() as demonstrated in chrisfbaileycb-arch/bazel.',
      fixCmd: 'bazel mod deps --lockfile_mode=update',
    });
  }

  if (!hasSha256) {
    hermeticityScore -= 25;
    findings.push({
      severity: 'HIGH',
      title: 'Missing Cryptographic SHA-256 Integrity Pinning',
      detail:
        'External SDK archives (Dart SDK, Flutter Engine, or http_file binaries) should specify `integrity = "sha256-..."` or `sha256 = "..."`.',
      fixCmd: 'shasum -a 256 <archive> | awk \'{print $1}\'',
    });
  }

  if (hasPubspec || hasFlutter) {
    findings.push({
      severity: 'RECOMMENDED',
      title: 'Hermetic Dart & Flutter SDK Extension Recommended',
      detail:
        'Detected Dart/Flutter configuration. Register `@dart_sdk` and `@flutter_sdk` via Bzlmod `use_extension("//tools/build_defs:dart_sdk.bzl", "dart_sdk_extension")` and enable `--wasm` for Flutter Web builds.',
      fixCmd: 'bazel build --config=release //apps/customer_portal:customer_portal_wasm',
    });
  }

  if (hasGenkit) {
    findings.push({
      severity: 'RECOMMENDED',
      title: 'Genkit @Schema() Codegen & MCP Server Integration',
      detail:
        'Detected Genkit dependencies. Ensure `.g.dart` outputs from `build_runner` are included in `dart_library` srcs and register both `dart mcp-server` and `genkit mcp` in `mcp.json`.',
      fixCmd: 'dart run build_runner build --delete-conflicting-outputs && bazel test //...',
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'RECOMMENDED',
      title: 'Bzlmod & Integrity Checks Passed',
      detail:
        'Manifest follows Bzlmod and cryptographic integrity conventions. Run `bazel mod deps --lockfile_mode=error` in CI to keep `MODULE.bazel.lock` synchronized.',
      fixCmd: 'bazel test --config=ci-common //...',
    });
  }

  return {
    hermeticityScore: Math.max(20, hermeticityScore),
    bzlmodScore: Math.max(15, bzlmodScore),
    findings,
  };
}

export function buildBazelSkillHarnessTree(): Tree {
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
      'You are a Bazel, Dart, Flutter, and Genkit build and deployment engineer.\nWhen authoring MODULE.bazel, BUILD.bazel, Starlark .bzl rules, or deploying Dart, Flutter, and SDK targets, load the `developing_bazel` skill.\nWhen building Genkit flows, tools, or @Schema() models in Dart, load the `developing_genkit_dart` skill.\n',
    'guardrails.md':
      '- Always use Bzlmod (`MODULE.bazel`) instead of legacy `WORKSPACE` files.\n- Pin every `http_archive` and `http_file` with a SHA-256 `integrity` attribute.\n- Enforce `common --check_direct_dependencies=error` and `common:ci-common --lockfile_mode=error` in `.bazelrc`.\n- Run `python scripts/bazel_audit.py` before concluding any build configuration task.\n- Do not mention the PR author in Pull Request Summaries; keep summaries concise (`.gemini/styleguide.md`).\n',
    'LongTermMEMORY.md':
      'Repository `chrisfbaileycb-arch/bazel` uses Bzlmod (`MODULE.bazel`), `bazel mod deps --lockfile_mode=update`, `repo_name = None` for indirect dependencies, `--module_mirrors=https://bcr.cloudflaremirrors.com`, and hermetic toolchains (`--config=llvm`, `--config=ubuntu2404`).\n',
    'tool_descriptions/tool_guidance.md':
      'Use `python scripts/bazel_audit.py` to audit Bzlmod and `.bazelrc` compliance, `bazel query` / `bazel aquery` to inspect build graphs, and the `dart` (`dart mcp-server`) + `genkit` (`genkit mcp`) MCP servers for live Dart analysis and trace inspection.\n',
    'skills/developing_bazel/SKILL.md': BAZEL_SKILL_MD_CONTENT,
    'skills/developing_genkit_dart/SKILL.md': `---
name: developing_genkit_dart
description: Build Genkit Dart flows, @Schema() models, tools, and Bazel AOT targets
---

1. Define input/output schemas using \`@Schema()\` from \`schemantic\` and generate \`.g.dart\` files via \`dart run build_runner build --delete-conflicting-outputs\`.
2. Compile standalone production binaries via Bazel \`dart_aot_binary\` (\`bazel build --config=release //bin:genkit_agent_aot\`).
`,
    'scripts/bazel_audit.py': BAZEL_AUDIT_SCRIPT_CONTENT,
    'sub_agents/bazel_graph_inspector/AGENT.md': `---
mode: subagent
description: Inspect Bazel target, configuration, and action graphs using query, cquery, and aquery
---

Run \`bazel query\`, \`bazel cquery\`, and \`bazel aquery\` to diagnose dependency cycles, non-hermetic inputs, and Dart/Flutter compilation actions.
`,
    'mcp.json': mcpJson,
  };
}

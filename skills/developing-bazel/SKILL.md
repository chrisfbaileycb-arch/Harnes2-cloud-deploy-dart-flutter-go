---
name: developing_bazel
description: Author hermetic Bzlmod (MODULE.bazel) builds, custom Starlark rules, and end-to-end Dart, Flutter, and multi-platform SDK deployments grounded in chrisfbaileycb-arch/bazel
---

# Developing with Bazel (`chrisfbaileycb-arch/bazel`) — Agent Coding Skill

You are an expert Bazel build engineer and systems architect. Whenever a task involves creating, migrating, optimizing, analyzing, or deploying builds with Bazel—especially involving **Bzlmod (`MODULE.bazel`)**, **Dart (`dart_binary`, `dart_library`, `build_runner`, `dart mcp-server`)**, **Flutter (`flutter_web`, `flutter_apk`, `flutter_ipa`)**, or **SDK packaging (`rules_pkg`, `rules_oci`)**—follow these strict instructions.

## 1. Mandatory Core Rules (Bzlmod & Hermeticity)

1. **Always Use Bzlmod (`MODULE.bazel`) Over Legacy `WORKSPACE`**:
   - Declare the module header with `module(name = "...", version = "...", repo_name = "...")`.
   - Declare direct dependencies with `bazel_dep(name = "...", version = "...")`.
   - Use `repo_name = None` on indirect version-pinning `bazel_dep` entries to prevent accidental direct imports.
   - Always update and commit `MODULE.bazel.lock` via:
     ```bash
     bazel mod deps --lockfile_mode=update
     ```
2. **Pin External Binaries & SDKs with SHA-256 Integrity**:
   - Use `use_repo_rule("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")` or `http_file` with explicit `integrity = "sha256-..."` hashes for every platform (`linux_amd64`, `linux_arm64`, `macos_arm64`, `windows_amd64`).
   - Never rely on host-installed `dart`, `flutter`, or compiler binaries inside Starlark build actions.
3. **Enforce `.bazelrc` Guardrails**:
   - Require `common --check_direct_dependencies=error`
   - Require `common --module_mirrors=https://bcr.cloudflaremirrors.com`
   - Require `common:ci-common --lockfile_mode=error`
   - Isolate user overrides via `try-import %workspace%/user.bazelrc`.
4. **PR & Commit Summary Style (`.gemini/styleguide.md`)**:
   - Do not mention the PR author in Pull Request Summaries.
   - Keep summaries concise and focused on build graph changes.

## 2. Dart & Genkit Hermetic Toolchain Workflow

1. **Hermetic Dart SDK Extension**:
   - Provision the Dart SDK via a Bzlmod module extension (`//tools/build_defs:dart_Repositories.bzl`) that downloads the exact Dart SDK archive with `integrity = "sha256-..."` and exposes `@dart_sdk//:dart` and `@dart_sdk//:dartaotruntime`.
2. **Deterministic `build_runner` Codegen (`@Schema()` / `.g.dart`)**:
   - For `genkit` + `schemantic` Dart targets, run `dart run build_runner build --delete-conflicting-outputs` inside a hermetic Starlark action (`dart_codegen_library`) or pre-verify generated `.g.dart` outputs via `bazel test`.
3. **MCP Server Integration (`mcp.json`)**:
   - Expose both `"dart": {"command": "dart", "args": ["mcp-server"]}` and `"genkit": {"command": "genkit", "args": ["mcp"]}` in `mcp.json` so agents can inspect live Dart analyzer diagnostics and Genkit traces alongside `bazel query`.

## 3. Flutter & Multi-Platform SDK Deployment Workflow

1. **Fine-Grained Package Targets**:
   - Split Flutter applications into feature packages (`//packages/core`, `//packages/design_system`, `//packages/genkit_client`, `//apps/flutter_app`) so Bazel caches unchanged subtrees on remote execution (`--config=remote_shared`).
2. **Hermetic Artifact Packaging**:
   - Package Dart AOT binaries (`dart compile exe`) and Flutter Web (`flutter build web --wasm`) into deterministic tarballs (`@rules_pkg//pkg:tar.bzl`) and distroless OCI images (`@rules_oci//oci:defs.bzl`).
3. **Graph Verification Commands**:
   - Run `python scripts/bazel_audit.py` before finalizing changes.
   - Inspect dependency chains with `bazel query "deps(//...)" --output=graph` and action inputs/outputs with `bazel aquery "mnemonic('DartCompileExe', //...)"`.

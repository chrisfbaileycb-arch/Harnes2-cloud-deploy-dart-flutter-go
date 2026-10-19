#!/usr/bin/env python3
"""Deterministic Bazel Bzlmod, Dart/Flutter Toolchain & SDK Deployment Auditor."""

import json
import pathlib
import sys


def audit_workspace(root_path: str) -> dict:
    root = pathlib.Path(root_path)
    issues = []
    checks = []

    module_bazel = root / "MODULE.bazel"
    bazelrc = root / ".bazelrc"
    mcp_json = root / "mcp.json"

    if module_bazel.exists():
        content = module_bazel.read_text(encoding="utf-8")
        checks.append("MODULE.bazel present (Bzlmod enabled)")
        if "integrity" not in content and "http_archive" in content:
            issues.append("External archives in MODULE.bazel must specify sha256 integrity hashes.")
    else:
        issues.append("Missing MODULE.bazel: migrate legacy WORKSPACE to Bzlmod.")

    if bazelrc.exists():
        rc_text = bazelrc.read_text(encoding="utf-8")
        if "--check_direct_dependencies=error" in rc_text:
            checks.append(".bazelrc enforces --check_direct_dependencies=error")
        else:
            issues.append("Add 'common --check_direct_dependencies=error' to .bazelrc.")
        if "--lockfile_mode=error" in rc_text:
            checks.append(".bazelrc enforces CI --lockfile_mode=error")
    else:
        issues.append("Missing .bazelrc configuration file.")

    if mcp_json.exists():
        try:
            mcp = json.loads(mcp_json.read_text(encoding="utf-8"))
            servers = mcp.get("mcpServers", {})
            if "dart" in servers:
                checks.append("dart mcp-server configured in mcp.json")
        except Exception as exc:
            issues.append(f"Invalid mcp.json: {exc}")

    return {"status": "ok" if not issues else "needs_attention", "checks": checks, "issues": issues}


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    print(json.dumps(audit_workspace(target), indent=2))

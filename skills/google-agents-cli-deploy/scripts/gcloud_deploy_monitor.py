#!/usr/bin/env python3
"""Deterministic auditor and sizing calculator for google-agents-cli deployments."""

import json
import sys


def verify_deployment_config(
    target: str = "agent_runtime",
    memory_gi: float = 4.0,
    concurrency: int = 8,
    per_request_mb: float = 220.0,
    capture_content: str = "NO_CONTENT",
) -> dict:
    base_mb = 512.0
    peak_mb = base_mb + (concurrency * per_request_mb)
    limit_mb = memory_gi * 1024.0
    headroom_pct = round(((limit_mb - peak_mb) / limit_mb) * 100.0, 1)

    warnings = []
    if peak_mb > limit_mb * 0.85:
        warnings.append(
            f"OOM RISK: Peak memory ({peak_mb:.0f} MiB) exceeds 85% of {memory_gi}Gi limit ({limit_mb:.0f} MiB). Increase --memory or lower --concurrency."
        )
    if capture_content not in ("NO_CONTENT", "EVENT_ONLY", "SPAN_ONLY", "SPAN_AND_EVENT"):
        warnings.append(
            f"INVALID_OTEL_ENUM: OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT='{capture_content}' is invalid for ADK Python; use NO_CONTENT."
        )

    return {
        "target": target,
        "peak_memory_mib": peak_mb,
        "limit_memory_mib": limit_mb,
        "headroom_pct": headroom_pct,
        "otel_span_privacy": capture_content,
        "status": "healthy" if not warnings else "warning",
        "warnings": warnings,
    }


if __name__ == "__main__":
    print(json.dumps(verify_deployment_config(), indent=2))

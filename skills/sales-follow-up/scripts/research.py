#!/usr/bin/env python3
"""Submit a CallPrep research job and poll until it completes.

Usage:
    CALLPREP_API_KEY=cp_live_... python3 research.py jane@acme.com [--name ...]

Prints the completed research JSON to stdout. Exits non-zero on error,
printing {"error": "..."} to stdout so callers always get parseable JSON.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE_URL = os.environ.get(
    "CALLPREP_BASE_URL",
    "https://rpiqzfzokrwxavztrpmp.supabase.co/functions/v1",
)
POLL_INTERVAL_SECONDS = 5
TIMEOUT_SECONDS = 180


def fail(message):
    print(json.dumps({"error": message}))
    sys.exit(1)


def request(method, path, api_key, body=None):
    req = urllib.request.Request(
        BASE_URL + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode())
        except Exception:
            payload = {"error": "HTTP %d" % e.code}
        return e.code, payload
    except urllib.error.URLError as e:
        fail("network error: %s" % e.reason)


def main():
    parser = argparse.ArgumentParser(description="CallPrep prospect research")
    parser.add_argument("email")
    parser.add_argument("--name", dest="prospect_name")
    parser.add_argument("--company", dest="company_name")
    parser.add_argument("--linkedin-url", dest="linkedin_url")
    parser.add_argument("--company-linkedin-url", dest="company_linkedin_url")
    args = parser.parse_args()

    api_key = os.environ.get("CALLPREP_API_KEY", "")
    if not api_key.startswith("cp_"):
        fail(
            "CALLPREP_API_KEY is not set (or malformed). "
            "Generate a key at https://callprep.app -> API Keys."
        )

    body = {"email": args.email}
    for field in ("prospect_name", "company_name", "linkedin_url", "company_linkedin_url"):
        value = getattr(args, field)
        if value:
            body[field] = value

    status, payload = request("POST", "/research", api_key, body)
    if status == 401:
        fail("invalid API key (401). Check your key in the CallPrep dashboard.")
    if status in (402, 403):
        fail("request refused (%d) — likely out of credits: %s" % (status, payload))
    if status not in (200, 202):
        fail("unexpected response %d: %s" % (status, payload))

    research_id = payload.get("research_id")
    if not research_id:
        # Cache hit may return the data directly.
        if payload.get("status") == "completed":
            print(json.dumps(payload, indent=2))
            return
        fail("no research_id in response: %s" % payload)

    deadline = time.time() + TIMEOUT_SECONDS
    while time.time() < deadline:
        status, payload = request("GET", "/research-status/" + research_id, api_key)
        state = payload.get("status")
        if state == "completed":
            print(json.dumps(payload, indent=2))
            return
        if state == "failed":
            fail("research failed: %s" % payload.get("error", payload))
        if status not in (200, 202):
            fail("unexpected poll response %d: %s" % (status, payload))
        time.sleep(POLL_INTERVAL_SECONDS)

    fail("timed out after %ds waiting for research %s" % (TIMEOUT_SECONDS, research_id))


if __name__ == "__main__":
    main()

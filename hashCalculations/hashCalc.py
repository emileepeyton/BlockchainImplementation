#!/usr/bin/env python3
import argparse, json, os, re, shutil, subprocess, sys, hashlib
from datetime import datetime, timezone

DOTNET_DATE_RE = re.compile(r"/Date\((?P<ms>-?\d+)(?P<offset>[+-]\d{4})?\)/")

def parse_ps_time(val: str):
    if not val: return None
    s = val.strip()
    m = DOTNET_DATE_RE.fullmatch(s)
    if m:
        ms = int(m.group("ms"))
        return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc)
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def normalize_message(msg: str) -> str:
    s = (msg or "").replace("\r\n", "\n").replace("\t", " ")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n[ \t]+", "\n", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip() if s else "No message"

def to_epoch_seconds(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp())

def get_events_via_powershell(evtx_path: str, time_min):
    if os.name != "nt":
        raise SystemExit("[ERROR] This minimal script requires Windows (PowerShell).")
    ps = shutil.which("powershell") or shutil.which("pwsh")
    if not ps:
        raise SystemExit("[ERROR] PowerShell not found on PATH.")

    time_filter = ""
    if time_min is not None:
        time_filter = f' | Where-Object {{ $_.TimeCreated -ge (Get-Date "{time_min.isoformat()}") }}'

    ps_script = (
        f'Get-WinEvent -Path "{evtx_path}"'
        f'{time_filter} | '
        'Select-Object TimeCreated, Id, RecordId, Message | '
        'ConvertTo-Json -Depth 4 -Compress'
    )

    r = subprocess.run(
        [ps, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
        capture_output=True, text=True, check=True
    )
    txt = r.stdout.strip()
    if not txt:
        return []

    data = json.loads(txt)
    if isinstance(data, dict):
        data = [data]

    out = []
    for it in data:
        dt = parse_ps_time(it.get("TimeCreated"))
        ev = str(it.get("Id", "")).strip()
        rid = str(it.get("RecordId", "")).strip()
        msg = it.get("Message") or ""
        if dt and ev and rid:
            out.append({
                "generated_epoch": to_epoch_seconds(dt),
                "event_id": ev,
                "record_id": rid,
                "message": msg
            })
    return out

def compute_hashes(records):
    results = []
    for r in records:
        msg_norm = normalize_message(r["message"])
        action = f"[EventID:{r['event_id']}] [RecordID:{r['record_id']}] {msg_norm}"
        canonical = f"{r['generated_epoch']}|{action}"
        results.append({
            "generated_epoch": r["generated_epoch"],
            "event_id": r["event_id"],
            "record_id": r["record_id"],
            "canonical": canonical,
            "sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
            "md5": hashlib.md5(canonical.encode("utf-8")).hexdigest(),
        })
    return results

def main():
    ap = argparse.ArgumentParser(description="Verify EVTX record hashes (SHA-256 & MD5) using automated.js canonical format (Windows only).")
    ap.add_argument("evtx", help=".evtx file path")
    ap.add_argument("--since", help='Only include events with TimeCreated >= this ISO time (e.g., 2025-09-01T00:00:00Z)')
    ap.add_argument("--json", help="Write results to JSON file")
    args = ap.parse_args()

    if not os.path.isfile(args.evtx):
        print(f"[ERROR] File not found: {args.evtx}", file=sys.stderr); sys.exit(2)

    time_min = parse_ps_time(args.since.replace("Z", "+00:00")) if args.since else None
    records = get_events_via_powershell(args.evtx, time_min)
    results = compute_hashes(records)

    print(f"[INFO] Parsed events: {len(records)} | Computed hashes: {len(results)}")
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Wrote JSON: {args.json}")
        return

    for r in results:
        print("-" * 80)
        print(f"Time (epoch): {r['generated_epoch']}")
        print(f"EventID     : {r['event_id']}")
        print(f"RecordID    : {r['record_id']}")
        print(f"Canonical   : {r['canonical']}")
        print(f"SHA-256     : {r['sha256']}")
        print(f"MD5         : {r['md5']}")

if __name__ == "__main__":
    main()


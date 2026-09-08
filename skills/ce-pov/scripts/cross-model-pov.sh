#!/usr/bin/env bash
# cross-model-pov.sh
# OMP-only explicit reviewer transport for one POV voice.
# Cross-model independence on OMP is dispatching a reviewer agent; this worker
# provides evidence transport only over the fixed omp route. Receipts record
# independence_verified always false with serving model unverified.
# Usage: cross-model-pov.sh <host-family> <fixed-route> <subject-payload> <run-dir>
# $1 is an ignored placeholder kept for positional stability; $2 must be omp;
# $3 is the framed payload file; $4 is the private run dir (output pov-omp.json).
# NON-BLOCKING: every failure logs to stderr and exits 0 without output.
set -uo pipefail
trap '' HUP
ACTIVE_PEER_PID=""
PEER_WORKDIR=""; PROMPT_FILE=""; PEERLOG=""; PEERERR=""; RAW_OUT=""; OUT=""
RUN_SUCCEEDED=false
cleanup_private_scratch() {
  [ -n "${PEER_WORKDIR:-}" ] && rm -rf "$PEER_WORKDIR"
  PEER_WORKDIR=""
}
log()  { printf '[cross-model-pov] %s\n' "$*" >&2; }
skip() { log "$*"; exit 0; }
[ "${OMPCODE:-}" = "1" ] || { echo "OMPCODE=1 required; refusing to run outside the omp harness" >&2; exit 2; }
[ "${CROSS_MODEL_HOST_HARNESS:-}" = "omp" ] || { echo "CROSS_MODEL_HOST_HARNESS must be 'omp' (got '${CROSS_MODEL_HOST_HARNESS:-}')" >&2; exit 2; }
[ "${CROSS_MODEL_FIXED_ROUTE:-}" = "omp" ] || { echo "CROSS_MODEL_FIXED_ROUTE must be 'omp' (got '${CROSS_MODEL_FIXED_ROUTE:-}')" >&2; exit 2; }
HOST_ARG="${1:-unknown}"; FIXED_ARG="${2:-}"; PAYLOAD_PATH="${3:-}"; RUN_DIR="${4:-}"
: "${HOST_ARG:-}"
[ -n "$FIXED_ARG" ] || FIXED_ARG="omp"
[ "$FIXED_ARG" = "omp" ] || { echo "fixed route must be 'omp' (got '$FIXED_ARG')" >&2; exit 2; }
[ -n "$PAYLOAD_PATH" ] && [ -f "$PAYLOAD_PATH" ] || skip "subject payload '${PAYLOAD_PATH:-<empty>}' not readable; skipping"
READ_ROOT="${CROSS_MODEL_READ_ROOT:-$(pwd -P)}"
[ -d "$READ_ROOT" ] || skip "declared read root '$READ_ROOT' is not a directory"
READ_ROOT="$(cd "$READ_ROOT" && pwd -P)" || skip "cannot resolve read root"
[ -n "$RUN_DIR" ] || skip "run-dir not given; skipping"
RUN_DIR_RESOLVED="$(cd "$RUN_DIR" 2>/dev/null && pwd -P)" || skip "run-dir '$RUN_DIR' must already exist"
RUN_DIR="$RUN_DIR_RESOLVED"
chmod 700 "$RUN_DIR" 2>/dev/null || skip "run-dir '$RUN_DIR' could not be made private"
command -v jq >/dev/null 2>&1 || skip "jq not installed; skipping"
command -v omp >/dev/null 2>&1 || skip "omp not installed; skipping"
INCLUDE_PATHS="${CROSS_MODEL_INCLUDE_PATHS:-}"
EXCLUDE_PATHS="${CROSS_MODEL_EXCLUDE_PATHS:-}"
SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || skip "cannot resolve skill root; skipping"
PERSONA="$SKILL_ROOT/references/agents/pov-peer.md"
SCHEMA="$SKILL_ROOT/references/pov-schema.json"
[ -f "$PERSONA" ] || skip "persona brief not found; skipping"
[ -f "$SCHEMA" ] || skip "POV schema not found; skipping"
SCHEMA_CONTENT="$(cat "$SCHEMA")" || skip "cannot read POV schema; skipping"
MAX_PAYLOAD_CHARS="${CROSS_MODEL_MAX_PAYLOAD_CHARS:-200000}"
case "$MAX_PAYLOAD_CHARS" in ''|*[!0-9]*) MAX_PAYLOAD_CHARS=200000 ;; esac
PAYLOAD_CHARS="$(wc -c <"$PAYLOAD_PATH" | tr -d '[:space:]')"
if [ "$PAYLOAD_CHARS" -gt "$MAX_PAYLOAD_CHARS" ]; then
  skip "subject payload is ${PAYLOAD_CHARS} bytes (limit ${MAX_PAYLOAD_CHARS}); skipping rather than truncating"
fi
SCRATCH_PARENT="${CROSS_MODEL_SCRATCH_PARENT:-${TMPDIR:-/tmp}}"
[ -d "$SCRATCH_PARENT" ] || mkdir -p "$SCRATCH_PARENT" 2>/dev/null || skip "private scratch parent unavailable"
SCRATCH_PARENT="$(cd "$SCRATCH_PARENT" && pwd -P)" || skip "cannot resolve private scratch parent"
if ! PEER_WORKDIR="$(mktemp -d "$SCRATCH_PARENT/xmodel-pov-peer-XXXXXX")"; then
  skip "reviewer workspace isolation unavailable; skipping"
fi
chmod 700 "$PEER_WORKDIR" 2>/dev/null || { cleanup_private_scratch; skip "cannot make peer scratch private"; }
PROMPT_FILE="$PEER_WORKDIR/prompt.md"
PEERLOG="$PEER_WORKDIR/stdout.log"
PEERERR="$PEER_WORKDIR/stderr.log"
RAW_OUT="$PEER_WORKDIR/pov-omp.raw.json"
OUT="$RUN_DIR/pov-omp.json"
: > "$PROMPT_FILE"; : > "$PEERLOG"; : > "$PEERERR"
chmod 600 "$PROMPT_FILE" "$PEERLOG" "$PEERERR" 2>/dev/null || { cleanup_private_scratch; skip "cannot make peer scratch files private"; }
trap 'cleanup_private_scratch' EXIT
{
  cat "$PERSONA"
  printf '\n\n---\n\nReturn ONE JSON object and nothing else matching this schema:\n\n%s' "$SCHEMA_CONTENT"
  printf '\n\nSet "voice" to "peer" (namespaced on fold-in).\n'
  printf '\n<read-scope>\nroot: %s\nincludes: %s\nexcludes: %s\n</read-scope>\n' "$READ_ROOT" "${INCLUDE_PATHS:-<all>}" "${EXCLUDE_PATHS:-<none>}"
  printf '\n<subject-payload>\n'
  cat "$PAYLOAD_PATH"
  printf '\n</subject-payload>\n'
} > "$PROMPT_FILE"
HARD_SECS="${CROSS_MODEL_HARD_SECS:-600}"
case "$HARD_SECS" in ''|*[!0-9]*|0*) skip "peer hard budget must be a positive integer; skipping" ;; esac
peer_alive() {
  local st
  kill -0 "$1" 2>/dev/null || return 1
  command -v ps >/dev/null 2>&1 || return 0
  st="$(ps -o state= -p "$1" 2>/dev/null | tr -d ' \n')"
  [ -n "$st" ] || return 1
  [ "${st#Z}" = "$st" ]
}
reap() {
  local pid="$1" grp
  if kill -TERM -- -"$pid" 2>/dev/null; then grp=1; else kill -TERM "$pid" 2>/dev/null || true; grp=0; fi
  for _ in 1 2 3 4 5; do
    peer_alive "$pid" || { [ "$grp" = 1 ] && kill -KILL -- -"$pid" 2>/dev/null || true; return 0; }
    sleep 1
  done
  if [ "$grp" = 1 ]; then kill -KILL -- -"$pid" 2>/dev/null; else kill -KILL "$pid" 2>/dev/null; fi
}
on_term() {
  if [ -n "${ACTIVE_PEER_PID:-}" ]; then
    reap "$ACTIVE_PEER_PID" 2>/dev/null || true
    wait "$ACTIVE_PEER_PID" 2>/dev/null || true
    ACTIVE_PEER_PID=""
  fi
  exit 0
}
trap 'on_term' TERM INT
omp_argv() {
  printf '%s\0' omp "@$PROMPT_FILE" "Follow the attached brief. Return only schema-shaped JSON." \
    -p --mode json --no-session --tools read,grep,glob,lsp,web_search --cwd "$READ_ROOT"
}
build_cmd() {
  CMD=()
  while IFS= read -r -d '' tok; do CMD+=("$tok"); done < <(omp_argv)
}
pov_shaped() {
  [ -s "$1" ] && jq -e '(.voice|type)=="string" and (.voice|length)>0 and (.position|type)=="string" and (.position|length)>0 and (.reasoning|type)=="string" and (.reasoning|length)>0 and (.evidence|type)=="array" and all(.evidence[]; type=="string" and length>0) and (.external_check=="ran" or .external_check=="unavailable") and (.mode=="independent" or .mode=="skeptic") and (.movement=="initial" or .movement=="moved" or .movement=="held")' "$1" >/dev/null 2>&1
}
recover_pov_json() {
  local py
  py="$(for c in python3 python py; do command -v "$c" >/dev/null 2>&1 && "$c" -c '' >/dev/null 2>&1 && { echo "$c"; break; }; done)"
  [ -n "$py" ] || return 1
  "$py" - "$1" "$2" <<'PY' 2>/dev/null
import sys, json
txt = open(sys.argv[1], encoding="utf-8", errors="replace").read()
best = None
best_score = -1
dec = json.JSONDecoder()
def shaped(d):
    return (isinstance(d.get("voice"), str) and d["voice"] != "" and isinstance(d.get("position"), str) and d["position"] != "" and isinstance(d.get("reasoning"), str) and d["reasoning"] != "" and isinstance(d.get("evidence"), list) and all(isinstance(e, str) and e != "" for e in d["evidence"]) and d.get("external_check") in ("ran", "unavailable") and d.get("mode") in ("independent", "skeptic") and d.get("movement") in ("initial", "moved", "held"))
def score(d):
    if shaped(d) and d.get("final") is True: return 2
    if shaped(d): return 1
    return 0
def inspect(v):
    global best, best_score
    if isinstance(v, dict):
        if "position" in v:
            sc = score(v)
            if sc >= best_score: best, best_score = v, sc
        for child in v.values(): inspect(child)
    elif isinstance(v, list):
        for child in v: inspect(child)
    elif isinstance(v, str):
        for i, ch in enumerate(v):
            if ch not in "{[": continue
            try: child, _ = dec.raw_decode(v, i); inspect(child)
            except Exception: pass
inspect(txt)
if best is not None: open(sys.argv[2], "w").write(json.dumps(best))
PY
  [ -s "$2" ]
}
parse_omp_events() {
  local text tmp
  text="$(jq -rs '[.[] | select(.type=="message_update") | (.assistantMessageEvent | select(.type=="text_delta") | .delta // empty)] | join("")' "$1" 2>/dev/null)" || text=""
  [ -n "$text" ] || text="$(jq -rs '[.[] | select(.type=="turn_end") | (.message.content[]? | select(.type=="text") | .text // empty)] | join("")' "$1" 2>/dev/null)" || text=""
  [ -n "$text" ] || return 1
  printf '%s' "$text" | jq -e '.' > "$2" 2>/dev/null && return 0
  tmp="$(mktemp "${TMPDIR:-/tmp}/ce-omp-text-XXXXXX")" || return 1
  printf '%s' "$text" > "$tmp"
  recover_pov_json "$tmp" "$2"
  local st=$?
  rm -f "$tmp"
  return "$st"
}
classify_omp_terminal() {
  local verdict
  verdict="$(jq -rs '[.[] | select(.type=="turn_end")] | last | if . == null then "ok" else .message as $m | (($m.errorMessage // "") | tostring) as $e | if $e == "" then (if ($m.stopReason // "") == "stop" then "ok" else "failed" end) elif ($e | test("(^|[^0-9])529([^0-9]|$)"; "i")) and ($e | test("overload|capacity"; "i")) then "overloaded" else "failed" end end' "$PEERLOG" 2>/dev/null)" || verdict="ok"
  case "$verdict" in
    ok) ;;
    overloaded) RUN_SUCCEEDED=false; rm -f "$RAW_OUT"; log "reviewer reports provider overload 529" ;;
    *) RUN_SUCCEEDED=false; rm -f "$RAW_OUT"; log "reviewer terminal envelope reports failure; discarding output" ;;
  esac
}
bounded_evidence() {
  local evidence
  evidence="$(jq -r '[(.result? // empty), (.message? // empty), (.error?.message? // empty)] | map(select(type == "string" and length > 0)) | unique | join(" | ")' "$1" 2>/dev/null)"
  [ -n "$evidence" ] || evidence="$(head -c 2000 "$1" 2>/dev/null)"
  evidence="$(printf '%s' "$evidence" | tr '\n' ' ')"
  [ "${#evidence}" -gt 300 ] && evidence="${evidence:0:147} ... ${evidence: -147}"
  printf '%s' "$evidence"
}
run_omp_cmd() {
  RUN_SUCCEEDED=false
  local hard_cap="${1:-$HARD_SECS}" start now pid prev
  case "$-" in *m*) prev=1;; *) prev=0;; esac
  set -m
  ( cd "$READ_ROOT" && exec "${CMD[@]}" ) < /dev/null > "$PEERLOG" 2>"$PEERERR" &
  pid=$!
  ACTIVE_PEER_PID="$pid"
  [ "$prev" = 0 ] && set +m
  start="$(date +%s)"
  while peer_alive "$pid"; do
    now="$(date +%s)"
    if [ $(( now - start )) -ge "$hard_cap" ]; then log "reviewer exceeded hard cap ${hard_cap}s; reaping"; reap "$pid"; break; fi
    sleep 1
  done
  if wait "$pid" 2>/dev/null; then RUN_SUCCEEDED=true; else log "reviewer exited non-zero or timed out"; fi
  reap "$pid" 2>/dev/null || true
  ACTIVE_PEER_PID=""
}
build_cmd
log "reviewer run: target=omp route=omp read-only least-privilege (hard ${HARD_SECS}s); subject payload may egress to this target"
: > "$PEERLOG"; : > "$PEERERR"; rm -f "$RAW_OUT" "$OUT"
run_omp_cmd "$HARD_SECS"
classify_omp_terminal
[ "$RUN_SUCCEEDED" = true ] && parse_omp_events "$PEERLOG" "$RAW_OUT"
rm -f "$OUT"
if [ -s "$RAW_OUT" ]; then
  _norm="$PEER_WORKDIR/normalized.json"
  if jq --arg v "peer-omp" --arg route "omp" --arg target "omp" --arg harness "omp" --arg family "unknown" --arg mreq "auto" --arg mact "unverified" --argjson independent false 'if ((.voice|type)=="string" and (.voice|length)>0 and (.position|type)=="string" and (.position|length)>0 and (.reasoning|type)=="string" and (.reasoning|length)>0 and (.evidence|type)=="array" and all(.evidence[]; type=="string" and length>0) and (.external_check=="ran" or .external_check=="unavailable") and (.mode=="independent" or .mode=="skeptic") and (.movement=="initial" or .movement=="moved" or .movement=="held") and .final==true) then { voice: $v, cross_model_route: $route, cross_model_target: $target, cross_model_harness: $harness, serving_family: $family, model_requested: $mreq, model_actual: $mact, effort_requested: "unverified", effort_actual: "unverified", receipt_supported: false, independence_verified: $independent, position: .position, reasoning: .reasoning, evidence: .evidence, external_check: .external_check, mode: .mode, movement: .movement, final: true } else empty end' "$RAW_OUT" > "$_norm" 2>/dev/null; then
    mv "$_norm" "$OUT"
    chmod 600 "$OUT" 2>/dev/null || { rm -f "$OUT"; log "could not make result artifact private"; }
  else
    rm -f "$_norm"
  fi
  rm -f "$RAW_OUT"
fi
if [ -s "$OUT" ] && jq -e '(.voice|type)=="string" and (.position|type)=="string" and (.position|length)>0 and (.reasoning|type)=="string" and (.evidence|type)=="array" and (.independence_verified|type)=="boolean"' "$OUT" >/dev/null 2>&1; then
  log "wrote reviewer voice to $OUT (voice peer-omp)"
else
  log "reviewer produced no usable schema-shaped output; skipping fold-in"
  [ -s "$PEERLOG" ] && log "  peer skip evidence: $(bounded_evidence "$PEERLOG")"
  [ -s "$PEERERR" ] && log "  peer skip evidence (stderr): $(bounded_evidence "$PEERERR")"
  rm -f "$OUT" "$RAW_OUT"
fi
cleanup_private_scratch
trap - EXIT
exit 0

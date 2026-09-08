#!/usr/bin/env bash
# cross-model-doc-review.sh
# OMP-only explicit reviewer transport for one doc-review lens.
# Cross-model independence on OMP is dispatching a reviewer agent; this worker
# provides evidence transport only over the fixed omp route. Receipts record
# independence_verified always false with serving model/effort unverified.
# Usage: cross-model-doc-review.sh <host-family> <candidates> <reviewer> <doc> <type> <origin> <run-dir>
# $1/$2 are ignored placeholders kept for positional stability.
# NON-BLOCKING: every failure logs to stderr and exits 0 without output.
set -uo pipefail
trap '' HUP
ACTIVE_PEER_PID=""
RUN_SUCCEEDED=false
PY_BIN=""
log()  { printf '[cross-model-doc] %s\n' "$*" >&2; }
skip() { log "$*"; exit 0; }
[ "${OMPCODE:-}" = "1" ] || { echo "OMPCODE=1 required; refusing to run outside the omp harness" >&2; exit 2; }
[ "${CROSS_MODEL_HOST_HARNESS:-}" = "omp" ] || { echo "CROSS_MODEL_HOST_HARNESS must be 'omp' (got '${CROSS_MODEL_HOST_HARNESS:-}')" >&2; exit 2; }
[ "${CROSS_MODEL_FIXED_ROUTE:-}" = "omp" ] || { echo "CROSS_MODEL_FIXED_ROUTE must be 'omp' (got '${CROSS_MODEL_FIXED_ROUTE:-}')" >&2; exit 2; }
HOST_ARG="${1:-}"; CANDIDATES_ARG="${2:-}"; REVIEWER_NAME="${3:-}"; DOC_PATH="${4:-}"; DOC_TYPE="${5:-}"; ORIGIN="${6:-}"; RUN_DIR="${7:-}"
: "${HOST_ARG:-}" "${CANDIDATES_ARG:-}"
[ -n "$REVIEWER_NAME" ] || skip "no reviewer-name given; skipping"
[ -n "$DOC_PATH" ] && [ -f "$DOC_PATH" ] || skip "document '${DOC_PATH:-<empty>}' not readable; skipping"
: "${DOC_TYPE:=unified-plan}"
: "${ORIGIN:=none}"
[ -n "$RUN_DIR" ] || skip "run-dir not given; skipping"
mkdir -p "$RUN_DIR" 2>/dev/null
[ -d "$RUN_DIR" ] || skip "run-dir '$RUN_DIR' could not be created; skipping"
command -v jq >/dev/null 2>&1 || skip "jq not installed; skipping"
command -v omp >/dev/null 2>&1 || skip "omp not installed; skipping"
case "$REVIEWER_NAME" in
  security-lens) PERSONA_FILE="security-lens-reviewer" ;;
  adversarial) PERSONA_FILE="adversarial-document-reviewer" ;;
  product-lens) PERSONA_FILE="product-lens-reviewer" ;;
  whole-doc) PERSONA_FILE="whole-doc-reviewer" ;;
  *) skip "reviewer-name '$REVIEWER_NAME' is not a cross-model reviewer; skipping" ;;
esac
SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || skip "cannot resolve skill root; skipping"
PERSONA="$SKILL_ROOT/references/personas/$PERSONA_FILE.md"
SCHEMA="$SKILL_ROOT/references/findings-schema.json"
[ -f "$PERSONA" ] || skip "persona brief not found; skipping"
[ -f "$SCHEMA" ] || skip "findings schema not found; skipping"
SCHEMA_CONTENT="$(cat "$SCHEMA")" || skip "cannot read findings schema; skipping"
MAX_DOC_CHARS="${CROSS_MODEL_MAX_DOC_CHARS:-200000}"
case "$MAX_DOC_CHARS" in ''|*[!0-9]*) MAX_DOC_CHARS=200000 ;; esac
DOC_CHARS="$(wc -c <"$DOC_PATH" | tr -d '[:space:]')"
if [ "$DOC_CHARS" -gt "$MAX_DOC_CHARS" ]; then
  skip "document is ${DOC_CHARS} bytes (limit ${MAX_DOC_CHARS}); skipping rather than truncating"
fi
PEER_WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/xmodel-doc-peer-XXXXXX")" || PEER_WORKDIR="$RUN_DIR"
RAW_OUT="$PEER_WORKDIR/$REVIEWER_NAME-omp.raw.json"
OUT="$RUN_DIR/$REVIEWER_NAME-omp.json"
PROMPT_FILE="$(mktemp "${TMPDIR:-/tmp}/xmodel-doc-prompt-XXXXXX")"
PEERLOG="$(mktemp "${TMPDIR:-/tmp}/xmodel-doc-log-XXXXXX")"
PEERERR="$(mktemp "${TMPDIR:-/tmp}/xmodel-doc-err-XXXXXX")"
cleanup_temp() {
  [ -n "${PROMPT_FILE:-}" ] && rm -f "$PROMPT_FILE" "$PEERLOG" "$PEERERR"
  [ -n "$RAW_OUT" ] && rm -f "$RAW_OUT"
  [ -n "$PEER_WORKDIR" ] && [ "$PEER_WORKDIR" != "${RUN_DIR:-}" ] && rm -rf "$PEER_WORKDIR"
}
trap 'cleanup_temp' EXIT
DOC_BASENAME="$(basename "$DOC_PATH")"
{
  cat "$PERSONA"
  printf '\n\n---\n\nReturn ONE JSON object and nothing else matching this schema:\n\n%s' "$SCHEMA_CONTENT"
  printf '\n\nSet "reviewer" to "%s" (namespaced on fold-in).\n' "$REVIEWER_NAME"
  printf '\nDocument type: %s\nDocument path: %s\nOrigin: %s\n\n' "$DOC_TYPE" "$DOC_BASENAME" "$ORIGIN"
  printf '<prior-decisions>\nRound 1 — no prior decisions.\n</prior-decisions>\n\nDocument content:\n'
  cat "$DOC_PATH"
} > "$PROMPT_FILE"
chmod 600 "$PROMPT_FILE" 2>/dev/null || skip "cannot secure prompt file; skipping"
HARD_SECS="${CROSS_MODEL_HARD_SECS:-1200}"
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
    -p --mode json --no-session --no-tools --cwd "$PEER_WORKDIR"
}
build_cmd() {
  CMD=()
  while IFS= read -r -d '' tok; do CMD+=("$tok"); done < <(omp_argv)
}
resolve_python() {
  for c in python3 python py; do
    command -v "$c" >/dev/null 2>&1 && "$c" -c '' >/dev/null 2>&1 && { printf '%s\n' "$c"; return; }
  done
}
recover_findings_json() {
  local py="${PY_BIN:-}"
  [ -n "$py" ] || return 1
  "$py" - "$1" "$2" <<'PY' 2>/dev/null
import sys, json
txt = open(sys.argv[1], encoding="utf-8", errors="replace").read()
if 'findings' not in txt: sys.exit(0)
dec = json.JSONDecoder()
found = []
def scan(text, depth):
    i = 0
    while True:
        j = text.find('{', i)
        if j < 0: break
        try: obj, end = dec.raw_decode(text, j)
        except Exception: i = j + 1; continue
        if isinstance(obj, dict):
            for cand in (obj, obj.get("structured_output"), obj.get("structuredOutput")):
                if isinstance(cand, dict) and isinstance(cand.get("findings"), list): found.append((cand, depth))
            if depth < 3:
                for v in obj.values():
                    if isinstance(v, str) and 'findings' in v: scan(v, depth + 1)
        i = end
scan(txt, 0)
nested = [o for o, d in found if d > 0]
top = [o for o, d in found if d == 0]
best = None
if nested:
    pick = next((o for o in reversed(nested) if o["findings"]), nested[-1])
    best = pick if pick["findings"] else (top[-1] if top else pick)
elif top: best = top[-1]
if best is not None: open(sys.argv[2], "w").write(json.dumps(best))
PY
  [ -s "$2" ]
}
parse_omp_events() {
  local text tmp
  text="$(jq -rs '[.[] | select(.type=="message_update") | (.assistantMessageEvent | select(.type=="text_delta") | .delta // empty)] | join("")' "$1" 2>/dev/null)" || text=""
  [ -n "$text" ] || text="$(jq -rs '[.[] | select(.type=="turn_end") | (.message.content[]? | select(.type=="text") | .text // empty)] | join("")' "$1" 2>/dev/null)" || text=""
  [ -n "$text" ] || return 1
  printf '%s' "$text" | jq -e 'select((.findings|type)=="array")' > "$2" 2>/dev/null && return 0
  tmp="$(mktemp "${TMPDIR:-/tmp}/ce-omp-text-XXXXXX")" || return 1
  printf '%s' "$text" > "$tmp"
  recover_findings_json "$tmp" "$2"
  local st=$?
  rm -f "$tmp"
  return "$st"
}
classify_omp_outcome() {
  local verdict
  verdict="$(jq -rs '[.[] | select(.type=="turn_end")] | last | if . == null then "ok" else .message as $m | (($m.errorMessage // "") | tostring) as $e | if $e == "" then (if ($m.stopReason // "") == "stop" then "ok" else "failed" end) elif ($e | test("(^|[^0-9])529([^0-9]|$)"; "i")) and ($e | test("overload|capacity"; "i")) then "overloaded" else "failed" end end' "$PEERLOG" 2>/dev/null)" || verdict="ok"
  printf '%s\n' "$verdict"
}
classify_route_output() {
  PROVIDER_OUTCOME="$(classify_omp_outcome)"
  case "$PROVIDER_OUTCOME" in
    ok) ;;
    overloaded) RUN_SUCCEEDED=false; rm -f "$RAW_OUT" ;;
    *) log "reviewer terminal envelope reports failure; discarding output"; RUN_SUCCEEDED=false; rm -f "$RAW_OUT" ;;
  esac
}
run_omp_cmd() {
  RUN_SUCCEEDED=false
  local hard_cap="${1:-$HARD_SECS}" start now pid prev
  case "$-" in *m*) prev=1;; *) prev=0;; esac
  set -m
  ( cd "$PEER_WORKDIR" && exec "${CMD[@]}" ) < /dev/null > "$PEERLOG" 2>"$PEERERR" &
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
bounded_evidence() {
  local evidence
  evidence="$(jq -r '[(.result? // empty), (.message? // empty), (.error?.message? // empty)] | map(select(type == "string" and length > 0)) | unique | join(" | ")' "$1" 2>/dev/null)"
  [ -n "$evidence" ] || evidence="$(head -c 2000 "$1" 2>/dev/null)"
  evidence="$(printf '%s' "$evidence" | tr '\n' ' ')"
  [ "${#evidence}" -gt 300 ] && evidence="${evidence:0:147} ... ${evidence: -147}"
  printf '%s' "$evidence"
}
PY_BIN="$(resolve_python)"
[ -n "$PY_BIN" ] || skip "working Python 3 interpreter required; skipping"
build_cmd
log "reviewer run: target=omp route=omp lens=$REVIEWER_NAME read-only tool-less empty scratch (hard ${HARD_SECS}s); document content may egress to this target"
: > "$PEERLOG"; : > "$PEERERR"; rm -f "$RAW_OUT" "$OUT"
run_omp_cmd "$HARD_SECS"
classify_route_output
[ "$RUN_SUCCEEDED" = true ] && parse_omp_events "$PEERLOG" "$RAW_OUT"
rm -f "$OUT"
if [ -s "$RAW_OUT" ]; then
  _norm="$(mktemp "${TMPDIR:-/tmp}/xmodel-doc-norm-XXXXXX")"
  if jq --arg r "$REVIEWER_NAME-omp" --arg route "omp" --arg target "omp" --arg harness "omp" --arg family "unknown" --argjson independent false --arg mreq "auto" --arg mact "unverified" --arg ereq "unverified" 'if (.findings|type)=="array" then { reviewer: $r, cross_model_route: $route, cross_model_target: $target, cross_model_harness: $harness, serving_family: $family, independence_verified: $independent, model_requested: $mreq, model_actual: $mact, effort_requested: $ereq, effort_actual: "unverified", receipt_supported: false, findings: [ .findings[] | if (.autofix_class? == "safe_auto") then .autofix_class = "gated_auto" else . end ], residual_risks: (.residual_risks // []), deferred_questions: (.deferred_questions // []) } else empty end' "$RAW_OUT" > "$_norm" 2>/dev/null; then
    mv "$_norm" "$OUT"
  else
    rm -f "$_norm"
  fi
  rm -f "$RAW_OUT"
fi
if [ -s "$OUT" ] && jq -e '(.reviewer|type=="string") and (.findings|type=="array") and (.residual_risks|type=="array") and (.deferred_questions|type=="array")' "$OUT" >/dev/null 2>&1; then
  n="$(jq '.findings | length' "$OUT" 2>/dev/null || echo '?')"
  log "wrote $n finding(s) to $OUT (reviewer $REVIEWER_NAME-omp)"
else
  log "reviewer produced no usable schema-shaped output; skipping fold-in"
  [ -s "$PEERLOG" ] && log "  peer skip evidence: $(bounded_evidence "$PEERLOG")"
  [ -s "$PEERERR" ] && log "  peer skip evidence (stderr): $(bounded_evidence "$PEERERR")"
  rm -f "$OUT" "$RAW_OUT"
fi
[ -n "$PEER_WORKDIR" ] && [ "$PEER_WORKDIR" != "$RUN_DIR" ] && rm -rf "$PEER_WORKDIR"
trap - EXIT
exit 0

# Per-stage routing carriers

LFG has two routable stages, each stays native on OMP. This file owns detection, scope resolution, product-input sanitization, and how each stage is passed at its seam.

LFG is otherwise hands-off and never stops to ask. The single question it may ask is the one in scope rule 3 below, and only on an interactive host.

## What is routable

Interpret whether the invoking conversation expresses semantic intent to assign a pipeline stage, planning or implementation, to a specific OMP agent. This is judgment, not keyword or prompt-token matching: an explicit instruction such as "have planner author the plan" or "have task do the implementation" creates an assignment, while a plain mention of Planner, Task, Scout, Reviewer, or another agent in feature content, quoted material, comparison text, or a filename does not. Two pipeline stages are routable, each dispatched natively through the task tool:

- **Planning** routes to `ce-plan` with a `plan_model:<alias>` carrier beside the sanitized request, the plan-authoring model elevation. Example aliases: `planner`, `task`. On OMP a set key reports the requested alias as unresolvable and runs inline on the session model; for stronger reasoning dispatch a `planner` agent natively via the task tool.
- **Implementation** routes to `ce-work` in return-to-caller mode on the session model. Dispatch implementation work through a `task` agent and retrieval through a `scout` agent via the task tool; review gates stay with a `reviewer` agent. The host owns verification, canonical commits, and the shipping tail.

## Resolve each directive by scope

1. **Scoped directive**: the instruction names the stage ("have planner author the plan", "have task do the implementation", "planner for planning, task for work"). Route it to that stage's native dispatch. Multiple scoped directives may resolve at once, each to its own stage.
2. **Unscoped directive**: a bare agent assignment with no stage named ("use planner", "use task"). Bind it to the **implementation stage only**; never broaden an unscoped directive to planning or to every stage. Disclose the resolved binding in LFG's opening line before step 1 (e.g. "Implementation uses task natively; planning stays on the session model.").
3. **Unscoped and genuinely ambiguous, human present**: when an unscoped directive could credibly belong to more than one stage and mis-binding would be materially costly, and the host is interactive (exposes a blocking-question tool and is not a `disable-model-invocation`/headless run), ask exactly **one** upfront question to bind the stage before step 1, then proceed hands-off. In a `disable-model-invocation`/headless run, never ask, apply the implementation default and disclose it. The default path is mandatory: LFG runs from schedulers, loops, and nested orchestrators with no user to answer, so an unresolved directive must always fall to the disclosed default rather than block.

There is no preference or requirement strength, no fallback list, and no cross-stage binding. A directive that names an agent only selects which OMP agent does that stage natively; it never changes the seam, the model, or the tail owner.

## Implementation dispatch

There is no implementation carrier. When implementation resolves to an agent, retain it as stage-scoped native intent for the step 2 seam: `task` for implementation work, `scout` for retrieval inside that work, `reviewer` for gates. Pass no routing object, no model pin, and no provenance fields. Retired routing keys are no longer read; remove them from user configs. If the host cannot preserve that stage-scoped intent across its skill invocation, stop with a routing blocker rather than silently dropping the user's instruction.

## Sanitize product input

Remove every routing directive from the feature request that enters planning, keeping the request otherwise unchanged. Never pass any removed directive to `ce-plan`, `ce-doc-review`, `ce-code-review`, the settled-decisions brief, or any planning or review **product** input: routing is stage-scoped authority, not product content or a settled product decision. The `plan_model:<alias>` carrier is the one exception: it is structured routing data handed to `ce-plan` alongside, never woven into, the sanitized request. Do not construct a carrier from standing configuration here: when no explicit assignment exists for a stage, `ce-work` and `ce-plan` own resolution of still-applicable session and project intent and standing per-checkout configuration.

## Pass the planning carrier at step 1

When a planning-stage assignment resolved, prefix the `ce-plan` invocation with its `plan_model:<alias>` carrier, structured routing data beside the request, never woven into it, so `ce-plan` model elevation runs inline on the session model with a notice naming the requested alias as unresolvable, even in pipeline mode.

## Pass the implementation seam at step 2

Invoke `ce-work` with `mode:return-to-caller <plan-path-from-step-1>`. Pass no routing carrier and no empty carrier. `ce-work` always runs on the session model, inline or via subagents, with the host owning verification, canonical commits, and the shipping tail. LFG is an automatic, headless caller: it never prompts to change the native route.

Evidence reconciliation reuses the same seam. When the complete return lacks coherent verification evidence for behavior-bearing work, invoke `ce-work` once more with the unchanged plan path; `ce-work` inspects the already-implemented work through its idempotency check, completes the evidence, and returns without reimplementing. If the second return still lacks coherent evidence, stop as blocked instead of continuing to simplify, review, or ship.

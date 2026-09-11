---
name: ce-start
description: "Ask one question, then route to and invoke the right Compound Engineering skill. Use when the user asks what to do next, which skill to run, or states a goal without naming a skill."
argument-hint: "[what you want to do]"
---

# /ce-start

One blocking question, then a route. Do not invent a new workflow.

Ask: **What are you trying to do?** Offer destinations in plain language. Map the answer to an existing skill and invoke it (or tell the user the `/skill:<name>` form for hidden skills).

| If they want to… | Route |
|---|---|
| Figure out what to build | `ce-brainstorm` |
| Try something throwaway before committing to it | `ce-prototype` |
| Turn an idea into a plan | `ce-plan` |
| Build from a plan | `ce-work` |
| Ship it without stopping | `lfg` — warn this is hands-off; offer `mode:supervised` |
| Review a change | `ce-code-review` |
| Fix something broken | `ce-debug` |
| Make a working thing faster or cheaper | `ce-optimize` |
| Undo the last agent change | `ce-undo` |
| Capture what we learned | `ce-compound` |
| Check the plugin is set up | `ce-setup` |
| Gate the next request through a playbook | `ce-mode` — hidden; give them `/skill:ce-mode` |
| No existing CE skill owns the request | say so and stop routing |

Hidden skills (`disable-model-invocation` or `hide`) are invoked as `/skill:<name>`. Visible skills use `/skill-name`.

If the answer is already a named skill, invoke that skill. If two destinations fit, pick the earlier one in the loop (brainstorm before plan before work) and say so.

Do not implement, plan, or review inside this skill. Route, then stop.

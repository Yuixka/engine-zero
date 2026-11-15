# Engine Zero: five-system coordination contract

The five roles below are engineering workstreams, not five independently running AI agents. One shared repository and a coordinator are the source of truth.

## 1. Parametric CAD Component Library
Owner: components/, licensed part data, units, parameter definitions and provenance. Contract: each asset must declare geometry, dimensions, material data if known, and mechanical interfaces. Never assume missing physical properties.

## 2. Physics-Aware Assembly Graph
Owner: graph-engine.js and typed body/joint/interface constraints. Contract: accept components with compatible interfaces, reject invalid graph constraints, and record mobility/closure evidence.

## 3. Generative Design Engine
Owner: discovery.js, candidate generation, graph grammar and optimization. Contract: deterministic seeds, valid graph output and explicit search objective; generated does not mean novel.

## 4. Simulation and Verification
Owner: test.js, benchmark validation and future collision/dynamics checks. Contract: independent numerical checks and explicit PASS/FAIL evidence; planar kinematics does not establish mechanical safety.

## 5. Autonomous Experimentation
Owner: experiments/, evidence ledger and ranking. Contract: held-out objectives, reproducible runs, measured comparisons and falsifiable next experiments.

## Required daily cross-briefing
Read state/PROJECT_STATE.json, latest handoff, all five charters and Git diff. Run node scripts/handoff.js. Each specialist reviews the other four summaries and declares changed files, dependencies, broken interfaces, tests, blockers and next tasks. The coordinator chooses one integrated change, runs node test.js and node scripts/test-handoff.js, and records results before merging. Never claim work was implemented when only planned.

## Current limitations
The prototype handles ideal 2D kinematics. It does not have a verified CAD component library, material mechanics, 3D stress simulation, collision proof, fabrication readiness or patent clearance. GitHub Actions performs tests only, not AI development.

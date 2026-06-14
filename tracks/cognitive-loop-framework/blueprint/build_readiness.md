# Autonomous Cognitive Loop Framework: Revised Build Readiness Report

## Executive Summary

The vision of building an autonomous cognitive loop framework—a system that indexes its own codebase, maintains a persistent knowledge graph, reasons using a fine-tuned Small Language Model (SLM), and self-heals—is highly feasible with today's open-source tooling. 

However, achieving this without architectural drift requires a paradigm shift in how the build is managed. This revised report outlines a **Three-Project Architecture**, governed by a central Meta-Development System. This ensures that the existing `ttruthdesk-platform` and the new Cognitive Loop Framework are built systematically, iteratively, and cohesively using the Ralph Wiggum TDD loop methodology [1] [2].

## 1. The Three-Project Architecture

The build is no longer a single repository; it is an ecosystem managed by a command centre.

| Project Level | Repository / Role | Primary Function |
| :--- | :--- | :--- |
| **Project 0: The Command Centre** | `manus-persistent-drive` (Meta-Development System) | The active brain of the operation. Contains the blueprints, sprint definitions, Ralph Wiggum loop prompts, and the compounding memory log. It governs the build process for both Project 1 and Project 2. |
| **Project 1: The Product** | `ttruthdesk-platform` | The live application verifying scientific claims. Governed by Project 0 to ensure critical fixes and migration to an event-driven architecture are executed with discipline. |
| **Project 2: The Framework** | `cognitive-loop-framework` (New Repo) | The new infrastructure product. The general-purpose cognitive operating system (AST parsing, RuVector memory, SLM reasoning) that will eventually govern Project 1 and other future verticals. |

## 2. Project 0: The Meta-Development System (Command Centre)

Before writing any application code, the command centre must be structured. This repository compiles the development process, ensuring continuity across sessions and preventing context loss.

### Core Structure
- **`CURRENT_STATE.md`**: The single entry point. Every Manus session starts by reading this file to understand the exact status of the build and the current sprint's completion promise.
- **`blueprint/`**: Contains all static architectural decisions, failure analyses, and research reports.
- **`tracks/`**: Separate directories for `ttruthdesk` and `cognitive_loop` sprints. Each sprint contains a Ralph Wiggum loop prompt and explicit exit criteria.
- **`memory/compounding_log.md`**: The persistent memory file. Appended to after every successful loop iteration, recording what worked, what failed, and what the codebase looks like.

## 3. Project 2: The Cognitive Loop Framework (Build Readiness)

The new repository will be built in five strict sprints, managed by Project 0. The open-source tooling required for each sprint is mature and ready for integration [3] [4] [5].

### Sprint 1: Codebase Knowledge Graph and AST Parsing
- **Goal**: Enable the agent to structurally understand the codebase.
- **Tools**: **Tree-sitter** (MIT) for incremental, high-performance AST generation. **ts-morph** (MIT) for deep semantic extraction of TypeScript types and signatures.
- **Output**: A standardized SCIP (Source Code Intelligence Protocol) index ready for the graph database.

### Sprint 2: Agent Memory (Vector and Graph Databases)
- **Goal**: Create a persistent memory substrate handling both structural relationships and semantic meaning.
- **Tools**: **RuVector** (MIT). Highly recommended for its native integration of graph neural networks and vector search, perfectly aligning with the project's vision for self-learning memory.
- **Output**: A queryable database linking code dependencies (graph) with semantic documentation (vector).

### Sprint 3: SLM Fine-Tuning and Deployment
- **Goal**: Deploy a cost-effective, highly specialized reasoning engine.
- **Tools**: **Qwen2.5-Coder** (Apache 2.0) as the base model. **Unsloth + TRL** (Apache 2.0) for efficient LoRA fine-tuning on the project's own AST index and documentation. **Ollama** (MIT) for local deployment.
- **Output**: A fine-tuned SLM serving as the L2 (Self-Prompt) reasoning engine, running locally within the loop.

### Sprint 4: Orchestration and Self-Healing
- **Goal**: Implement the L4 (Meta) and L3 (Frontier) layers for health monitoring and automated repair.
- **Tools**: Adopt the Meta-Agent and Feedback Agent patterns from **SIA (Self-Improving AI)** (MIT). Study patch generation techniques from **Aider** (Apache 2.0).
- **Output**: A closed loop where the Meta-Agent validates SLM-generated repair candidates against test runner outputs.

### Sprint 5: The Assembly Agent
- **Goal**: Automate the meta-development process itself.
- **Tools**: The Manus API and the Ralph Wiggum methodology.
- **Output**: An agent that reads `CURRENT_STATE.md`, assigns sprints, monitors the loops, and updates the compounding memory log autonomously.

## Conclusion

The architecture is sound, and the tools are ready. By elevating the `manus-persistent-drive` into an active Meta-Development System, we ensure that the complex build of the new Cognitive Loop Framework—and the necessary refactoring of `ttruthdesk-platform`—is executed with rigorous discipline, zero drift, and perfect continuity.

## References
[1] Framework Research Data: Autonomous Agent Orchestration Frameworks.
[2] Framework Research Data: Self-healing and autonomous codebase maintenance.
[3] Framework Research Data: TypeScript AST Parsing and Codebase Knowledge Graph Tools.
[4] Framework Research Data: Vector and Graph Databases for Agent Memory and Codebase Knowledge Graphs.
[5] Framework Research Data: Small Language Model Fine-tuning for Code.

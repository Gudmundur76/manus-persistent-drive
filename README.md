# manus-persistent-drive
A persistent storage and memory system for GenSpark files, RuVector, and custom skills.

## Directory Structure

- **`memory/`**: Contains the persistent memory systems.
  - **`memory/vector/`**: Storage for **RuVector** indices and embeddings.
  - **`memory/knowledge_graph/`**: Storage for knowledge graph data (e.g., JSON/GraphML).
- **`skills/`**: A collection of custom Manus skills (each in its own subdirectory with a `SKILL.md`).
- **`data/`**: The primary file storage area.
  - **`data/genspark/`**: Files imported from GenSpark AI Drive.
  - **`data/generated/`**: Files created during Manus sessions that need to be preserved.
- **`config/`**: Configuration files for memory systems and skill loading.

## How to Use

1.  **At the start of a session**: Clone this repository to the sandbox.
2.  **To retrieve memory**: Load the latest RuVector index or Knowledge Graph from the `memory/` directory.
3.  **To access files**: Reference paths within `data/genspark/` or `data/generated/`.
4.  **To add new data**: Save files to the appropriate directory, commit, and push back to GitHub.

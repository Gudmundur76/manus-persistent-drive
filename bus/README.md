# GitHub Message Bus

This directory is the shared communication layer between all systems in the
discovery pipeline. Because direct HTTP between Manus-hosted services is
unreliable, every inter-service call goes through this git-backed message bus.

## How it works

1. **Producer** writes a JSON job file to `{service}/pending/` and commits+pushes.
2. **Consumer** polls `{service}/pending/` (git pull every N minutes), processes
   the job, writes the result to `{service}/results/`, and commits+pushes.
3. **Downstream** reads from `{service}/results/` on its next poll cycle.

Every job and result is permanently recorded in git history — full audit trail,
no lost requests, resilient to sandbox hibernation.

## Directory layout

```
bus/
  dna-evolve/
    pending/    ← generic-signal-api writes POST /v1/evolve job requests
    results/    ← dna-evolve job runner writes completed candidate results
  asi-evolve/
    results/    ← asi-evolve-discovery-engine writes daily discovery logs
  notus-is/
    results/    ← notus-is writes best candidates per discovery cycle
  slm/
    corpus/     ← ttruthdesk writes verified claims for LoRA fine-tuning
    models/     ← slm-infra writes model metadata after each training run
```

## Job file format (dna-evolve/pending/)

```json
{
  "jobId": "job_<timestamp>_<gene>",
  "createdAt": "2026-06-30T13:00:00.000Z",
  "source": "generic-signal-api",
  "request": {
    "seed": "GAGTCCGAGCAGAAGAAGAA",
    "targetGene": "PCSK9",
    "layer": "crispr-grna",
    "generations": 20,
    "population": 50,
    "topN": 3,
    "verify": true
  }
}
```

## Result file format (dna-evolve/results/)

```json
{
  "jobId": "job_<timestamp>_<gene>",
  "completedAt": "2026-06-30T13:05:00.000Z",
  "source": "dna-evolve",
  "status": "ok",
  "result": { ... DnaEvolveResult ... }
}
```

## Corpus entry format (slm/corpus/)

```json
{
  "batchId": "corpus_<timestamp>",
  "source": "ttruthdesk",
  "entries": [
    { "instruction": "...", "input": "...", "output": "..." }
  ]
}
```

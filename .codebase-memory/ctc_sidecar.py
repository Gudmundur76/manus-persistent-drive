#!/usr/bin/env python3
"""
ctc_sidecar.py
Python sidecar for ctc_bridge_tools.mjs.

Reads a JSON request from stdin, runs the requested method,
and writes a JSON response to stdout.

Methods:
  reconstruct: Run the MRAgent active reconstruction loop
"""

import json
import logging
import sys
from pathlib import Path

# Add evolva-mragent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "evolva-mragent"))

logging.basicConfig(level=logging.WARNING, stream=sys.stderr)
logger = logging.getLogger(__name__)

CTC_DB_PATH = Path.home() / ".codebase-memory" / "ctc_graph.db"


def handle_reconstruct(args: dict) -> dict:
    """Run the MRAgent active reconstruction loop."""
    question = args.get("question", "")
    domain = args.get("domain", "codebase")

    if not question:
        return {"error": "question is required", "answer": "", "confidence": "low"}

    if not CTC_DB_PATH.exists():
        return {
            "error": f"CTC graph not found at {CTC_DB_PATH}. Run ctc_indexer.py first.",
            "answer": "",
            "confidence": "low",
        }

    from evolva_mragent.memory.persistence import MemoryPersistence
    from evolva_mragent.memory.controller import MemoryController
    from evolva_mragent.llm.controller import LLMController
    from evolva_mragent.agent.reconstruct import ActiveReconstructionAgent
    from evolva_mragent.prompts.base import Prompts
    from evolva_mragent.prompts.evolva import CitationPrompts, CognitiveLoopPrompts, DecisionPrompts

    # Load the CTC graph
    persistence = MemoryPersistence()
    memory = persistence.load(str(CTC_DB_PATH))

    # Choose system prompt based on domain
    system_prompts = {
        "codebase": Prompts.AGENT_SYSTEM_PROMPT,
        "citation": Prompts.AGENT_SYSTEM_PROMPT,  # Can be overridden with CitationPrompts
        "cognitive_loop": Prompts.AGENT_SYSTEM_PROMPT,
        "decision": Prompts.AGENT_SYSTEM_PROMPT,
    }
    system_prompt = system_prompts.get(domain, Prompts.AGENT_SYSTEM_PROMPT)

    # Build controller and agent
    controller = MemoryController(memory)
    llm = LLMController()
    agent = ActiveReconstructionAgent(
        controller=controller,
        llm=llm,
        system_prompt=system_prompt,
    )

    # Run reconstruction
    result = agent.reconstruct(question)
    return result.to_dict()


def main():
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({"error": "Empty input"}))
            return

        request = json.loads(raw)
        method = request.get("method", "")
        args = request.get("args", {})

        if method == "reconstruct":
            response = handle_reconstruct(args)
        else:
            response = {"error": f"Unknown method: {method}"}

        print(json.dumps(response))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"JSON parse error: {e}"}))
    except Exception as e:
        logger.exception("Sidecar error")
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()

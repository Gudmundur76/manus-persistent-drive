import json
import os
from typing import List, Dict, Any, Optional

class KnowledgeGraphMemory:
    """
    A lightweight Knowledge Graph memory system for Manus.
    It stores nodes (entities) and edges (relationships) in a persistent JSON file.
    """
    def __init__(self, storage_path: str = "memory/knowledge_graph/graph.json"):
        self.storage_path = storage_path
        self.graph = {"nodes": {}, "edges": []}
        self._load_graph()

    def _load_graph(self):
        """Loads the knowledge graph from a JSON file."""
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r") as f:
                self.graph = json.load(f)

    def _save_graph(self):
        """Saves the knowledge graph to a JSON file."""
        with open(self.storage_path, "w") as f:
            json.dump(self.graph, f, indent=4)

    def add_node(self, node_id: str, label: str, properties: Optional[Dict[str, Any]] = None):
        """Adds a new node to the graph."""
        self.graph["nodes"][node_id] = {
            "label": label,
            "properties": properties or {}
        }
        self._save_graph()

    def add_relationship(self, source_id: str, target_id: str, relationship_type: str, properties: Optional[Dict[str, Any]] = None):
        """Adds a new relationship between two nodes."""
        if source_id not in self.graph["nodes"] or target_id not in self.graph["nodes"]:
            print(f"Warning: Nodes {source_id} or {target_id} do not exist.")
            return

        self.graph["edges"].append({
            "source": source_id,
            "target": target_id,
            "type": relationship_type,
            "properties": properties or {}
        })
        self._save_graph()

    def query_relationships(self, node_id: str) -> List[Dict[str, Any]]:
        """Queries all relationships for a given node."""
        return [edge for edge in self.graph["edges"] if edge["source"] == node_id or edge["target"] == node_id]

if __name__ == "__main__":
    # Example usage
    kg = KnowledgeGraphMemory()
    kg.add_node("user_1", "User", {"name": "Gudmundur"})
    kg.add_node("project_1", "Project", {"name": "Manus Persistent Drive"})
    kg.add_relationship("user_1", "project_1", "CREATED")
    print("Knowledge Graph memory initialized and example data added.")

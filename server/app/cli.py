import os
import json
from datetime import datetime
from .extensions import db
from .models import WorkOrder, Operation

def register_cli(app):
    @app.cli.command("seed")
    def seed():
        """Load sample data from server/seeds/seed.json."""
        path = os.path.join(app.root_path, "..", "seeds", "seed.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for w in data:
            wo = WorkOrder(id=w["id"], product=w.get("product", ""), qty=w.get("qty", 0))
            db.session.add(wo)
            for o in w.get("operations", []):
                op = Operation(
                    id=o["id"],
                    work_order_id=w["id"],
                    idx=o["index"],
                    machine_id=o["machineId"],
                    name=o.get("name", ""),
                    start_utc=datetime.fromisoformat(o["start"].replace("Z", "+00:00")),
                    end_utc=datetime.fromisoformat(o["end"].replace("Z", "+00:00")),
                )
                db.session.add(op)

        db.session.commit()
        print("Seed complete")
    
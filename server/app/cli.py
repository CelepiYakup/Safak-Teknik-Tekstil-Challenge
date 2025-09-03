import os
import json
from datetime import datetime
from .extensions import db
from .models import WorkOrder, Operation

def register_cli(app):
    @app.cli.command("seed")
    def seed():
        """Load sample data from server/seeds/seed.json."""
        possible_paths = [
            "/app/seeds/seed.json",
            os.path.join(os.getcwd(), "seeds", "seed.json"),
            os.path.join(app.root_path, "..", "seeds", "seed.json"), 
            os.path.join(os.path.dirname(os.path.dirname(app.root_path)), "seeds", "seed.json"),  # Two levels up
        ]
        
        path = None
        for p in possible_paths:
            print(f"Checking: {p}")
            if os.path.exists(p):
                path = p
                break
        
        if not path:
            print(f"Seed file not found. Tried paths:")
            for p in possible_paths:
                print(f"  - {p}")
            print(f"Current working directory: {os.getcwd()}")
            print(f"App root path: {app.root_path}")
            return
            
        print(f"Using seed file: {path}")
        
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for w in data:
            existing_wo = WorkOrder.query.filter_by(id=w["id"]).first()
            if existing_wo:
                print(f"Work Order {w['id']} zaten mevcut, atlanıyor...")
                continue
                
            wo = WorkOrder(id=w["id"], product=w.get("product", ""), qty=w.get("qty", 0))
            db.session.add(wo)
            
            for o in w.get("operations", []):
                existing_op = Operation.query.filter_by(id=o["id"]).first()
                if existing_op:
                    print(f"Operation {o['id']} zaten mevcut, atlanıyor...")
                    continue
                    
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
        
    @app.cli.command("reset-db")
    def reset_db():
        """Reset database by dropping all tables and recreating them."""
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("Database reset complete")
        
    @app.cli.command("clear-data")
    def clear_data():
        """Clear all data from tables without dropping them."""
        print("Clearing operations...")
        Operation.query.delete()
        print("Clearing work orders...")
        WorkOrder.query.delete()
        db.session.commit()
        print("Data cleared")
from .extensions import db

class WorkOrder(db.Model):
    __tablename__ = "work_orders"
    id = db.Column(db.String, primary_key=True)
    product = db.Column(db.String, nullable=False)
    qty = db.Column(db.Integer, nullable=False)
    operations = db.relationship(
        "Operation",
        backref="work_order",
        cascade="all, delete-orphan",
        order_by="Operation.idx",
    )

class Operation(db.Model):
    __tablename__ = "operations"
    id = db.Column(db.String, primary_key=True)
    work_order_id = db.Column(db.String, db.ForeignKey("work_orders.id"), nullable=False)
    idx = db.Column(db.Integer, nullable=False)
    machine_id = db.Column(db.String, nullable=False)
    name = db.Column(db.String, nullable=False)
    start_utc = db.Column(db.DateTime(timezone=True), nullable=False)
    end_utc = db.Column(db.DateTime(timezone=True), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("work_order_id", "idx", name="ux_ops_wo_idx"),
    )

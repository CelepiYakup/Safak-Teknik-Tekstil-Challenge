from flask import Blueprint, jsonify
from ..models import WorkOrder

bp = Blueprint("work_orders", __name__)

@bp.get("")
def list_work_orders():
    def op_to_dict(op):
        start = op.start_utc.isoformat().replace("+00:00", "Z")
        end = op.end_utc.isoformat().replace("+00:00", "Z")
        return {
            "id": op.id,
            "workOrderId": op.work_order_id,
            "index": op.idx,
            "machineId": op.machine_id,
            "name": op.name,
            "start": start,
            "end": end,
        }

    payload = [{
        "id": wo.id,
        "product": wo.product,
        "qty": wo.qty,
        "operations": [op_to_dict(o) for o in wo.operations],
    } for wo in WorkOrder.query.order_by(WorkOrder.id).all()]

    return jsonify(payload)

from datetime import datetime
from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Operation
from ..rules import validate_update, get_scheduling_constraints, find_valid_time_slot

bp = Blueprint("operations", __name__)


@bp.patch("/<op_id>")
def update_operation(op_id):
    body = request.get_json(force=True)
    start = datetime.fromisoformat(body["start"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(body["end"].replace("Z", "+00:00"))

    op = Operation.query.get_or_404(op_id)

    original_start = op.start_utc
    original_end = op.end_utc

    ok, err = validate_update(op, start, end)

    if not ok:
        return (
            jsonify(
                {
                    "code": "RULE_VIOLATION",
                    "message": err["message"],
                    "details": err,
                    "operation": {
                        "id": op.id,
                        "workOrderId": op.work_order_id,
                        "name": op.name,
                        "originalStart": original_start.isoformat().replace(
                            "+00:00", "Z"
                        ),
                        "originalEnd": original_end.isoformat().replace("+00:00", "Z"),
                    },
                }
            ),
            400,
        )

    op.start_utc, op.end_utc = start, end
    db.session.commit()

    return jsonify(
        {
            "id": op.id,
            "workOrderId": op.work_order_id,
            "name": op.name,
            "start": op.start_utc.isoformat().replace("+00:00", "Z"),
            "end": op.end_utc.isoformat().replace("+00:00", "Z"),
            "success": True,
        }
    )


@bp.get("/<op_id>/constraints")
def get_operation_constraints(op_id):
    constraints = get_scheduling_constraints(op_id)

    if not constraints:
        return jsonify({"error": "Operation not found"}), 404

    return jsonify(constraints)


@bp.post("/<op_id>/validate")
def validate_operation_move(op_id):
    body = request.get_json(force=True)
    start = datetime.fromisoformat(body["start"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(body["end"].replace("Z", "+00:00"))

    op = Operation.query.get_or_404(op_id)
    ok, err = validate_update(op, start, end)

    if ok:
        return jsonify(
            {"valid": True, "message": "Operation can be moved to this time slot"}
        )
    else:
        suggested_start = None
        if "conflictWith" in err:
            duration_hours = (end - start).total_seconds() / 3600
            suggested_start = find_valid_time_slot(
                op.machine_id, duration_hours, start, op.work_order_id, op.idx, op.id
            )

        response = {"valid": False, "message": err["message"], "details": err}

        if suggested_start:
            suggested_end = datetime.fromtimestamp(
                suggested_start.timestamp() + (end - start).total_seconds(),
                tz=suggested_start.tzinfo,
            )
            response["suggestion"] = {
                "start": suggested_start.isoformat().replace("+00:00", "Z"),
                "end": suggested_end.isoformat().replace("+00:00", "Z"),
            }

        return jsonify(response), 400


@bp.get("/<op_id>/valid-slots")
def get_valid_time_slots(op_id):
    start_param = request.args.get("start")
    duration_param = request.args.get("duration")

    if not start_param or not duration_param:
        return jsonify({"error": "start and duration parameters required"}), 400

    try:
        preferred_start = datetime.fromisoformat(start_param.replace("Z", "+00:00"))
        duration_hours = float(duration_param)
    except ValueError:
        return jsonify({"error": "Invalid start time or duration format"}), 400

    op = Operation.query.get_or_404(op_id)

    valid_start = find_valid_time_slot(
        op.machine_id, duration_hours, preferred_start, op.work_order_id, op.idx, op.id
    )

    if valid_start:
        valid_end = datetime.fromtimestamp(
            valid_start.timestamp() + duration_hours * 3600, tz=valid_start.tzinfo
        )
        return jsonify(
            {
                "validSlot": {
                    "start": valid_start.isoformat().replace("+00:00", "Z"),
                    "end": valid_end.isoformat().replace("+00:00", "Z"),
                }
            }
        )
    else:
        return (
            jsonify(
                {
                    "validSlot": None,
                    "message": "No valid time slot found for the requested duration",
                }
            ),
            404,
        )

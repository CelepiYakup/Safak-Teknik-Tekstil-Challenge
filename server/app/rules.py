from datetime import datetime, timezone
from .models import Operation, WorkOrder


def overlaps(a_start, a_end, b_start, b_end):
    return max(a_start, b_start) < min(a_end, b_end)


def validate_update(op: Operation, new_start, new_end):
    if new_start >= new_end:
        return False, {"message": "Start must be before end"}

    now = datetime.now(timezone.utc)
    if new_start < now:
        return False, {"message": "Start cannot be before now"}

    work_order = WorkOrder.query.get(op.work_order_id)
    if not work_order:
        return False, {"message": "Work order not found"}

    prev = Operation.query.filter_by(
        work_order_id=op.work_order_id, idx=op.idx - 1
    ).first()
    if prev and new_start < prev.end_utc:
        return False, {
            "message": f"Operation must start after previous (idx {op.idx - 1} ends)",
            "prevEnd": prev.end_utc.isoformat(),
            "prevName": prev.name,
        }

    next_op = Operation.query.filter_by(
        work_order_id=op.work_order_id, idx=op.idx + 1
    ).first()
    if next_op and new_end > next_op.start_utc:
        return False, {
            "message": f"Operation must end before next (idx {op.idx + 1} starts)",
            "nextStart": next_op.start_utc.isoformat(),
            "nextName": next_op.name,
        }

    siblings = Operation.query.filter(
        Operation.machine_id == op.machine_id, Operation.id != op.id
    ).all()
    for s in siblings:
        if overlaps(new_start, new_end, s.start_utc, s.end_utc):
            return False, {
                "message": f"Overlap in lane {op.machine_id} with {s.id}",
                "conflictWith": s.id,
                "conflictName": s.name,
                "conflictStart": s.start_utc.isoformat(),
                "conflictEnd": s.end_utc.isoformat(),
            }

    return True, None


def validate_operation_sequence(work_order_id):
    operations = (
        Operation.query.filter_by(work_order_id=work_order_id)
        .order_by(Operation.idx)
        .all()
    )
    violations = []

    for i in range(len(operations) - 1):
        current_op = operations[i]
        next_op = operations[i + 1]

        if current_op.end_utc > next_op.start_utc:
            violations.append(
                {
                    "currentOp": current_op.id,
                    "nextOp": next_op.id,
                    "message": f"{current_op.name} ends after {next_op.name} starts",
                }
            )

    return len(violations) == 0, violations


def validate_machine_availability(machine_id, start_time, end_time, exclude_op_id=None):
    query = Operation.query.filter(Operation.machine_id == machine_id)
    if exclude_op_id:
        query = query.filter(Operation.id != exclude_op_id)

    conflicting_ops = query.all()
    conflicts = []

    for op in conflicting_ops:
        if overlaps(start_time, end_time, op.start_utc, op.end_utc):
            conflicts.append(
                {
                    "operationId": op.id,
                    "workOrderId": op.work_order_id,
                    "name": op.name,
                    "start": op.start_utc.isoformat(),
                    "end": op.end_utc.isoformat(),
                }
            )

    return len(conflicts) == 0, conflicts


def find_valid_time_slot(
    machine_id,
    duration_hours,
    preferred_start,
    work_order_id,
    operation_idx,
    exclude_op_id=None,
):
    now = datetime.now(timezone.utc)
    duration_seconds = duration_hours * 3600

    earliest_start = max(now, preferred_start)

    prev_op = Operation.query.filter_by(
        work_order_id=work_order_id, idx=operation_idx - 1
    ).first()
    if prev_op:
        earliest_start = max(earliest_start, prev_op.end_utc)

    next_op = Operation.query.filter_by(
        work_order_id=work_order_id, idx=operation_idx + 1
    ).first()
    latest_end = None
    if next_op:
        latest_end = next_op.start_utc
        latest_start = datetime.fromtimestamp(
            latest_end.timestamp() - duration_seconds, tz=timezone.utc
        )
        if earliest_start > latest_start:
            return None

    query = Operation.query.filter(Operation.machine_id == machine_id)
    if exclude_op_id:
        query = query.filter(Operation.id != exclude_op_id)

    machine_ops = query.order_by(Operation.start_utc).all()

    search_start = earliest_start

    for op in machine_ops:
        candidate_end = datetime.fromtimestamp(
            search_start.timestamp() + duration_seconds, tz=timezone.utc
        )

        if latest_end and candidate_end > latest_end:
            return None

        if candidate_end <= op.start_utc:
            return search_start

        if search_start < op.end_utc:
            search_start = op.end_utc

    final_candidate_end = datetime.fromtimestamp(
        search_start.timestamp() + duration_seconds, tz=timezone.utc
    )

    if latest_end and final_candidate_end > latest_end:
        return None

    return search_start


def get_scheduling_constraints(operation_id):
    op = Operation.query.get(operation_id)
    if not op:
        return None

    constraints = {
        "operationId": operation_id,
        "workOrderId": op.work_order_id,
        "machineId": op.machine_id,
        "index": op.idx,
        "minStart": datetime.now(timezone.utc).isoformat(),
    }

    prev_op = Operation.query.filter_by(
        work_order_id=op.work_order_id, idx=op.idx - 1
    ).first()
    if prev_op:
        constraints["minStart"] = prev_op.end_utc.isoformat()
        constraints["prevOperation"] = {
            "id": prev_op.id,
            "name": prev_op.name,
            "end": prev_op.end_utc.isoformat(),
        }

    next_op = Operation.query.filter_by(
        work_order_id=op.work_order_id, idx=op.idx + 1
    ).first()
    if next_op:
        constraints["maxEnd"] = next_op.start_utc.isoformat()
        constraints["nextOperation"] = {
            "id": next_op.id,
            "name": next_op.name,
            "start": next_op.start_utc.isoformat(),
        }

    machine_conflicts = Operation.query.filter(
        Operation.machine_id == op.machine_id, Operation.id != op.id
    ).all()

    constraints["machineConflicts"] = [
        {
            "id": conflict.id,
            "workOrderId": conflict.work_order_id,
            "name": conflict.name,
            "start": conflict.start_utc.isoformat(),
            "end": conflict.end_utc.isoformat(),
        }
        for conflict in machine_conflicts
    ]

    return constraints

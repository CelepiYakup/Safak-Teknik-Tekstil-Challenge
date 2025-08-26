from datetime import datetime, timezone
from .models import Operation


def overlaps(a_start, a_end, b_start, b_end):
    return max(a_start, b_start) < min(a_end, b_end)


def validate_update(op: Operation, new_start, new_end):
    if new_start >= new_end:
        return False, {"message": "Start must be before end"}

    now = datetime.now(timezone.utc)
    if new_start < now:
        return False, {"message": "Start cannot be before now"}

    # R1:
    prev = Operation.query.filter_by(
        work_order_id=op.work_order_id, idx=op.idx - 1
    ).first()
    if prev and new_start < prev.end_utc:
        return False, {
            "message": f"Operation must start after previous (idx {op.idx - 1} ends)",
            "prevEnd": prev.end_utc.isoformat(),
        }

    # R2:
    siblings = Operation.query.filter(
        Operation.machine_id == op.machine_id, Operation.id != op.id
    ).all()
    for s in siblings:
        if overlaps(new_start, new_end, s.start_utc, s.end_utc):
            return False, {
                "message": f"overlap in lane {op.machine_id} with {s.id}",
                "conflictWith": s.id,
            }

    return True, None

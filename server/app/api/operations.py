from datetime import datetime
from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Operation
from ..rules import validate_update

bp = Blueprint("operations", __name__)


@bp.patch("/<op_id>")
def update_operation(op_id):
    body = request.get_json(force=True)
    start = datetime.fromisoformat(body["start"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(body["end"].replace("Z", "+00:00"))

    op = Operation.query.get_or_404(op_id)
    ok, err = validate_update(op, start, end)

    if not ok:
        return (
            jsonify(
                {"code": "RULE_VIOLATION", "message": err["message"], "details": err}
            ),
            400,
        )

    op.start_utc, op.end_utc = start, end
    db.session.commit()

    return jsonify(
        {
            "id": op.id,
            "start": op.start_utc.isoformat().replace("+00:00", "Z"),
            "end": op.end_utc.isoformat().replace("+00:00", "Z"),
        }
    )

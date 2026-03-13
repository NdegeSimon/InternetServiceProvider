"""MPESA-related route handlers."""

from flask import Blueprint, jsonify, request

mpesa_bp = Blueprint("mpesa", __name__)


@mpesa_bp.get("/health")
def mpesa_health():
    return jsonify(status="mpesa ok")


@mpesa_bp.post("/stk-push")
def stk_push():
    data = request.get_json(force=True)
    # TODO: Implement real MPESA STK push logic.
    return jsonify(received=data), 200

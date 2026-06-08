"""Sightline cloud aggregation service.

This package is the public-facing "cloud" that ingests parking-detection
availability from every ParkIQ site (operators) and exposes a read-only,
privacy-preserving public API that the Sightline website consumes so drivers
can decide whether a destination is busy or free before they leave.

Only aggregate parking-detection counts are ingested here -- never video,
never per-vehicle data.
"""

"""
Concurrent load simulation – 100 simultaneous in-process requests.

Uses a ThreadPoolExecutor to simulate 100 users hitting the most common
read endpoints at the same time.  Reuses conftest fixtures so no extra
mocking is needed.
"""
from __future__ import annotations

import concurrent.futures
import time

import pytest


def _hit(app, path: str) -> tuple[int, float]:
    """Each thread owns its own FlaskClient – Werkzeug's test client is not thread-safe."""
    with app.test_client() as c:
        start = time.perf_counter()
        resp = c.get(path)
        return resp.status_code, time.perf_counter() - start


def test_100_concurrent_requests(app, test_db):
    """100 concurrent GET requests must all succeed with p99 < 1 s."""
    # Seed products and vets so the list endpoints return real data
    for i in range(20):
        test_db.products.insert_one({
            "name": f"Product {i}", "description": "desc",
            "category": "Food", "petType": "Dog",
            "price": float(i * 10 + 100), "stock": 50,
        })
    for i in range(10):
        test_db.vets.insert_one({
            "name": f"Dr. Vet {i}", "location": "Kolkata",
            "specialization": "General",
        })

    CONCURRENCY = 100
    endpoints = ["/health", "/api/products", "/api/vets"]
    tasks = [endpoints[i % len(endpoints)] for i in range(CONCURRENCY)]

    latencies: list[float] = []
    statuses: list[int] = []

    # Each thread creates its own FlaskClient (Werkzeug test client is NOT
    # thread-safe, so sharing one client across threads would cause races).
    # Flask 3.x pushes an independent app+request context per WSGI call,
    # so mongo/cache proxies resolve correctly inside every thread.
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = [pool.submit(_hit, app, path) for path in tasks]
        for f in concurrent.futures.as_completed(futures):
            s, t = f.result()
            statuses.append(s)
            latencies.append(t)

    ok = sum(1 for s in statuses if s == 200)
    lat = sorted(latencies)
    p50 = lat[CONCURRENCY // 2]
    p95 = lat[int(CONCURRENCY * 0.95)]
    p99 = lat[int(CONCURRENCY * 0.99)]

    print(f"\n{'='*56}")
    print(f"  Concurrent users : {CONCURRENCY}")
    print(f"  Success  (200)   : {ok}/{CONCURRENCY}")
    print(f"  Latency  p50     : {p50*1000:.1f} ms")
    print(f"  Latency  p95     : {p95*1000:.1f} ms")
    print(f"  Latency  p99     : {p99*1000:.1f} ms")
    print(f"  Latency  max     : {max(latencies)*1000:.1f} ms")
    print(f"{'='*56}")

    assert ok == CONCURRENCY, f"Only {ok}/{CONCURRENCY} requests succeeded"
    assert p99 < 1.0, f"p99 {p99*1000:.0f} ms exceeded 1000 ms threshold"

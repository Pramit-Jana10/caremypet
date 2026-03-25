# gunicorn.conf.py  –  Linux / production server configuration
#
# Launch with:
#   gunicorn -c gunicorn.conf.py "src.app:create_app()"
#
# Thread math: 2 workers × 50 threads = 100 concurrent requests.
# Increase workers on multi-core hosts (rule of thumb: 2 × CPU_COUNT + 1).

import multiprocessing

bind = "0.0.0.0:5000"

# Worker count – keep at 2 for single/dual core; scale up for more cores.
workers = int(__import__("os").getenv("WEB_CONCURRENCY", max(2, multiprocessing.cpu_count())))

# gthread: OS threads, fully compatible with PyMongo / Flask-Caching.
# gevent/eventlet would require monkey-patching and is not safe with PyMongo.
worker_class = "gthread"

# Threads per worker.  workers × threads must cover peak concurrency.
threads = int(__import__("os").getenv("WORKER_THREADS", "50"))

# Drop requests that take longer than this (seconds).
timeout = 30

# How long keepalive connections are held open between requests.
keepalive = 5

# Allow OS to reuse the socket before worker respawn completes.
reuse_port = True

# Log to stdout/stderr so container runtimes collect logs automatically.
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Load the application before forking workers.
# Saves memory via copy-on-write and catches import errors immediately.
preload_app = True

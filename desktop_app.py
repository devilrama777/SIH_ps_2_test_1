#!/usr/bin/env python3
"""
MineIntel Desktop Application Entry Point
Spawns the local FastAPI server and launches a native Cocoa / WebKit desktop window.
"""

import argparse
import logging
import os
import socket
import sys
import threading
import time
from pathlib import Path
import uvicorn
import webview

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app
from backend.services.inference_manager import InferenceManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("MineIntelDesktop")


def find_available_port(default_port: int = 58432) -> int:
    """Finds an open port starting from default_port."""
    for p in range(default_port, default_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return default_port


def start_server(port: int):
    """Runs uvicorn ASGI server in background thread."""
    logger.info(f"Starting embedded FastAPI server on 127.0.0.1:{port}...")
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=port,
        log_level="warning",
        access_log=False
    )
    server = uvicorn.Server(config)
    server.run()


def wait_for_server(port: int, max_retries: int = 20) -> bool:
    """Waits until the local server responds to connection requests."""
    for _ in range(max_retries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return True
        time.sleep(0.15)
    return False


def main():
    parser = argparse.ArgumentParser(description="MineIntel Desktop Intelligence Platform")
    parser.add_argument("--headless", action="store_true", help="Run server only without spawning GUI window")
    parser.add_argument("--port", type=int, default=58432, help="Internal port for desktop application")
    args = parser.parse_args()

    port = find_available_port(args.port)
    
    # 1. Initialize local LLM inference manager
    inference_mgr = InferenceManager()

    # 2. Launch FastAPI in daemon thread
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    if not wait_for_server(port):
        logger.error("Failed to bind internal application server.")
        sys.exit(1)

    app_url = f"http://127.0.0.1:{port}"
    logger.info(f"MineIntel application core ready at {app_url}")

    if args.headless:
        logger.info("Running in headless mode. Press Ctrl+C to terminate.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            inference_mgr.shutdown()
            sys.exit(0)

    # 3. Create native Cocoa desktop window
    logger.info("Launching native desktop window...")
    window = webview.create_window(
        title="MineIntel • Ministry of Coal Executive Intelligence Platform",
        url=app_url,
        width=1440,
        height=920,
        min_size=(1024, 720),
        resizable=True,
        background_color="#0f172a",
        text_select=True
    )

    try:
        # Start Cocoa WebKit event loop
        webview.start(debug=False)
    finally:
        logger.info("Desktop window closed. Terminating background services...")
        inference_mgr.shutdown()


if __name__ == "__main__":
    main()

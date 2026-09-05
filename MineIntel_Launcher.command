#!/bin/bash
# MineIntel Desktop — Ministry of Coal Platform Launcher
# Double-click this script from Finder or Desktop to start the local application.

cd "$(dirname "$0")"

# Check for local virtual environment
if [ -f ".venv/bin/python3" ]; then
    PYTHON_BIN=".venv/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
else
    echo "Python 3 is required to launch MineIntel Desktop."
    read -p "Press Enter to exit..."
    exit 1
fi

echo "=========================================================="
echo " Starting MineIntel Desktop Intelligence Platform...      "
echo " Government of India • Ministry of Coal Sovereign Enclave "
echo "=========================================================="

"$PYTHON_BIN" desktop_app.py

#!/usr/bin/env python3
"""
MineIntel Desktop Packaging Helper
Builds a standalone executable or macOS .app bundle using PyInstaller.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent


def build_package():
    print("==========================================================")
    print(" Building Standalone MineIntel Desktop Application...     ")
    print("==========================================================")

    pyinstaller_bin = shutil.which("pyinstaller") or str(root_dir / ".venv" / "bin" / "pyinstaller")
    if not os.path.exists(pyinstaller_bin):
        print("Installing pyinstaller into virtual environment...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        pyinstaller_bin = shutil.which("pyinstaller") or str(root_dir / ".venv" / "bin" / "pyinstaller")

    cmd = [
        pyinstaller_bin,
        "desktop_app.py",
        "--name=MineIntel",
        "--windowed",
        "--clean",
        "--noconfirm",
        f"--add-data={root_dir / 'backend' / 'static'}:backend/static",
        f"--add-data={root_dir / 'backend' / 'prompts'}:backend/prompts",
        f"--add-data={root_dir / 'default_data_backup'}:default_data_backup"
    ]

    print(f"Executing: {' '.join(cmd)}")
    subprocess.check_call(cmd, cwd=root_dir)
    print("\n[SUCCESS] MineIntel Desktop package compiled into dist/ directory.")


if __name__ == "__main__":
    build_package()

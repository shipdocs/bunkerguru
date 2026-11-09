#!/usr/bin/env bash
# Bouw een model uit blender/models/<naam>.py headless met Blender.
#   blender/make.sh <naam> [--png art/x.png] [--glb 3d/assets/x.glb] [--px 20] [--view top|iso] [--samples 32] [--outline 1]
# Zonder --png/--glb wordt <naam>.blend opgeslagen (openen in Blender op je eigen pc).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
name="${1:?modelnaam, zie blender/models/}"; shift
command -v blender >/dev/null || { echo "Blender ontbreekt: sudo apt-get install -y blender python3-numpy python3-pil" >&2; exit 1; }
cd "$here/.."
PYTHONPATH="$here${PYTHONPATH:+:$PYTHONPATH}" blender -b --factory-startup --python-exit-code 1 \
  -P "$here/models/$name.py" -- "$@" > "${TMPDIR:-/tmp}/blender-$name.log" 2>&1 || { tail -30 "${TMPDIR:-/tmp}/blender-$name.log" >&2; exit 1; }
grep '^\[bglib\]' "${TMPDIR:-/tmp}/blender-$name.log"

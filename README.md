# COLMAP Web Viewer

This repository provides a simple Flask server to visualize multiple COLMAP workspaces in a web browser.

## Usage

1. Place your COLMAP workspaces inside `viewer/workspaces/`, each in its own directory. The sparse reconstruction should be under `sparse/0/` containing `cameras.txt`, `images.txt` and `points3D.txt`.
   A small example workspace is provided in `viewer/workspaces/sample` for testing.
2. Install dependencies:
   ```bash
   pip install flask
   ```
3. Start the server:
   ```bash
   python viewer/app.py
   ```
4. Open `http://localhost:5000` in your browser to see a list of available workspaces.
5. Click any workspace name to open its dedicated page with an interactive 3D view of the sparse points and camera poses.

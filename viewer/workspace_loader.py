import os
from typing import List, Dict


def list_workspaces(base_path: str = os.path.join(os.path.dirname(__file__), "workspaces")) -> List[str]:
    if not os.path.isdir(base_path):
        return []
    workspaces = []
    for name in os.listdir(base_path):
        w_path = os.path.join(base_path, name)
        if not os.path.isdir(w_path):
            continue
        sparse_dir = os.path.join(w_path, 'sparse', '0')
        root_files = all(os.path.isfile(os.path.join(w_path, f)) for f in (
            'cameras.txt', 'images.txt', 'points3D.txt'))
        if os.path.isdir(sparse_dir) or root_files:
            workspaces.append(name)
    return workspaces


def _parse_cameras(path: str) -> Dict[int, Dict]:
    cameras = {}
    if not os.path.exists(path):
        return cameras
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            tokens = line.split()
            if len(tokens) < 5:
                continue
            camera_id = int(tokens[0])
            model = tokens[1]
            width = int(tokens[2])
            height = int(tokens[3])
            params = list(map(float, tokens[4:]))
            cameras[camera_id] = {
                'model': model,
                'width': width,
                'height': height,
                'params': params,
            }
    return cameras


def _parse_images(path: str) -> Dict[int, Dict]:
    images = {}
    if not os.path.exists(path):
        return images
    with open(path, 'r') as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    i = 0
    while i < len(lines):
        tokens = lines[i].split()
        if len(tokens) < 9:
            i += 1
            continue
        image_id = int(tokens[0])
        qw, qx, qy, qz = map(float, tokens[1:5])
        tx, ty, tz = map(float, tokens[5:8])
        camera_id = int(tokens[8])
        name = tokens[9]
        images[image_id] = {
            'qw': qw,
            'qx': qx,
            'qy': qy,
            'qz': qz,
            'tx': tx,
            'ty': ty,
            'tz': tz,
            'camera_id': camera_id,
            'name': name,
        }
        i += 2  # skip corresponding 2D points line
    return images


def _parse_points3d(path: str) -> List[Dict]:
    points = []
    if not os.path.exists(path):
        return points
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            tokens = line.split()
            if len(tokens) < 7:
                continue
            x, y, z = map(float, tokens[1:4])
            r, g, b = map(int, tokens[4:7])
            points.append({'x': x, 'y': y, 'z': z, 'r': r, 'g': g, 'b': b})
    return points


def load_workspace(name: str, base_path: str = os.path.join(os.path.dirname(__file__), 'workspaces')) -> Dict:
    root = os.path.join(base_path, name)
    sparse_path = os.path.join(root, 'sparse', '0')
    if os.path.isdir(sparse_path):
        base = sparse_path
    else:
        base = root

    cameras = _parse_cameras(os.path.join(base, 'cameras.txt'))
    images = _parse_images(os.path.join(base, 'images.txt'))
    points = _parse_points3d(os.path.join(base, 'points3D.txt'))
    return {'cameras': cameras, 'images': images, 'points': points}

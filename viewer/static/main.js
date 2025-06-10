let renderer, scene, camera, controls;
let pointCloud = null;
let pointMaterial = null;
let cameraGroup = null;

function initThree() {
    const container = document.getElementById('viewer');
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 1);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AxesHelper(0.1));
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

async function loadWorkspaces() {
    const res = await fetch('/api/workspaces');
    const data = await res.json();
    const listDiv = document.getElementById('workspace-list');
    listDiv.innerHTML = '';
    const ul = document.createElement('ul');
    data.workspaces.forEach(name => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '/workspace/' + name;
        link.textContent = name;
        li.appendChild(link);
        ul.appendChild(li);
    });
    listDiv.appendChild(ul);
}

function quaternionToMatrix(qw, qx, qy, qz) {
    const q = new THREE.Quaternion(qx, qy, qz, qw); // note order
    const m = new THREE.Matrix4();
    m.makeRotationFromQuaternion(q);
    return m;
}

function cameraCenter(image) {
    const R = quaternionToMatrix(image.qw, image.qx, image.qy, image.qz);
    const t = new THREE.Vector3(image.tx, image.ty, image.tz);
    const Rt = new THREE.Matrix3().setFromMatrix4(R);
    const RtInv = Rt.clone().invert();
    const c = t.clone().applyMatrix3(RtInv).multiplyScalar(-1);
    return c;
}

async function loadWorkspace(name) {
    if (!renderer) initThree();
    const res = await fetch('/api/workspace/' + name);
    const data = await res.json();
    while (scene.children.length) {
        scene.remove(scene.children[0]);
    }
    scene.add(new THREE.AxesHelper(0.1));
    pointCloud = null;
    pointMaterial = null;
    cameraGroup = null;

    const pts = data.points;
    if (pts.length) {
        const positions = new Float32Array(pts.length * 3);
        const colors = new Float32Array(pts.length * 3);
        pts.forEach((p, i) => {
            positions[i*3] = p.x;
            positions[i*3+1] = p.y;
            positions[i*3+2] = p.z;
            colors[i*3] = p.r/255;
            colors[i*3+1] = p.g/255;
            colors[i*3+2] = p.b/255;
        });
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions,3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors,3));
        const defaultSize = parseFloat(document.getElementById('point-size').value || '0.01');
        pointMaterial = new THREE.PointsMaterial({ size: defaultSize, vertexColors:true });
        pointCloud = new THREE.Points(geom, pointMaterial);
        scene.add(pointCloud);
    }

    cameraGroup = new THREE.Group();
    const camSize = parseFloat(document.getElementById('camera-size').value || '0.02');
    for (const key in data.images) {
        const img = data.images[key];
        const center = cameraCenter(img);
        const sphereGeom = new THREE.SphereGeometry(camSize, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({color:0xff0000});
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.copy(center);
        cameraGroup.add(sphere);
    }
    scene.add(cameraGroup);
}

function setupSizeControls() {
    const pointSlider = document.getElementById('point-size');
    const cameraSlider = document.getElementById('camera-size');
    if (pointSlider) {
        pointSlider.addEventListener('input', () => {
            const val = parseFloat(pointSlider.value);
            if (pointMaterial) {
                pointMaterial.size = val;
            }
        });
    }
    if (cameraSlider) {
        cameraSlider.addEventListener('input', () => {
            const val = parseFloat(cameraSlider.value);
            if (cameraGroup) {
                cameraGroup.children.forEach(c => c.scale.set(val, val, val));
            }
        });
    }
}

window.addEventListener('load', () => {
    if (document.getElementById('workspace-list')) {
        loadWorkspaces();
    } else if (typeof WORKSPACE !== 'undefined') {
        loadWorkspace(WORKSPACE);
    }
    setupSizeControls();
});

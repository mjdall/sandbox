import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { csv } from 'd3-fetch';
import { ShaderMaterial } from 'three';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1); // Set background color to black
renderer.setPixelRatio(window.devicePixelRatio); // Improve rendering quality
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 50; // Increased from 10 to 50
controls.maxPolarAngle = Math.PI / 2;

// Set up camera position
camera.position.z = 5;

// Create a group to hold all points
const pointsGroup = new THREE.Group();
scene.add(pointsGroup);

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light to create shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Predefined colors for mental health statuses
const statusColors = {
    "Normal": new THREE.Color(0x4CAF50),    // Soft Green
    "Depression": new THREE.Color(0x00BFFF), // Deep Sky Blue (changed from Indigo)
    "Suicidal": new THREE.Color(0xE91E63),   // Pink
    "Anxiety": new THREE.Color(0xFFC107),    // Amber
    "Bipolar": new THREE.Color(0x9C27B0)     // Purple
};

let points;
let activeStatuses = new Set();
let dataPoints = [];

// Point material settings
let pointSettings = {
    size: 0.1,
    opacity: 1.0,
    sizeAttenuation: true,
    glow: 0.3,
    hiddenOpacity: 0.05,
    densityFactor: 1.0 // New setting for density emphasis
};

// Function to get color for status
function getColorForStatus(status) {
    return statusColors[status] || new THREE.Color(0x808080);  // Default to gray if status is not found
}

// Function to update background color
function updateBackgroundColor() {
    renderer.setClearColor(0x000000, 1); // Set background color to black
}

// Function to update point material
function updatePointMaterial() {
    const vertexShader = `
        attribute vec3 color;
        attribute float density;
        varying vec3 vColor;
        uniform float pointSize;
        uniform float densityFactor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = pointSize * (300.0 / -mvPosition.z) * (1.0 + density * densityFactor);
        }
    `;

    const fragmentShader = `
        uniform float opacity;
        uniform float glow;
        uniform float hiddenOpacity;
        varying vec3 vColor;
        void main() {
            vec2 uv = gl_PointCoord.xy - 0.5;
            float r = length(uv);
            if (r > 0.5) discard;
            
            float intensity = smoothstep(0.5, 0.3, r);
            vec3 color = vColor * intensity;
            float alpha = opacity * intensity;
            
            // Add glow
            color += glow * vColor * (1.0 - r * 2.0);
            
            // Apply hidden opacity for very dark points
            if (vColor.r < 0.1 && vColor.g < 0.1 && vColor.b < 0.1) {
                alpha *= hiddenOpacity / 0.05; // Adjust based on the default hidden opacity
            }
            
            gl_FragColor = vec4(color, alpha);
        }
    `;

    const material = new ShaderMaterial({
        uniforms: {
            opacity: { value: pointSettings.opacity },
            glow: { value: pointSettings.glow },
            pointSize: { value: pointSettings.size },
            hiddenOpacity: { value: pointSettings.hiddenOpacity },
            densityFactor: { value: pointSettings.densityFactor }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    points.material = material;
    points.material.needsUpdate = true;
}

// Function to create control panel
function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'control-panel';

    const createSlider = (label, min, max, step, value, onChange) => {
        const container = document.createElement('div');

        const labelElement = document.createElement('label');
        labelElement.textContent = label;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;

        slider.addEventListener('input', onChange);

        container.appendChild(labelElement);
        container.appendChild(slider);
        return container;
    };

    panel.appendChild(createSlider('Point Size', 0.05, 0.5, 0.01, pointSettings.size, (e) => {
        pointSettings.size = parseFloat(e.target.value);
        updatePointMaterial();
    }));

    panel.appendChild(createSlider('Point Opacity', 0.1, 1, 0.1, pointSettings.opacity, (e) => {
        pointSettings.opacity = parseFloat(e.target.value);
        updatePointMaterial();
    }));

    panel.appendChild(createSlider('Point Glow', 0, 2, 0.1, pointSettings.glow, (e) => {
        pointSettings.glow = parseFloat(e.target.value);
        updatePointMaterial();
    }));

    panel.appendChild(createSlider('Hidden Point Opacity', 0, 0.5, 0.01, pointSettings.hiddenOpacity, (e) => {
        pointSettings.hiddenOpacity = parseFloat(e.target.value);
        updatePointsVisibility();
    }));

    panel.appendChild(createSlider('Density Emphasis', 0, 5, 0.1, pointSettings.densityFactor, (e) => {
        pointSettings.densityFactor = parseFloat(e.target.value);
        updatePointMaterial();
    }));

    const styleToggle = document.createElement('div');

    const styleLabel = document.createElement('label');
    styleLabel.textContent = 'Size Attenuation';

    const styleCheckbox = document.createElement('input');
    styleCheckbox.type = 'checkbox';
    styleCheckbox.checked = pointSettings.sizeAttenuation;
    styleCheckbox.addEventListener('change', (e) => {
        pointSettings.sizeAttenuation = e.target.checked;
        updatePointMaterial();
    });

    styleToggle.appendChild(styleLabel);
    styleToggle.appendChild(styleCheckbox);
    panel.appendChild(styleToggle);

    document.body.appendChild(panel);
}

// Function to load and process CSV data
async function loadData() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.textContent = 'Loading...';
    document.body.appendChild(loadingElement);

    const data = await csv("/data/reduced_mental_health_data_pacmap_3d.csv");
    
    // Get PaCMAP columns
    const pacmapColumns = Object.keys(data[0]).filter(key => key.startsWith("pacmap_"));
    
    // Create geometry and material for points
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const densities = [];
    
    // Process data and add points
    data.forEach(row => {
        const x = parseFloat(row[pacmapColumns[0]]);
        const y = parseFloat(row[pacmapColumns[1]]);
        const z = parseFloat(row[pacmapColumns[2]]);
        const density = parseFloat(row.density);
        
        positions.push(x, y, z);
        
        const status = row.status;
        dataPoints.push({ status: status, density: density });
        const color = getColorForStatus(status);
        colors.push(color.r, color.g, color.b);
        densities.push(density);
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('density', new THREE.Float32BufferAttribute(densities, 1));
    
    const material = new THREE.PointsMaterial({
        size: pointSettings.size,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: pointSettings.opacity,
        blending: THREE.AdditiveBlending
    });
    points = new THREE.Points(geometry, material);
    pointsGroup.add(points);

    document.body.removeChild(loadingElement);
    createLegend();
    createInfo();
    createControlPanel();
    updatePointMaterial(); // Apply initial material settings
    updateBackgroundColor(); // Set initial background color
}

// Function to create a clickable legend
function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'legend';

    Object.entries(statusColors).forEach(([status, color]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = `#${color.getHexString()}`;

        const textSpan = document.createElement('span');
        textSpan.className = 'status-text';
        textSpan.textContent = status;

        item.appendChild(colorBox);
        item.appendChild(textSpan);
        
        item.addEventListener('click', () => toggleStatus(status));
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        
        legend.appendChild(item);
    });

    document.body.appendChild(legend);
}

// Function to create info section
function createInfo() {
    const info = document.createElement('div');
    info.id = 'info';

    const title = document.createElement('h1');
    title.textContent = 'Mental Health Data Visualization';

    const description = document.createElement('p');
    description.textContent = 'Trying out some data viz in three.js';

    info.appendChild(title);
    info.appendChild(description);
    document.body.appendChild(info);
}

// Function to toggle status visibility
function toggleStatus(status) {
    if (activeStatuses.size === 0) {
        activeStatuses.add(status);
    } else if (activeStatuses.has(status)) {
        activeStatuses.delete(status);
    } else {
        activeStatuses.add(status);
    }
    
    updatePointsVisibility();
    updateLegendVisibility();
}

// Function to update legend item visibility
function updateLegendVisibility() {
    const legendItems = document.querySelectorAll('#legend .legend-item');
    legendItems.forEach(item => {
        const status = item.querySelector('.status-text').textContent;
        if (activeStatuses.size === 0 || activeStatuses.has(status)) {
            item.style.opacity = '1';
        } else {
            item.style.opacity = '0.3';
        }
    });
}

// Function to update points visibility based on active statuses
function updatePointsVisibility() {
    const colors = points.geometry.attributes.color;
    const densities = points.geometry.attributes.density;
    
    for (let i = 0; i < dataPoints.length; i++) {
        const status = dataPoints[i].status;
        const visible = activeStatuses.size === 0 || activeStatuses.has(status);
        
        if (visible) {
            const color = getColorForStatus(status);
            colors.setXYZ(i, color.r, color.g, color.b);
        } else {
            colors.setXYZ(i, pointSettings.hiddenOpacity, pointSettings.hiddenOpacity, pointSettings.hiddenOpacity);
        }
        
        densities.setX(i, dataPoints[i].density);
    }
    
    colors.needsUpdate = true;
    densities.needsUpdate = true;
    updatePointMaterial();
}

// Load data and set up the scene
loadData().then(() => {
    // Center the points group
    const box = new THREE.Box3().setFromObject(pointsGroup);
    const center = box.getCenter(new THREE.Vector3());
    pointsGroup.position.sub(center);
    
    // Adjust camera position based on bounding box
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(maxDim * 3, maxDim * 3, maxDim * 3); // Increased from 1.5 to 3
    camera.lookAt(scene.position);
    
    // Update controls
    controls.update();
    
    // Initial legend update
    updateLegendVisibility();
    
    // Initial point material update
    updatePointMaterial();
    
    // Initial points visibility update
    updatePointsVisibility();

    // Initial background color update
    updateBackgroundColor();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Add subtle movement to points
    const time = Date.now() * 0.001;
    pointsGroup.rotation.y = Math.sin(time * 0.1) * 0.1;
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
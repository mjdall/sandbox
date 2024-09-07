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
    hiddenOpacity: 0.05
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
        varying vec3 vColor;
        uniform float pointSize;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = pointSize * (300.0 / -mvPosition.z);
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
            hiddenOpacity: { value: pointSettings.hiddenOpacity }
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
    panel.style.position = 'absolute';
    panel.style.top = '300px'; // Adjust this value to position it below the legend
    panel.style.left = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.padding = '15px';
    panel.style.borderRadius = '10px';
    panel.style.color = 'white';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.1)';
    panel.style.width = '200px'; // Set a fixed width for the panel

    const createSlider = (label, min, max, step, value, onChange) => {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '5px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '100%';

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

    const styleToggle = document.createElement('div');
    styleToggle.style.marginBottom = '15px';

    const styleLabel = document.createElement('label');
    styleLabel.textContent = 'Size Attenuation';
    styleLabel.style.display = 'block';
    styleLabel.style.marginBottom = '5px';

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
    loadingElement.textContent = 'Loading...';
    loadingElement.style.position = 'absolute';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.color = 'white';
    loadingElement.style.fontSize = '24px';
    document.body.appendChild(loadingElement);

    const data = await csv("/data/reduced_mental_health_data_pacmap_3d.csv");
    
    // Get PaCMAP columns
    const pacmapColumns = Object.keys(data[0]).filter(key => key.startsWith("pacmap_"));
    
    // Create geometry and material for points
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Process data and add points
    data.forEach(row => {
        const x = parseFloat(row[pacmapColumns[0]]);
        const y = parseFloat(row[pacmapColumns[1]]);
        const z = parseFloat(row[pacmapColumns[2]]);
        
        positions.push(x, y, z);
        
        // Get color based on status
        const status = row.status;
        dataPoints.push({ status: status });
        const color = getColorForStatus(status);
        colors.push(color.r, color.g, color.b);
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
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
    legend.style.position = 'absolute';
    legend.style.top = '50px';
    legend.style.left = '10px';
    legend.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    legend.style.padding = '15px';
    legend.style.borderRadius = '10px';
    legend.style.color = 'white';
    legend.style.fontFamily = 'Arial, sans-serif';
    legend.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.1)';
    legend.style.width = '200px'; // Set a fixed width
    legend.style.maxHeight = '220px'; // Set a max height
    legend.style.overflowY = 'auto'; // Add scrollbar if content exceeds max height

    Object.entries(statusColors).forEach(([status, color]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.style.marginBottom = '5px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.transition = 'all 0.3s';
        item.style.padding = '5px';
        item.style.borderRadius = '5px';

        const colorBox = document.createElement('span');
        colorBox.className = 'color-box';
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.backgroundColor = `#${color.getHexString()}`;
        colorBox.style.marginRight = '5px';

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
    info.style.position = 'absolute';
    info.style.top = '20px';
    info.style.left = '50%';
    info.style.transform = 'translateX(-50%)';
    info.style.textAlign = 'center';
    info.style.color = 'white';
    info.style.fontFamily = 'Arial, sans-serif';
    info.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';

    const title = document.createElement('h1');
    title.textContent = 'Mental Health Data Visualization';
    title.style.margin = '0 0 10px 0';

    const description = document.createElement('p');
    description.textContent = 'Trying out some data viz in three.js';
    description.style.margin = '0';

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
    
    for (let i = 0; i < dataPoints.length; i++) {
        const status = dataPoints[i].status;
        const visible = activeStatuses.size === 0 || activeStatuses.has(status);
        
        if (visible) {
            const color = getColorForStatus(status);
            colors.setXYZ(i, color.r, color.g, color.b);
        } else {
            colors.setXYZ(i, pointSettings.hiddenOpacity, pointSettings.hiddenOpacity, pointSettings.hiddenOpacity);
        }
    }
    
    colors.needsUpdate = true;
    updatePointMaterial(); // Update the material to reflect color changes
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
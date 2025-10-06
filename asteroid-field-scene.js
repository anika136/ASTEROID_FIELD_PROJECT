// asteroid-field-scene.js
import * as THREE from 'three';


// ---------- Create Scene ----------
const scene = new THREE.Scene();

// ---------- Camera Setup ----------
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 10, 10);
camera.lookAt(new THREE.Vector3(0, 1.5, 0));

// ---------- Renderer Setup ----------
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ---------- Load Textures ----------
const textureLoader = new THREE.TextureLoader();
const spaceshipTexture1 = textureLoader.load('model/texture/random.jpg');
const spaceshipTexture2 = textureLoader.load('model/texture/spaceship-yellow.jpg');
const spaceshipTexture3 = textureLoader.load('model/texture/spaceship-blue2.jpg');
const spaceshipTexture4 = textureLoader.load('model/texture/random1.jpg');
const asteroidTexture = textureLoader.load('model/texture/spaceship-yellow.jpg');
const spaceTexture = textureLoader.load('texture/space-dust.jpg');

// ---------- Create Starfield (Background) ----------
const starGeometry = new THREE.SphereGeometry(500, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });
const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

// ---------- FIXED Custom Shaders for Asteroids ----------
const asteroidVertexShader = `
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float time;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        // FIXED: Much smaller displacement value
        pos += normal * sin(time * 2.0 + position.x * 5.0) * 0.005;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const asteroidFragmentShader = `
    uniform sampler2D asteroidMap;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
        vec3 textureColor = texture2D(asteroidMap, vUv).rgb;
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float NdotL = max(dot(vNormal, lightDir), 0.0);
        
        // FIXED: Better lighting for visibility
        vec3 ambient = textureColor * 0.4;
        vec3 diffuse = textureColor * NdotL * 0.8;
        
        gl_FragColor = vec4(ambient + diffuse, 1.0);
    }
`;

// ---------- Custom Vertex and Fragment Shaders for Spaceship ----------
const spaceshipVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const spaceshipFragmentShader = `
    uniform sampler2D spaceshipMap;
    uniform float metallic;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
        vec3 textureColor = texture2D(spaceshipMap, vUv).rgb;
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float NdotL = max(dot(vNormal, lightDir), 0.0);
        
        vec3 ambient = textureColor * 0.3;
        vec3 diffuse = textureColor * NdotL;
        
        
        gl_FragColor = vec4(ambient + diffuse, 1.0);
    }
`;

// ---------- Lighting Setup ----------
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x4488ff, 2, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// ---------- Spaceship Setup ----------
const spaceshipGroup = new THREE.Group();
const spaceshipTextures = [spaceshipTexture1, spaceshipTexture2, spaceshipTexture3,spaceshipTexture4];
let currentTextureIndex = 0;

const spaceshipMaterial = new THREE.ShaderMaterial({
    vertexShader: spaceshipVertexShader,
    fragmentShader: spaceshipFragmentShader,
    uniforms: {
        lightPosition: { value: directionalLight.position },
        lightColor: { value: directionalLight.color },
        spaceshipMap: { value: spaceshipTextures[currentTextureIndex] },
        metallic: { value: 0.8 }
    }
});

// Build spaceship with Three.js geometries
const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 5, 8);
const spaceshipBody = new THREE.Mesh(bodyGeometry, spaceshipMaterial);
spaceshipBody.rotation.z = Math.PI / 2;
spaceshipGroup.add(spaceshipBody);

// Wings
const wingGeometry = new THREE.BoxGeometry(2, 0.2, 1);
const leftWing = new THREE.Mesh(wingGeometry, spaceshipMaterial);
leftWing.position.set(0, 0.8, 0);
const rightWing = new THREE.Mesh(wingGeometry, spaceshipMaterial);
rightWing.position.set(0, -0.8, 0);
spaceshipGroup.add(leftWing, rightWing);

// Engine
const engineGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 6);
const engineMesh = new THREE.Mesh(engineGeometry, spaceshipMaterial);
engineMesh.position.x = -1.8;
engineMesh.rotation.z = Math.PI / 2;
spaceshipGroup.add(engineMesh);

scene.add(spaceshipGroup);

// ---------- Asteroid Setup ----------
const asteroids = [];
const asteroidCount = 70;

for (let i = 0; i < asteroidCount; i++) {
    const size = Math.random() * 1.5 + 0.8;
    const asteroidGeometry = new THREE.DodecahedronGeometry(size, 1);

    // FIXED: Less irregular deformation
    const vertices = asteroidGeometry.attributes.position.array;
    for (let j = 0; j < vertices.length; j += 3) {
        vertices[j] += (Math.random() - 0.5) * size * 0.1;     // Reduced from 0.4 to 0.1
        vertices[j + 1] += (Math.random() - 0.5) * size * 0.001;
        vertices[j + 2] += (Math.random() - 0.5) * size * 0.001;
    }
    asteroidGeometry.attributes.position.needsUpdate = true;
    asteroidGeometry.computeVertexNormals();

    const asteroidMaterial = new THREE.ShaderMaterial({
        vertexShader: asteroidVertexShader,
        fragmentShader: asteroidFragmentShader,
        uniforms: {
            lightPosition: { value: directionalLight.position },
            lightColor: { value: directionalLight.color },
            asteroidMap: { value: asteroidTexture },
            time: { value: 0 }
        }
    });

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    // Random positioning
    const angle = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = Math.random() * 60 + 25;
    
    asteroid.position.x = radius * Math.sin(phi) * Math.cos(angle);
    asteroid.position.y = radius * Math.sin(phi) * Math.sin(angle);
    asteroid.position.z = radius * Math.cos(phi);

    asteroid.rotation.x = Math.random() * Math.PI;
    asteroid.rotation.y = Math.random() * Math.PI;
    asteroid.rotation.z = Math.random() * Math.PI;

    // Animation data
    asteroid.userData = {
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.03,
            y: (Math.random() - 0.5) * 0.03,
            z: (Math.random() - 0.5) * 0.03
        },
        moveSpeed: {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05,
            z: (Math.random() - 0.5) * 0.05
        }
    };

    asteroids.push(asteroid);
    scene.add(asteroid);
}

// ---------- Input Handling ----------
const keys = {};
const mouse = { x: 0, y: 0 };

document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// ---------- Mouse Interaction: Change Spaceship Texture ----------
document.addEventListener('click', () => {
    currentTextureIndex = (currentTextureIndex + 1) % spaceshipTextures.length;
    spaceshipMaterial.uniforms.spaceshipMap.value = spaceshipTextures[currentTextureIndex];
});

// ---------- Movement ----------
const spaceshipSpeed = 0.3;
const spaceshipVelocity = new THREE.Vector3();

function updateSpaceship() {
    spaceshipVelocity.set(0, 0, 0);

    if (keys['KeyW'] || keys['ArrowUp']) spaceshipVelocity.z -= spaceshipSpeed;
    if (keys['KeyS'] || keys['ArrowDown']) spaceshipVelocity.z += spaceshipSpeed;
    if (keys['KeyA'] || keys['ArrowLeft']) spaceshipVelocity.x -= spaceshipSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) spaceshipVelocity.x += spaceshipSpeed;
    if (keys['KeyQ']) spaceshipVelocity.y += spaceshipSpeed;
    if (keys['KeyE']) spaceshipVelocity.y -= spaceshipSpeed;

    spaceshipGroup.position.add(spaceshipVelocity);

    if (spaceshipVelocity.length() > 0) {
        spaceshipGroup.lookAt(
            spaceshipGroup.position.x + spaceshipVelocity.x,
            spaceshipGroup.position.y + spaceshipVelocity.y,
            spaceshipGroup.position.z + spaceshipVelocity.z
        );
    }
}

// ---------- Camera Follow the Spaceship ----------
function updateCamera() {
    const offset = new THREE.Vector3(
        12 * Math.sin(mouse.x * Math.PI),
        8 + mouse.y * 6,
        12 * Math.cos(mouse.x * Math.PI)
    );
    
    camera.position.copy(spaceshipGroup.position).add(offset);
    camera.lookAt(spaceshipGroup.position);
    
    pointLight.position.copy(spaceshipGroup.position);
}

// ---------- Animation Loop ----------
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    updateSpaceship();
    updateCamera();

    // Animate asteroids
    asteroids.forEach(asteroid => {
        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
        
        asteroid.position.x += asteroid.userData.moveSpeed.x;
        asteroid.position.y += asteroid.userData.moveSpeed.y;
        asteroid.position.z += asteroid.userData.moveSpeed.z;

        // Keep within bounds
        if (Math.abs(asteroid.position.x - spaceshipGroup.position.x) > 80) {
            asteroid.userData.moveSpeed.x *= -1;
        }
        if (Math.abs(asteroid.position.y - spaceshipGroup.position.y) > 80) {
            asteroid.userData.moveSpeed.y *= -1;
        }
        if (Math.abs(asteroid.position.z - spaceshipGroup.position.z) > 80) {
            asteroid.userData.moveSpeed.z *= -1;
        }

        asteroid.material.uniforms.time.value = elapsedTime;
    });

    starField.rotation.y += 0.0005;
    
    renderer.render(scene, camera);
}

// ---------- Handle Window Resize ----------
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
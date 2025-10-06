// Import necessary Three.js modules
import * as THREE from 'three';


// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;
camera.position.y = 2;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load textures
const textureLoader = new THREE.TextureLoader();

const spaceshipTexture1 = textureLoader.load('model/texture/random.jpg');
const spaceshipTexture2 = textureLoader.load('model/texture/spaceship-yellow.jpg');
const spaceshipTexture3 = textureLoader.load('model/texture/spaceship-blue2.jpg');
const spaceshipTexture4 = textureLoader.load('model/texture/random1.jpg');

// Custom shaders for spaceship
const spaceshipVertexShader = `
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const spaceshipFragmentShader = `
    uniform sampler2D spaceshipMap;
    uniform float metallic;
    
    varying vec3 vNormal;
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

// Create lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Spaceship setup
const spaceshipTextures = [spaceshipTexture1, spaceshipTexture2, spaceshipTexture3];
let currentTextureIndex = 0;

const spaceshipMaterial = new THREE.ShaderMaterial({
    vertexShader: spaceshipVertexShader,
    fragmentShader: spaceshipFragmentShader,
    uniforms: {
        spaceshipMap: { value: spaceshipTextures[currentTextureIndex] },
        metallic: { value: 0.8 }
    }
});

// Build spaceship
const spaceshipGroup = new THREE.Group();

const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
const spaceshipBody = new THREE.Mesh(bodyGeometry, spaceshipMaterial);
spaceshipBody.rotation.z = Math.PI / 2;
spaceshipGroup.add(spaceshipBody);

const wingGeometry = new THREE.BoxGeometry(2, 0.2, 0.8);
const leftWing = new THREE.Mesh(wingGeometry, spaceshipMaterial);
leftWing.position.set(0, 0.8, 0);
const rightWing = new THREE.Mesh(wingGeometry, spaceshipMaterial);
rightWing.position.set(0, -0.8, 0);
spaceshipGroup.add(leftWing, rightWing);

scene.add(spaceshipGroup);

// Mouse interaction
document.addEventListener('click', () => {
    currentTextureIndex = (currentTextureIndex + 1) % spaceshipTextures.length;
    spaceshipMaterial.uniforms.spaceshipMap.value = spaceshipTextures[currentTextureIndex];
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    spaceshipGroup.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();
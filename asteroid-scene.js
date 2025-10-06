// Import necessary Three.js modules
import * as THREE from 'three';

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
camera.position.y = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load texture
const textureLoader = new THREE.TextureLoader();
const asteroidTexture = textureLoader.load('model/texture/spaceship-yellow.jpg');

// Custom shaders for asteroids
const asteroidVertexShader = `
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float time;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        pos += normal * sin(time * 2.0 + position.x * 5.0) * 0.05;
        
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
        
        vec3 ambient = textureColor * 0.2;
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

// Create asteroids
const asteroids = [];
const asteroidCount = 30;

for (let i = 0; i < asteroidCount; i++) {
    const size = Math.random() * 1.5 + 0.8;
    const asteroidGeometry = new THREE.DodecahedronGeometry(size, 1);
    
    const asteroidMaterial = new THREE.ShaderMaterial({
        vertexShader: asteroidVertexShader,
        fragmentShader: asteroidFragmentShader,
        uniforms: {
            asteroidMap: { value: asteroidTexture },
            time: { value: 0 }
        }
    });

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    asteroid.position.x = (Math.random() - 0.5) * 50;
    asteroid.position.y = (Math.random() - 0.5) * 50;
    asteroid.position.z = (Math.random() - 0.5) * 50;

    asteroid.userData = {
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.03,
            y: (Math.random() - 0.5) * 0.03,
            z: (Math.random() - 0.5) * 0.03
        }
    };

    asteroids.push(asteroid);
    scene.add(asteroid);
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    asteroids.forEach(asteroid => {
        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
        
        asteroid.material.uniforms.time.value = elapsedTime;
    });

    renderer.render(scene, camera);
}

animate();
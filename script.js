let scene, camera, renderer, composer;
let nexoraCore, neuralNetwork, roboticArm, spatialCity;
let particles = [];
let mouse = { x: 0, y: 0 };
let targetMouse = { x: 0, y: 0 };
let scrollProgress = 0;
let currentSection = 0;

const isMobile = window.innerWidth < 768;

class NexoraCore {
    constructor() {
        this.group = new THREE.Group();
        this.rings = [];
        this.particles = [];
        this.innerCore = null;
        
        this.createCore();
    }

    createCore() {
        const coreGeo = new THREE.IcosahedronGeometry(1, 1);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });
        this.innerCore = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.innerCore);

        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(2 + i * 0.8, 0.05, 16, 100);
            const ringMat = new THREE.MeshPhysicalMaterial({
                color: 0xaaaaaa,
                metalness: 1,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.rings.push(ring);
            this.group.add(ring);
        }

        const particleCount = isMobile ? 50 : 100;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            const radius = 4 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particleGeo, particleMat);
        this.group.add(particleSystem);
        this.particles.push(particleSystem);
    }

    update(time) {
        this.innerCore.rotation.y += 0.005;
        this.innerCore.rotation.x += 0.002;
        
        this.rings.forEach((ring, i) => {
            ring.rotation.z += 0.001 * (i + 1);
            ring.rotation.y += 0.002 * (i + 1);
        });

        this.particles.forEach(p => {
            p.rotation.y += 0.0005;
        });
    }
}

class NeuralNetwork {
    constructor() {
        this.group = new THREE.Group();
        this.nodes = [];
        this.connections = [];
        this.signals = [];
        
        this.createNetwork();
    }

    createNetwork() {
        const nodeCount = isMobile ? 15 : 30;
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        for (let i = 0; i < nodeCount; i++) {
            const nodeGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            
            node.position.x = (Math.random() - 0.5) * 10;
            node.position.y = (Math.random() - 0.5) * 10;
            node.position.z = (Math.random() - 0.5) * 5;
            
            this.nodes.push(node);
            this.group.add(node);
        }

        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0x666666, 
            transparent: true, 
            opacity: 0.3 
        });

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (Math.random() > 0.7) {
                    const points = [
                        this.nodes[i].position,
                        this.nodes[j].position
                    ];
                    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(lineGeo, lineMat);
                    this.connections.push(line);
                    this.group.add(line);
                }
            }
        }

        for (let i = 0; i < 5; i++) {
            const signalGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const signalMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const signal = new THREE.Mesh(signalGeo, signalMat);
            signal.userData = { 
                start: Math.floor(Math.random() * this.nodes.length),
                end: Math.floor(Math.random() * this.nodes.length),
                progress: Math.random()
            };
            this.signals.push(signal);
            this.group.add(signal);
        }
    }

    update(time) {
        this.nodes.forEach(node => {
            node.position.y += Math.sin(time * 0.001 + node.position.x) * 0.001;
        });

        this.signals.forEach(signal => {
            const data = signal.userData;
            data.progress += 0.01;
            
            if (data.progress >= 1) {
                data.progress = 0;
                data.start = data.end;
                data.end = Math.floor(Math.random() * this.nodes.length);
            }
            
            const startPos = this.nodes[data.start].position;
            const endPos = this.nodes[data.end].position;
            
            signal.position.lerpVectors(startPos, endPos, data.progress);
        });
    }
}

class RoboticArm {
    constructor() {
        this.group = new THREE.Group();
        this.segments = [];
        
        this.createArm();
    }

    createArm() {
        const metalMat = new THREE.MeshPhysicalMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });

        const baseGeo = new THREE.CylinderGeometry(0.8, 1, 0.5, 32);
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.position.y = -2;
        this.group.add(base);

        const segment1Geo = new THREE.CylinderGeometry(0.3, 0.4, 2, 16);
        const segment1 = new THREE.Mesh(segment1Geo, metalMat);
        segment1.position.y = -0.5;
        this.segments.push(segment1);
        this.group.add(segment1);

        const jointGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const joint = new THREE.Mesh(jointGeo, metalMat);
        joint.position.y = 0.5;
        this.group.add(joint);

        const segment2Geo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 16);
        const segment2 = new THREE.Mesh(segment2Geo, metalMat);
        segment2.position.y = 1.5;
        this.segments.push(segment2);
        this.group.add(segment2);

        const handGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5);
        const hand = new THREE.Mesh(handGeo, metalMat);
        hand.position.y = 2.5;
        this.segments.push(hand);
        this.group.add(hand);

        const fingerGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        for (let i = 0; i < 3; i++) {
            const finger = new THREE.Mesh(fingerGeo, metalMat);
            finger.position.set((i - 1) * 0.25, 2.7, 0.2);
            this.group.add(finger);
        }
    }

    update(time) {
        this.segments[0].rotation.z = Math.sin(time * 0.0005) * 0.2;
        this.segments[1].rotation.x = Math.sin(time * 0.0003) * 0.3;
        this.segments[2].rotation.y = Math.sin(time * 0.0007) * 0.5;
    }
}

class SpatialCity {
    constructor() {
        this.group = new THREE.Group();
        this.buildings = [];
        
        this.createCity();
    }

    createCity() {
        const buildingCount = isMobile ? 10 : 20;
        const buildingMat = new THREE.MeshPhysicalMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.7
        });

        for (let i = 0; i < buildingCount; i++) {
            const width = 0.5 + Math.random() * 0.5;
            const height = 1 + Math.random() * 3;
            const depth = 0.5 + Math.random() * 0.5;
            
            const buildingGeo = new THREE.BoxGeometry(width, height, depth);
            const building = new THREE.Mesh(buildingGeo, buildingMat);
            
            const angle = (i / buildingCount) * Math.PI * 2;
            const radius = 5 + Math.random() * 3;
            
            building.position.x = Math.cos(angle) * radius;
            building.position.z = Math.sin(angle) * radius;
            building.position.y = height / 2 - 2;
            
            this.buildings.push(building);
            this.group.add(building);

            const lightGeo = new THREE.BoxGeometry(width * 0.9, 0.05, depth * 0.9);
            const lightMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.copy(building.position);
            light.position.y = building.position.y + height / 2 + 0.1;
            this.group.add(light);
        }

        const pathCount = 10;
        const pathMat = new THREE.LineBasicMaterial({ 
            color: 0x666666, 
            transparent: true, 
            opacity: 0.3 
        });

        for (let i = 0; i < pathCount; i++) {
            const points = [];
            const segmentCount = 20;
            const angle = (i / pathCount) * Math.PI * 2;
            
            for (let j = 0; j < segmentCount; j++) {
                const t = j / segmentCount;
                const radius = 3 + t * 5;
                points.push(new THREE.Vector3(
                    Math.cos(angle + t * 0.5) * radius,
                    Math.sin(t * Math.PI * 2) * 0.5 - 1,
                    Math.sin(angle + t * 0.5) * radius
                ));
            }
            
            const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
            const path = new THREE.Line(pathGeo, pathMat);
            this.group.add(path);
        }
    }

    update(time) {
        this.group.rotation.y += 0.0003;
        
        this.buildings.forEach((building, i) => {
            building.position.y += Math.sin(time * 0.0005 + i) * 0.002;
        });
    }
}

function createBackgroundParticles() {
    const particleCount = isMobile ? 100 : 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 50;
        positions[i + 1] = (Math.random() - 0.5) * 50;
        positions[i + 2] = (Math.random() - 0.5) * 50;
        sizes[i / 3] = Math.random() * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particles.push(particleSystem);
}

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 8;
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('scene'),
        antialias: !isMobile,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6666ff, 0.3);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 20);
    pointLight1.position.set(0, 5, 0);
    scene.add(pointLight1);

    nexoraCore = new NexoraCore();
    scene.add(nexoraCore.group);

    neuralNetwork = new NeuralNetwork();
    neuralNetwork.group.position.set(0, 0, -20);
    neuralNetwork.group.visible = false;
    scene.add(neuralNetwork.group);

    roboticArm = new RoboticArm();
    roboticArm.group.position.set(0, 0, -40);
    roboticArm.group.visible = false;
    scene.add(roboticArm.group);

    spatialCity = new SpatialCity();
    spatialCity.group.position.set(0, 0, -60);
    spatialCity.group.visible = false;
    scene.add(spatialCity.group);

    createBackgroundParticles();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('scroll', onScroll);

    setupScrollAnimations();
    setupInteractions();
    setupLoader();
}

function setupLoader() {
    const loader = document.getElementById('loader');
    const counter = document.getElementById('loader-count');
    let count = 0;
    
    const interval = setInterval(() => {
        count += Math.floor(Math.random() * 5) + 1;
        if (count >= 100) {
            count = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 500);
        }
        counter.textContent = count.toString().padStart(2, '0');
    }, 50);
}

function setupScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    const sections = document.querySelectorAll('.section');
    
    sections.forEach((section, index) => {
        gsap.to(section.querySelector('.section-content'), {
            scrollTrigger: {
                trigger: section,
                start: 'top center',
                end: 'center center',
                scrub: 1,
                onEnter: () => updateSection(index),
            },
            opacity: 1,
            y: 0,
            duration: 1
        });
    });
}

function updateSection(index) {
    currentSection = index;
    
    nexoraCore.group.visible = index === 0 || index === 4;
    neuralNetwork.group.visible = index === 1;
    roboticArm.group.visible = index === 2;
    spatialCity.group.visible = index === 3;

    switch(index) {
        case 0:
            gsap.to(camera.position, { x: 0, y: 0, z: 8, duration: 2, ease: 'power2.inOut' });
            gsap.to(nexoraCore.group.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.inOut' });
            break;
        case 1:
            gsap.to(camera.position, { x: 0, y: 0, z: 5, duration: 2, ease: 'power2.inOut' });
            gsap.to(neuralNetwork.group.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.inOut' });
            break;
        case 2:
            gsap.to(camera.position, { x: 3, y: 1, z: 6, duration: 2, ease: 'power2.inOut' });
            gsap.to(roboticArm.group.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.inOut' });
            break;
        case 3:
            gsap.to(camera.position, { x: 0, y: 5, z: 10, duration: 2, ease: 'power2.inOut' });
            gsap.to(spatialCity.group.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.inOut' });
            break;
        case 4:
            gsap.to(camera.position, { x: 0, y: 0, z: 3, duration: 2, ease: 'power2.inOut' });
            gsap.to(nexoraCore.group.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power2.inOut' });
            gsap.to(nexoraCore.group.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 2, ease: 'power2.inOut' });
            break;
        case 5:
            gsap.to(camera.position, { x: 0, y: 0, z: 15, duration: 2, ease: 'power2.inOut' });
            break;
    }
}

function setupInteractions() {
    const cursor = document.getElementById('custom-cursor');
    const interactiveElements = document.querySelectorAll('.cta-button, .nav-link');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = parseInt(link.dataset.section);
            const target = document.querySelectorAll('.section')[section];
            target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('click', () => {
            if (currentSection < 5) {
                const nextSection = document.querySelectorAll('.section')[currentSection + 1];
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function onMouseMove(event) {
    targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const cursor = document.getElementById('custom-cursor');
    cursor.style.left = event.clientX + 'px';
    cursor.style.top = event.clientY + 'px';
}

function onScroll() {
    scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now();

    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    if (!isMobile) {
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05;
    }
    camera.lookAt(scene.position);

    nexoraCore.update(time);
    neuralNetwork.update(time);
    roboticArm.update(time);
    spatialCity.update(time);

    particles.forEach(p => {
        p.rotation.y += 0.0001;
    });

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});
'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import styles from '../styles/Game1.module.css';
import { useGameStore, GameState } from '../store/gameStore2';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

interface ThreeSceneProps {
  width: number;
}

const BlenderFPS = 24; // Set this to the desired frames per second

export default function ThreeScene({ width }: ThreeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const aspectRatio = 4000 / 1995;
  const fontRef = useRef<Font | null>(null);
  const gameState = useGameStore((state: GameState) => state);
  const textMeshRef = useRef<THREE.Mesh | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null); // Store animation mixer reference
  const fishRef = useRef<THREE.Object3D | null>(null); // Store fish reference



  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Three.js Scene
    const scene = new THREE.Scene();
    const light = new THREE.PointLight(0xffffff, 50);
    light.position.set(0.8, 1.4, 1.0);
    scene.add(light, new THREE.AmbientLight());

    // Create Camera
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);

    // WebGL Renderer (Attach to Canvas)
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });

    function limitSkinWeights(geometry: THREE.BufferGeometry) {
      const skinWeight = geometry.attributes.skinWeight;
      const skinIndex = geometry.attributes.skinIndex;
  
      for (let i = 0; i < skinWeight.count; i++) {
          let weights = [
              skinWeight.getX(i),
              skinWeight.getY(i),
              skinWeight.getZ(i),
              skinWeight.getW(i)
          ];
          let indices = [
              skinIndex.getX(i),
              skinIndex.getY(i),
              skinIndex.getZ(i),
              skinIndex.getW(i)
          ];
  
          // Create an array of weight-index pairs
          let weightIndexPairs = weights.map((weight, index) => ({ weight, index }));
  
          // Sort by weight descending
          weightIndexPairs.sort((a, b) => b.weight - a.weight);
  
          // Reset weights and indices
          for (let j = 0; j < 4; j++) {
              if (j < weightIndexPairs.length) {
                  skinWeight.setComponent(i, j, weightIndexPairs[j].weight);
                  skinIndex.setComponent(i, j, indices[weightIndexPairs[j].index]);
              } else {
                  // Set remaining weights and indices to 0
                  skinWeight.setComponent(i, j, 0);
                  skinIndex.setComponent(i, j, 0);
              }
          }
      }
  
      geometry.attributes.skinWeight.needsUpdate = true;
      geometry.attributes.skinIndex.needsUpdate = true;
  }

    // Resize Handler
    function resizeCanvas() {
      const canvasHeight = width / aspectRatio;
      camera.aspect = aspectRatio;
      camera.updateProjectionMatrix();
      renderer.setSize(width, canvasHeight);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Orbit Controls
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.target.set(0, 1, 0);

    //controls.enabled = false; // This will prevent any camera movement

    // Load Fish Model
    const fbxLoader = new FBXLoader();
    fbxLoader.load('/fish1.fbx', (object) => {
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
            limitSkinWeights((child as THREE.Mesh).geometry);
        }
    });
      object.rotation.set(0, 0, 0);
      object.scale.set(0.05, 0.05, 0.05);
      object.position.set(0, 0, 0);
      fishRef.current = object;
      scene.add(object);
      console.log('Object Position:', fishRef.current.position);
      
      const mixer = new THREE.AnimationMixer(object);
      mixerRef.current = mixer;

      if (object.animations.length > 0) {
        const action = mixer.clipAction(object.animations[0]); // Play the first animation
        action.setEffectiveTimeScale(BlenderFPS / 60); // Adjust speed
        action.play();
      }

    });

    // Load Background Texture
    const textureLoader = new THREE.TextureLoader();
    scene.background = textureLoader.load('/under3.png');

    // Load Font
    const fontLoader = new FontLoader();
    fontLoader.load('/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      fontRef.current = font;
      updateText(gameState.status, 
                 Number(gameState.timeRemaining), // Convert to number
                 Number(gameState.multiplier)); // Convert to number
    });

    function updateText(status: string, timeRemaining: number, multiplier: number) {
      if (!fontRef.current) return;

      // Remove existing text
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
      }

      // Determine text content
      let text = status;
      if (status === 'Waiting') {
        if (typeof timeRemaining === 'number' && !isNaN(timeRemaining)) {
          text = `Time: ${timeRemaining}`;
        }else{
          text = `Time: `;
        }
      } else if (status === 'Running') {
        text = `Multiplier: ${multiplier}`;
      }
      // Create new text mesh
      const textGeometry = new TextGeometry(text, {
        font: fontRef.current,
        size: 10,
        depth: 2,
        curveSegments: 12,
        bevelEnabled: false,
      });

      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      textMeshRef.current = new THREE.Mesh(textGeometry, textMaterial);
      textMeshRef.current.position.set(0, 1, -5);
      textMeshRef.current.rotation.set(0, 0, 0);
      textMeshRef.current.scale.set(0.05, 0.05, 0.05);
      scene.add(textMeshRef.current);
    }

    // Subscribe to game state updates
   /* const unsubscribe = useGameStore.subscribe((state) => {
      updateText(state.status, 
                Number(state.timeRemaining),
                Number(state.multiplier));
              });
*/

 // Subscribe to game state updates (Move Fish During Countdown)
 const unsubscribe = useGameStore.subscribe((state) => {
  updateText(state.status, Number(state.timeRemaining), Number(state.multiplier));

  // Move fish closer to the camera during countdown
  if (fishRef.current && state.status === 'Waiting') {

    const initialPosition = -10; // Start far away
    const finalPosition = -2; // Closer to camera
    const duration = 8; // Duration in seconds
    const startTime = performance.now(); // Get the current time
    const duration2 = 2;

    function translateFish() {
      if(state.timeRemaining == 9){
      
      const elapsedTime = (performance.now() - startTime) / 1000; // Convert to seconds
      const progress = Math.min(elapsedTime / duration, 1); // Normalize to range 0 - 1
      if (fishRef.current) {
        fishRef.current.position.set(0, 0, 0);
        fishRef.current.rotation.y = THREE.MathUtils.degToRad(0); // Convert degrees to radians
        fishRef.current.position.z = THREE.MathUtils.lerp(initialPosition, finalPosition, progress); // Move fish smoothly closer to the camera
      }

      if (progress < 1) {
          requestAnimationFrame(translateFish); // Continue translating until the duration is reached
      }
    }
    if (state.timeRemaining == 1) {
     
      const elapsedTime = (performance.now() - startTime) / 1000; // Convert to seconds
      const progress = Math.min(elapsedTime / duration, 1); // Normalize to range 0 - 1
    
      if (fishRef.current) {
      
          const bottomLeftPosition = new THREE.Vector3(-5, -2, -5); // Adjust these values as needed
          fishRef.current.position.copy(bottomLeftPosition);
          fishRef.current.rotation.y = THREE.MathUtils.degToRad(90); // Convert degrees to radians
  
      }
      if (progress < 1) {
        requestAnimationFrame(translateFish); // Continue translating until the duration is reached
    }
  }
  
  }

  translateFish(); // Start the translation

    if(state.timeRemaining == 9){
    //  fishRef.current.translateZ(THREE.MathUtils.lerp(-10, 10, 8)); 
    }
    if (!isNaN(state.timeRemaining)) {
   // const progress = (10 - state.timeRemaining) / 10; // Normalize to range 0 - 1
   // fishRef.current.position.z = THREE.MathUtils.lerp(initialPosition, finalPosition, progress);
    //fishRef.current.translateZ(THREE.MathUtils.lerp(initialPosition, finalPosition, progress)); // Move fish closer to the camera 
    //const distance = THREE.MathUtils.lerp(initialPosition, finalPosition, progress); // Calculate the distance
    //fishRef.current.translateZ(distance); // Move fish smoothly closer to the camera
  }
  }
  if (fishRef.current && state.status === 'Running'){

  }
  if (fishRef.current && state.status === 'Crashed') {
    
  }
});


    // Animation Loop
    let clock = new THREE.Clock();
    const targetFPS = 24; // Set this to match Blender's FPS
    const frameDuration = 1 / targetFPS; // Time per frame

    function animate() {
      requestAnimationFrame(animate);
    
      const deltaTime = clock.getDelta(); // Time since last frame
      const timeElapsed = clock.elapsedTime;
    
      if (mixerRef.current) {
        mixerRef.current.update(frameDuration); // Update at fixed FPS
      }
    
      // controls.update();
      renderer.render(scene, camera);
    }
    animate();

/*
    function animate(deltaTime: number) {
      requestAnimationFrame(animate);
      controls.update();
      
      if (mixerRef.current) {
        mixerRef.current.update(deltaTime); 
    
      }

      renderer.render(scene, camera);
    }
    animate(0);
*/

    // Function to log camera position and rotation
    const logCameraTransform = () => {
        console.log('Camera Position:', camera.position);
        console.log('Camera Rotation:', camera.rotation);
    };

    const logObjectTransform = () => {
      console.log('Object Rotation:', camera.rotation);
  };

    // Initial log
    logCameraTransform();

    // Update log on camera change
    const updateCamera = () => {
        logCameraTransform();
        // You can also add any additional logic for camera updates here
    };

    // Call updateCamera whenever the camera is manipulated
    // controls.addEventListener('change', updateCamera);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      // controls.dispose();
      unsubscribe();
      // controls.removeEventListener('change', updateCamera);
    };
  }, [width]);

  return <canvas className={styles.Game} ref={canvasRef} />;
}
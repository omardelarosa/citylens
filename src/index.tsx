import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { CustomWindow } from '../typings/window';
import * as serviceWorker from './serviceWorker';
const queryString = require('query-string');

type Vector3 = [number, number, number]; // x, y, z

interface IModelConfig {
    path: string; // File Path
    barcodeId: number; // Barcode ID
    position: Vector3; // Relative space offset Vector3
    scale: Vector3; // x, y, z scale
    rotation: Vector3; // x, y, z
    animationNames?: string[];
}

interface IMesh {
    scene?: {
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        scale: { x: number; y: number; z: number };
    };
    animations?: any[];
}

interface IClip {
    name: string;
}

interface IAnimation {
    play: () => void;
    setLoop: (n: number, t?: number) => void;
    isRunning: () => boolean;
}

interface IAnimationMixer {
    clipAction: (a: IClip) => IAnimation;
    update: (d: number) => void;
    time: number;
    addEventListener: (s: string, cb: (e: IAnimation) => void) => void;
}

declare let window: CustomWindow;

const AFRAME = window.AFRAME;
const THREE = window.THREE;
const AF = AFRAME;
const T = THREE;
const THREEx = window.THREEx;
const Tx = THREEx;
const Stats = window.Stats;

let loader;

// const MODEL_PATH_GREEN = 'LowPolyChar.glb';
// const MODEL_PATH_RED = 'LowPolyCharRed.glb';
const MODEL_OFFSET: Vector3 = [0, 2, 4];
const MODEL_SCALE: Vector3 = [0.2, 0.2, 0.2];
const MODEL_ROTATION: Vector3 = [0, 0, 0];
const MODEL_ROTATION_SIDE_WAYS: Vector3 = [4.5, 0, 0];
const AR_CONTAINER_SELECTOR = '.ar-container';

// Define all models and their respective barcodes here
const MODEL_MAPPINGS: IModelConfig[] = [
    {
        path: 'models/MTA_Platform_Stand.glb',
        barcodeId: 0,
        position: [0, 1, 4.5],
        scale: MODEL_SCALE,
        rotation: [4.5, -2.5, 0],
        // rotation: MODEL_ROTATION_SIDE_WAYS,
    },
    {
        path: 'models/MTA_Platform_Spread.glb',
        barcodeId: 1,
        position: [0, 1, 4.5],
        scale: MODEL_SCALE,
        rotation: [4.5, 0, 0],
    },
];

const queryParams = queryString.parse(window.location.search);

async function loadAssets(pathToAsset: string) {
    return new Promise<{ scene?: any }>(function(resolve, reject) {
        loader = new THREE.GLTFLoader();
        loader.load(
            pathToAsset,
            (mesh: { scene: any }) => {
                resolve(mesh);
                // Usage:
                // scene.add(mesh.scene);
            },
            undefined,
            (error: Error) => {
                console.error(error);
                reject(error);
            },
        );
    });
}

async function init(WIDTH: number, HEIGHT: number) {
    const DISPLAY_HEIGHT = HEIGHT;
    const DISPLAY_WIDTH = WIDTH;

    const SOURCE_HEIGHT = HEIGHT;
    const SOURCE_WIDTH = WIDTH;

    const CANVAS_HEIGHT = HEIGHT;
    const CANVAS_WIDTH = WIDTH;

    const $el: HTMLDivElement | null = document.querySelector(
        AR_CONTAINER_SELECTOR,
    );

    // const $el = document.body;
    if (!$el) {
        console.warn('No AR Container found!');
        return;
    }

    Tx.ArToolkitContext.baseURL = '';
    const renderer = new T.WebGLRenderer({
        alpha: true,
    });

    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';

    function updateRendererSize() {
        if (!$el) {
            return;
        }

        renderer.setSize(WIDTH, HEIGHT);
    }

    window.addEventListener('resize', updateRendererSize);
    window.addEventListener('load', updateRendererSize);

    $el.appendChild(renderer.domElement);

    // array of functions for the rendering loop
    const onRenderFcts: any[] = [];

    // init scene and camera
    const scene = new THREE.Scene();

    // Create a camera
    const camera = new T.Camera();
    scene.add(camera);

    /*
     * AR Toolkit
     *
     * This is an interface for the arToolkit itself.
     *
     * JS Docs: https://github.com/artoolkit/jsartoolkit5
     *
     * non-JS API Docs: https://github.com/artoolkit/artoolkit-docs
     */

    const arToolkitSource = new Tx.ArToolkitSource({
        sourceType: 'webcam',
        sourceWidth: SOURCE_WIDTH,
        sourceHeight: SOURCE_HEIGHT,

        displayWidth: DISPLAY_WIDTH,
        displayHeight: DISPLAY_HEIGHT,
        // to read from an image
        // sourceType : 'image',
        // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

        // to read from a video
        // sourceType : 'video',
        // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
    });

    arToolkitSource.init(function onReady() {
        onResize();
    });

    // handle resize
    window.addEventListener('resize', function() {
        // onInit();
        onResize();
    });

    function onResize() {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(
                arToolkitContext.arController.canvas,
            );
        }
    }

    function onInit() {
        // arToolkitSource.setProjectionNearPlane(1);
        // arToolkitSource.setProjectionFarPlane(1000);
        arToolkitSource.setPatternDetectionMode(
            arToolkitSource.CONSTANTS.AR_MATRIX_CODE_DETECTION,
        );
        arToolkitSource.setMatrixCodeType(
            arToolkitSource.CONSTANTS.AR_MATRIX_CODE_3x3,
        );
    }

    /**
     * AR Toolkit Context
     *
     */

    // create atToolkitContext
    const arToolkitContext = new Tx.ArToolkitContext({
        cameraParametersUrl: Tx.ArToolkitContext.baseURL + 'camera_para.dat',
        detectionMode: 'mono_and_matrix',
        matrixCodeType: '3x3',
        maxDetectionRate: 5,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
    });

    //     arToolkitContext.arController.addEventListener('getMarker', (ev: any) => {
    //         console.log('MarkerGet', ev.data);
    //     });

    // initialize it
    arToolkitContext.init(function onCompleted() {
        const mat = arToolkitContext.getProjectionMatrix();
        camera.aspect = WIDTH / HEIGHT;
        // copy projection matrix to camera
        camera.projectionMatrix.copy(mat);
    });

    // update artoolkit on every frame
    onRenderFcts.push(function(...args: any[]) {
        if (arToolkitSource.ready === false) return;
        // console.log('Update:', args);
        arToolkitContext.update(arToolkitSource.domElement);
    });

    /*
     * Create ArMarkerControls
     *
     */

    async function makeMarkerForModel(mConfig: IModelConfig) {
        const {
            barcodeId,
            path,
            scale: [scaleX, scaleY, scaleZ],
            rotation: [rotX, rotY, rotZ],
            position: [posX, posY, posZ],
            animationNames,
        } = mConfig;
        const markerRoot = new T.Group();
        scene.add(markerRoot);

        // Configure marker
        const artoolkitMarker = new Tx.ArMarkerControls(
            arToolkitContext,
            markerRoot,
            {
                // type: 'pattern',
                barcodeValue: barcodeId,
                type: 'barcode',
                // changeMatrixMode: 'modelViewMatrix',
                // patternUrl: Tx.ArToolkitContext.baseURL + 'patt.hiro',
                // TODO: swap patterns
            },
        );

        // build a smoothedControls
        const smoothedRoot = new THREE.Group();
        scene.add(smoothedRoot);
        const smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
            lerpPosition: 0.4,
            lerpQuaternion: 0.3,
            lerpScale: 1,
        });

        // Render callback
        onRenderFcts.push(function(delta?: any) {
            smoothedControls.update(markerRoot);
        });

        // Load GLTF file
        const mesh: IMesh = await loadAssets(path);
        smoothedRoot.add(mesh.scene);
        if (mesh.scene) {
            mesh.scene.scale.x = scaleX;
            mesh.scene.scale.y = scaleY;
            mesh.scene.scale.z = scaleZ;

            mesh.scene.rotation.x = rotX;
            mesh.scene.rotation.y = rotY;
            mesh.scene.rotation.z = rotZ;

            mesh.scene.position.x = posX;
            mesh.scene.position.y = posY;
            mesh.scene.position.z = posZ;
        } else {
            console.warn('Could not load model: ', mConfig);
            return mConfig;
        }

        /*
         * Animation based on:
         *
         * https://threejs.org/docs/#manual/en/introduction/Animation-system
         *
         */
        let mixer: IAnimationMixer | null = null;
        let clips: IAnimation[] = [];
        let action: IAnimation | null = null;
        const animations = (mesh.animations || []).filter((clip: IClip) => {
            if (!animationNames) return true; // Use all animations
            return animationNames.includes(clip.name);
        });
        console.log('Mesh Animations: ', mesh.animations);
        // Play first animation
        if (animations && animations.length) {
            mixer = new THREE.AnimationMixer(mesh.scene);
            if (mixer) {
                // mixer.addEventListener('loop', function(e) {
                //     console.log('Loop finished: ', e);
                // });
            }
            animations.forEach((clip: IClip, idx: number) => {
                if (mixer) {
                    const action = mixer.clipAction(clip);
                    action.play();
                    action.setLoop(THREE.LoopRepeat);
                } else {
                    console.warn('No mixer for animation!');
                }
            });
        }

        // Step through animation
        onRenderFcts.push(function(delta: any) {
            // TODO: add further animations here
            // Applies a basic rotation animation
            // mesh.scene.rotation.x += 0.1;
            // mesh.scene.rotation.y += 0.1;
            // TODO: Complete playing the animation
            if (mixer) {
                mixer.update(delta);
            }
            if (mesh.animations && mesh.animations.length) {
                // TODO: do stuff on each frame?
                // mesh.animations.forEach((clip: IClip) => {
                //     if (mixer) {
                //         const action: IAnimation = mixer.clipAction(clip);
                //         // console.log('IsRunning: ', action.isRunning(), clip);
                //         // action.play();
                //     }
                // });
            }
        });

        return mConfig;
    }

    console.log('Mappings', MODEL_MAPPINGS);
    const models = await Promise.all(MODEL_MAPPINGS.map(makeMarkerForModel));
    console.log('Models assigned:', models);

    /**
     * Render Everything to the page
     *
     */

    // Add stats

    let stats: any;
    if (queryParams.debug) {
        stats = new Stats();

        // Append Stats object to the DOM
        $el.appendChild(stats.dom);
    }

    // render the scene
    onRenderFcts.push(function() {
        renderer.render(scene, camera);
        if (stats) {
            stats.update();
        }
    });

    // run the rendering loop
    let lastTimeMsec: number;
    requestAnimationFrame(function animate(nowMsec) {
        // keep looping
        requestAnimationFrame(animate);
        // measure time
        lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
        const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;
        // call each update function
        onRenderFcts.forEach(function(onRenderFct) {
            onRenderFct(deltaMsec / 1000, nowMsec / 1000);
        });
    });
}

async function mountReact() {
    ReactDOM.render(<App />, document.getElementById('root'));
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

mountReact();

document.addEventListener('DOMContentLoaded', () => {
    const $arContainer = document.querySelector(AR_CONTAINER_SELECTOR);
    if ($arContainer) {
        const width = $arContainer.clientWidth;
        const height = $arContainer.clientHeight;
        console.log('Docready', width, height);
        init(width, height);

        // Create public callback for reseting
        window.ARReset = () => {
            $arContainer.innerHTML = '';
            init(width, height);
        };
    }
});

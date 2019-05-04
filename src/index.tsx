import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
const queryString = require('query-string');

interface CustomWindow extends Window {
    AFRAME: any; // A Frame library loaded from static template
    THREE: any;
    THREEx: any; // JS ARToolkit
    Stats: any; // ThreeJS Stats plugin
    ARController: any; // jsartoolkit5
}

type Vector3 = [number, number, number];

interface IModelConfig {
    path: string; // File Path
    barcodeId: number; // Barcode ID
    positionOffset: Vector3; // Relative space offset Vector3
    scale: Vector3; // x, y, z scale
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

const MODEL_PATH_GREEN = 'LowPolyChar.glb';
const MODEL_PATH_RED = 'LowPolyCharRed.glb';
const MODEL_OFFSET: Vector3 = [0, 0, 0];
const MODEL_SCALE: Vector3 = [0.15, 0.15, 0.15];
const AR_CONTAINER_SELECTOR = '.ar-container';

// Define all models and their respective barcodes here
const MODEL_MAPPINGS: IModelConfig[] = [
    {
        path: 'LowPolyCharGreen.glb',
        barcodeId: 0,
        positionOffset: MODEL_OFFSET,
        scale: MODEL_SCALE,
    },
    {
        path: 'LowPolyCharRed.glb',
        barcodeId: 1,
        positionOffset: MODEL_OFFSET,
        scale: MODEL_SCALE,
    },
];

const queryParams = queryString.parse(window.location.search);

async function loadAssets(pathToAsset: string) {
    return new Promise<{ scene?: any }>(function(resolve, reject) {
        loader = new THREE.GLTFLoader();
        loader.load(
            pathToAsset,
            (gltf: { scene: any }) => {
                resolve(gltf);
                // Usage:
                // scene.add(gltf.scene);
            },
            undefined,
            (error: Error) => {
                console.error(error);
                reject(error);
            },
        );
    });
}

async function init() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    const vh = window.innerHeight * 0.01;

    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

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
    renderer.setPixelRatio(1 / 2);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';

    function updateRendererSize() {
        if (!$el) {
            return;
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
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
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3,
    });

    //     arToolkitContext.arController.addEventListener('getMarker', (ev: any) => {
    //         console.log('MarkerGet', ev.data);
    //     });

    // initialize it
    arToolkitContext.init(function onCompleted() {
        // copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
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
        const gltf = await loadAssets(path);
        smoothedRoot.add(gltf.scene);
        gltf.scene.scale.x = scaleX;
        gltf.scene.scale.y = scaleY;
        gltf.scene.scale.z = scaleZ;

        // Step through animation
        onRenderFcts.push(function() {
            // TODO: add further animations here

            // Applies a basic rotation animation
            // gltf.scene.rotation.x += 0.1;
            gltf.scene.rotation.y += 0.1;
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
init();

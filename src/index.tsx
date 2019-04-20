import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

interface CustomWindow extends Window {
    AFRAME: any; // A Frame library loaded from static template
    THREE: any;
    THREEx: any; // JS ARToolkit
    Stats: any; // ThreeJS Stats plugin
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

const DONUT_MODEL_PATH = 'Donut.glb';
const AR_CONTAINER_SELECTOR = '.ar-container';

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
    const $el: Element | null = document.querySelector(AR_CONTAINER_SELECTOR);
    if (!$el) {
        console.warn('No AR Container found!');
        return;
    }

    Tx.ArToolkitContext.baseURL = '';
    const renderer = new T.WebGLRenderer({
        alpha: true,
    });

    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    // renderer.setPixelRatio( 1/2 );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';

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

    /**
     * AR Toolkit Context
     *
     */

    // create atToolkitContext
    const arToolkitContext = new Tx.ArToolkitContext({
        cameraParametersUrl: Tx.ArToolkitContext.baseURL + 'camera_para.dat',
        detectionMode: 'mono',
        maxDetectionRate: 30,
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3,
    });

    // initialize it
    arToolkitContext.init(function onCompleted() {
        // copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // update artoolkit on every frame
    onRenderFcts.push(function() {
        if (arToolkitSource.ready === false) return;

        arToolkitContext.update(arToolkitSource.domElement);
    });

    /*
     * Create ArMarkerControls
     *
     */

    const markerRoot = new T.Group();
    scene.add(markerRoot);
    const artoolkitMarker = new Tx.ArMarkerControls(
        arToolkitContext,
        markerRoot,
        {
            type: 'pattern',
            patternUrl: Tx.ArToolkitContext.baseURL + 'patt.hiro',
            // TODO: swap patterns
        },
    );

    // build a smoothedControls
    const smoothedRoot = new THREE.Group();
    scene.add(smoothedRoot);
    var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
        lerpPosition: 0.4,
        lerpQuaternion: 0.3,
        lerpScale: 1,
    });
    onRenderFcts.push(function(delta?: any) {
        smoothedControls.update(markerRoot);
    });

    /**
     * Add Object to the scene
     *
     */

    // Loads a custom asset
    const gltf = await loadAssets(DONUT_MODEL_PATH);
    const arWorldRoot = smoothedRoot;
    smoothedRoot.add(gltf.scene);

    // Loading a test object
    // // add a torus knot
    // let geometry = new THREE.CubeGeometry(1, 1, 1);
    // let material = new THREE.MeshNormalMaterial({
    //     transparent: true,
    //     opacity: 0.5,
    //     side: THREE.DoubleSide,
    // });
    // let mesh = new THREE.Mesh(geometry, material);
    // mesh.position.y = geometry.parameters.height / 2;
    // arWorldRoot.add(mesh);

    // geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
    // material = new THREE.MeshNormalMaterial();
    // mesh = new THREE.Mesh(geometry, material);
    // mesh.position.y = 0.5;
    // arWorldRoot.add(mesh);

    onRenderFcts.push(function() {
        gltf.scene.rotation.x += 0.1;
        gltf.scene.rotation.z += 0.1;
    });

    /**
     * Render Everything to the page
     *
     */

    // Add stats
    const stats = new Stats();

    // Append Stats object to the DOM
    $el.appendChild(stats.dom);

    // render the scene
    onRenderFcts.push(function() {
        renderer.render(scene, camera);
        stats.update();
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

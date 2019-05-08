export interface CustomWindow extends Window {
    AFRAME: any; // A Frame library loaded from static template
    THREE: any;
    THREEx: any; // JS ARToolkit
    Stats: any; // ThreeJS Stats plugin
    ARController: any; // jsartoolkit5
    ARReset: () => void; // resets AR
}

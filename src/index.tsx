// import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// require('aframe');
// require('aframe-extras');

interface CustomWindow extends Window {
    AFRAME: any; // A Frame library loaded from static template
    THREE: any;
}

declare let window: CustomWindow;

window.onload = () => {
    const AFRAME = window.AFRAME;
    const THREE = window.THREE;
    const AF = AFRAME;
    const T = THREE;

    // ReactDOM.render(<App />, document.getElementById('root'));

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();

    console.log('AF', AF);
    AF.registerComponent('donutentity', {
        init() {
            console.log("Donut Init'd");
        },
    });

    const comp = AF.registerComponent('scale-on-mouseenter', {
        schema: {
            to: { default: '2.5 2.5 2.5' },
        },

        init: function() {
            var data = comp.data;
            comp.el.addEventListener('mouseenter', function() {
                comp.setAttribute('scale', data.to);
            });
        },
    });

    // AFRAME.registerState({
    //     initialState: {
    //     },

    //     handlers: {
    //     }
    // });
};

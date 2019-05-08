import React, { Component } from 'react';
import { CustomWindow } from '../typings/window';

declare let window: CustomWindow;

const APP_TITLE = 'MTA tips';
const AUTHOR_URL = 'https://omardelarosa.com';
const GITHUB_URL = 'https://github.com/omardelarosa/citylens';

const YOUTUBE_IFRAME =
    '<iframe src="https://www.youtube.com/embed/QVppPxScGUE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

interface IAppState {
    isExpanded?: boolean;
    hasSnappedPhoto?: boolean;
}

interface IAppProps {}

function AuthorLink(props: {}) {
    return <a href={AUTHOR_URL}>omar delarosa</a>;
}

function GithubLink(props: {}) {
    return <a href={GITHUB_URL}>Github Source</a>;
}

function AboutContainer(props: {}) {
    return (
        <div className="about-container">
            <h3>About</h3>
            <div className="description u-m-b-1">
                The CityLens project is a prototype built by {<AuthorLink />}{' '}
                for a web-based system of AR experiences that can be deployed
                across an urban setting with maximum device accessibility and
                minimal setup costs.
            </div>
            <div className="links u-m-b-1">
                <GithubLink />
            </div>
            <div className="iframe-container flexy-container">
                <span dangerouslySetInnerHTML={{ __html: YOUTUBE_IFRAME }} />
            </div>
        </div>
    );
}

class App extends Component<IAppState, IAppProps> {
    public readonly state = {
        isExpanded: false,
        hasSnappedPhoto: false,
    };

    public toggleHeader = (e: React.SyntheticEvent) => {
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
    };

    public savePhoto = (e: React.SyntheticEvent) => {
        if (this.state.hasSnappedPhoto) {
            if (typeof window.ARReset == 'function') {
                window.ARReset();
            }
            this.setState({
                hasSnappedPhoto: false,
            });
            return;
        }

        this.setState({
            hasSnappedPhoto: true,
        });

        const canvas = document.querySelector('canvas');
        const $ar = document.querySelector('.ar-container');
        const $video = document.querySelector('video');
        const videoCanvas = document.createElement('canvas');
        if ($video && videoCanvas) {
            videoCanvas.width = $video.clientWidth;
            videoCanvas.height = $video.clientHeight;
        }
        const context = videoCanvas.getContext('2d');

        // debugger;
        if (canvas && context && $video) {
            // Draw Video
            context.drawImage(
                $video,
                0,
                0,
                $video.clientWidth,
                $video.clientHeight,
            );

            const gl = canvas.getContext('webgl')!;
            // Draw AR
            context.drawImage(gl.canvas, 0, 0);

            // const ctx = canvas.getContext('webgl');
            const blob = videoCanvas.toBlob((blob: Blob | null) => {
                if (!blob) {
                    console.warn('Unable to generate blob from canvas');
                    return;
                }
                const image = new Image();

                // Use blob
                const url = URL.createObjectURL(blob);
                image.onload = () => {
                    URL.revokeObjectURL(url);
                };
                image.src = url;
                if ($ar) {
                    $ar.innerHTML = '';
                    $ar.appendChild(image);
                }
                if ($video) {
                    // if (ctx) {
                    //     ctx.drawImage(
                    //         $video,
                    //         0,
                    //         0,
                    //         $video.clientWidth,
                    //         $video.clientHeight,
                    //     );
                    // }
                    $video.remove();
                }
            });
        }
    };

    render() {
        const isExpanded = this.state.isExpanded;
        const hasSnappedPhoto = this.state.hasSnappedPhoto;
        const headerClassName = `header flexy-container ${
            isExpanded ? 'expanded' : 'collapsed'
        }`;
        const toggleButtonText = '...'; // This could be better?
        return (
            <div className="App">
                <h1 className={headerClassName}>
                    <span onClick={this.savePhoto}>
                        <img
                            className="photoIcon"
                            src={
                                hasSnappedPhoto
                                    ? '/images/x-icon.svg'
                                    : '/images/camera-icon.svg'
                            }
                        />
                    </span>
                    <span onClick={this.toggleHeader} className="titleText">
                        {APP_TITLE}
                    </span>
                </h1>
                {!isExpanded ? null : <AboutContainer />}
            </div>
        );
    }
}

export default App;

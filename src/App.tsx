import React, { Component } from 'react';

const APP_TITLE = 'MTA tips';
const AUTHOR_URL = 'https://omardelarosa.com';

interface CustomWindow {
    ARReset: () => void;
}

declare let window: CustomWindow;

interface IAppState {
    isExpanded?: boolean;
    hasSnappedPhoto?: boolean;
}

interface IAppProps {}

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

        console.log('Saving photo!');
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
                {!isExpanded ? null : (
                    <h2 className="info-box flexy-container">
                        <span />
                        <span>
                            by{' '}
                            <a href={AUTHOR_URL} target="_blank">
                                omar delarosa
                            </a>
                        </span>
                    </h2>
                )}
            </div>
        );
    }
}

export default App;

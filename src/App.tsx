import React, { Component } from 'react';

const APP_TITLE = 'MTA tips';
const AUTHOR_URL = 'https://omardelarosa.com';

interface IAppState {
    isExpanded?: boolean;
}

interface IAppProps {}

class App extends Component<IAppState, IAppProps> {
    public readonly state = {
        isExpanded: false,
    };

    public toggleHeader = (e: React.SyntheticEvent) => {
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
    };

    render() {
        const isExpanded = this.state.isExpanded;
        const headerClassName = `header flexy-container ${
            isExpanded ? 'expanded' : 'collapsed'
        }`;
        const toggleButtonText = '...'; // This could be better?
        return (
            <div className="App" onClick={this.toggleHeader}>
                <h1 className={headerClassName}>
                    <span />
                    <span className="titleText">{APP_TITLE}</span>
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

import React, { Component } from 'react';
import { Stitch, RemoteMongoClient } from 'mongodb-stitch-browser-sdk';
import './App.css';

class Sidebar extends React.Component {
    render() {
        return <div className="sidebar"><p>Sidebar here</p></div>;
    }
}

class Channel extends React.Component {
    render() {
        return <div className="channel">
          <div className="channel-header">Channel header here</div>
          <div>Channel body here</div>
        </div>
    }
}

class App extends Component {
    componentDidMount() {
        // Do stitch login here
    }

    render() {
        return (
            <div className="App">
                <Sidebar></Sidebar>
                <Channel></Channel>
            </div>
        );
    }
}

export default App;

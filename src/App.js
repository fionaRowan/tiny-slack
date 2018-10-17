import React, { Component } from 'react';
import { Stitch, RemoteMongoClient, AnonymousCredential } from 'mongodb-stitch-browser-sdk';
import './App.css';

class Sidebar extends React.Component {
    render() {
        const {user, setChannel} = this.props;

        const channelsList = user.channels ? Object.keys(user.channels).map((channel, index) => (
            <div className="sidebar-channel" key={index} onClick={() => setChannel(channel)}>{channel}</div>
        )) : [];

        return (
            <div className="sidebar">
                <strong>Tiny Slack</strong>
                <div>{this.props.user._id}</div>
                <br/>
                Channels
                {channelsList}
            </div>);
    }
}

function ChannelHeader({channel}) {
    return (
        <div className="channel-header">
            <strong>{channel._id}</strong>
            <div className="channel-header-subtext">{channel.members.length} | {channel.description}</div>
        </div>);
}

function Message({message}) {
    return (
        <div className="channel-message">
            <div className="channel-message-gutter">
            </div>

            <div>
                <div className="channel-message-header">
                    <strong>{message.created_by}</strong>
                    &nbsp;
                    <span className="channel-message-subtext">{message.date.toTimeString()}</span>
                </div>
                <div className="channel-message-body">{message.msg}</div>
            </div>
        </div>
    )
}

class MessageInput extends React.Component {

    state = {
        message: '',
    };

    onChange = (e) => {
        this.setState({message: e.target.value})
    };

    onSubmit = (event) => {
        event.preventDefault();
        this.props.sendMessage(this.state.message);
        this.setState({message: ''})
    };

    render() {
        return (
                <form onSubmit={this.onSubmit}>
                    <input className="message-input" type="input/text" value={this.state.message} onChange={this.onChange} placeholder="Send a message..."/>
                </form>
            )
    }
}

class Channel extends React.Component {

    state = {messages: []};

    componentDidMount() {
        this.populateMessages();
    }

    populateMessages() {
        const {mongoContext, channel} = this.props;

        mongoContext.colMessages.find({recipient_id: channel._id}).asArray().then(messageDocs => {
            this.setState({messages: messageDocs});
        })
    }

    sendMessage = msg => {
        const {user, mongoContext, channel} = this.props;

        mongoContext.client.callFunction('sendMsg', ['Public', channel._id, user._id, msg]).then(res => {
            this.populateMessages();
        }).catch(err => console.log(err));
    };

    render() {
        const {messages} = this.state;

        const messagesComponent = messages.map((message, index) => <Message key={index} message={message}/>);

        return (
            <div className="channel">
                <ChannelHeader channel={this.props.channel}/>
                <div className="channel-messages">{messagesComponent}</div>
                <MessageInput sendMessage={this.sendMessage}/>
            </div>)
    }
}

class App extends Component {

    state = {
        channel: '',
        channels: {},
        user: {},
    };

    componentDidMount() {
        const client = Stitch.initializeDefaultAppClient('tiny-slack-kwbke');
        const db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db('tiny-slack');
        const mongoContext = {
            client,
            db,
            colMessages: db.collection('messages'),
            colUsers: db.collection('users'),
            colChannels: db.collection('channels'),
        };

        let user;
        let channels = {};
        let ch = '';

        client.auth.loginWithCredential(new AnonymousCredential()).then(authedUser => {
            const awaitUser = mongoContext.colUsers.find({_id: authedUser.id}).first().then(userDoc => {
                user = userDoc ? userDoc : {};
            });

            const awaitChannels = mongoContext.colChannels.find({}).asArray().then(channelDocs => {
                channelDocs.forEach(channel => {
                    channels[channel._id] = channel;
                    ch = channel._id;
                })
            });

            Promise.all([awaitUser, awaitChannels]).then(() => {
                this.setState({
                    mongoContext,
                    user,
                    channels,
                    channel: ch,
               })
            })
        });
    }

    setChannel = channel => {
        this.setState({channel});
    };

    render() {
        const {user, mongoContext, channel, channels} = this.state;
        const ch = channels[channel];

        return (
            <div className="App">
                <Sidebar user={user} channels={channels} setChannel={this.setChannel}/>
                {(ch && <Channel user={user} channel={channels[channel]} mongoContext={mongoContext}/>)}
            </div>
        );
    }
}

export default App;

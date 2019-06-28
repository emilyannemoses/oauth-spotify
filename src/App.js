import React, { Component } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./access/config";
import hash from "./access/hash";
import logo from "./logo.svg";
import "./App.css";
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: [],
      token: '',
      deviceId: "",
      loggedIn: false,
      error: "",
      trackName: "Track Name",
      artistName: "Artist Name",
      albumName: "Album Name",
      playing: false,
      position: 0,
      duration: 1,
    };
    this.playerCheckInterval = null;
  }
  componentDidMount() {
    let _token = hash.access_token
    if (_token) {
      this.setState({
        token: _token
      });
      this.getUserInfo(_token);
    }
  }
  getUserInfo = (token) => {
    axios.get('https://api.spotify.com/v1/me/', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then( (response) => {
      this.setState({
        user: {
          name: `${response.data.display_name}`,
          username: `${response.data.id}`,
          email: `${response.data.email}`,
          location: `${response.data.country}`
        },
        token: token,
      })
      this.handleLogin()
    })
    .catch( (error) => {
      console.log(error);
    })
    .then( () => {
      // always executed
    })
  }
  handleLogin() {
    if (this.state.token !== "") {
      this.setState({ loggedIn: true });
      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
    }
  }
  // when we receive a new update from the player
  onStateChanged(state) {
    // only update if we got a real state
    if (state !== null) {
      const {
        current_track: currentTrack,
        position,
        duration,
      } = state.track_window;
      const trackName = currentTrack.name;
      const albumName = currentTrack.album.name;
      const artistName = currentTrack.artists
        .map(artist => artist.name)
        .join(", ");
      const playing = !state.paused;
      this.setState({
        position,
        duration,
        trackName,
        albumName,
        artistName,
        playing
      });
    } else {
      // state was null, user might have swapped to another device
      this.setState({ error: "Looks like you might have swapped to another device?" });
    }
  }
  createEventHandlers() {
    // problem setting up the player
    this.player.on('initialization_error', e => { console.error(e); });
    // problem authenticating the user.
    // either the token was invalid in the first place,
    // or it expired (it lasts one hour)
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    // currently only premium accounts can use the API
    this.player.on('account_error', e => { console.error(e); });
    // loading/playing the track failed for some reason
    this.player.on('playback_error', e => { console.error(e); });

    // Playback status updates
    this.player.on('player_state_changed', state => this.onStateChanged(state));

    // Ready
    this.player.on('ready', async data => {
      let { device_id } = data;
      console.log("Let the music play on!");
      // set the deviceId variable, then let's try
      // to swap music playback to *our* player!
      await this.setState({ deviceId: device_id });
      this.transferPlaybackHere();
    });
  }

  checkForPlayer() {
    const { token } = this.state;
    
    // if the Spotify SDK has loaded
    if (window.Spotify !== null) {
      // cancel the interval
      clearInterval(this.playerCheckInterval);
      // create a new player
      this.player = new window.Spotify.Player({
        name: "Matt's Spotify Player",
        getOAuthToken: cb => { cb(token); },
      });
      // set up the player's event handlers
      this.createEventHandlers();
      
      // finally, connect!
      this.player.connect();
    }
  }
  
  onPrevClick() {
    this.player.previousTrack();
  }
  
  onPlayClick() {
    this.player.togglePlay();
  }
  
  onNextClick() {
    this.player.nextTrack();
  }
  
  transferPlaybackHere() {
    const { deviceId, token } = this.state;
    // https://beta.developer.spotify.com/documentation/web-api/reference/player/transfer-a-users-playback/
    fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "device_ids": [ deviceId ],
        // true: start playing music if it was paused on the other device
        // false: paused if paused on other device, start playing music otherwise
        "play": true,
      }),
    });
  }

  render() {
    const {
      user,
      token,
      loggedIn,
      trackName,
      artistName,
      albumName,
      error,
      playing
    } = this.state;
    const {username, name, email, location} = user;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          { this.state.token ? (
            <div className="user-details">
              User's name:{name} <br></br>
              Spotify username:{username}<br></br>
              Email:{email}<br></br>
              Location:{location}<br></br>
              Playing: {playing}
              <div>      
              <p>Artist: {artistName}</p>
              <p>Track: {trackName}</p>
              <p>Album: {albumName}</p>
              <p>
                <button onClick={() => this.onPrevClick()}>Previous</button>
                <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
                <button onClick={() => this.onNextClick()}>Next</button>
              </p>
            </div>
            </div>
          ) : (
            <a
              className="btn btn--loginApp-link"
              href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
            >
              Log in
            </a>
            )
          }
        </header>
      </div>
    );
  }
}
export default App;
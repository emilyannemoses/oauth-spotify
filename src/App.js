import React, { Component } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./config";
import hash from "./hash";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: [],
      token: null,
      is_playing: "Paused",
    };
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
    fetch('https://api.spotify.com/v1/me/', {
    headers: {
      'Authorization': 'Bearer ' + token
    },
  })
    .then(response => response.json())
    .then(data =>
    (
      {
        name: `${data.display_name}`,
        username: `${data.id}`,
        email: `${data.email}`,
        location: `${data.country}`
      }
    )
    )
    .then(user => this.setState({
      user,
      is_playing: "Paused"
    })
    )
    .catch(error=>console.log("There as an error", error))
  }
  render() {
    const {user, is_playing} = this.state;
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
              Playing or paused:{is_playing}
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
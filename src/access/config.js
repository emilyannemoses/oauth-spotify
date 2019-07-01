export const authEndpoint = "https://accounts.spotify.com/authorize";
export const clientId = "<YOUR CLIENTID>";
export const redirectUri = "http://localhost:3000/callback/";
export const scopes = [
    "user-read-private",
    "user-read-email",
    "streaming", 
    "user-read-birthdate"
];
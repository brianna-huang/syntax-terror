import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';

const domain = "https://dev-8cvecqohzr7w15ry.us.auth0.com";
const clientId = "jtfCwLdrTFsGqdaWfiUhPb607Lau4ZPE";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
    domain={domain}
    clientId={clientId}
    redirectUri={"http://localhost:3000"}
    onRedirectCallback={(appState) => {
      window.history.replaceState(
        {},
        document.title,
        appState?.returnTo || window.location.pathname
      );
    }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
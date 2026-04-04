import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initErrorReporter } from './error-reporter';

Sentry.init({
  dsn: 'https://9f3cf23b2b5cc7bea4b1ea4ce4b38c8e@o4511162586759168.ingest.us.sentry.io/4511162598096896',
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

initErrorReporter('McCulloch-Invoice');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

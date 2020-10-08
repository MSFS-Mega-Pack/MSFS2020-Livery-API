const Sentry = require('@sentry/node');
require('dotenv').config();
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require('@sentry/tracing');
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.Sentry_DSN,
  tracesSampleRate: 1.0,
});

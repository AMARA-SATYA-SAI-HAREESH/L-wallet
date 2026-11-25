// IMPORTANT: Polyfills must be imported FIRST before anything else
// These provide Node.js crypto/encoding APIs that ethers.js needs in React Native

import 'fast-text-encoding';                 // TextEncoder / TextDecoder
import 'react-native-get-random-values';     // crypto.getRandomValues
import 'react-native-url-polyfill/auto';     // URL / URLSearchParams
import '@ethersproject/shims';               // ethers.js shims

import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);

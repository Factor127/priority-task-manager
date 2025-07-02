//index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // This will now import App.jsx
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
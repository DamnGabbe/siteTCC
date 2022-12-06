// Arquivo de configurações do banco de dados

const firebase = require('firebase'); // Importa o firebase
const config = require('./config'); // Importa o arquivo de configuações

const db = firebase.initializeApp(config.firebaseConfig); // Inicializa o firebase

module.exports = db; // Exporta a variável db
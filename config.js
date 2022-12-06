// Arquivo de configurações gerais

'use strict'; // códigos no modo estrito são mais otimizados do que códigos no 'modo normal'
const dotenv = require('dotenv'); // Importa o dotenv
const assert = require('assert'); // Importa o assert

// Configurando o dontenv
dotenv.config(); 

const {
    PORT,
    HOST,
    HOST_URL,
    API_KEY,
    AUTH_DOMAIN,
    DATABASE_URL,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID
} = process.env; // Defino as variáveis de ambiente do arquivo .env

// Caso a PORTA ou o HOST não existam exibe uma mensagem de erro
assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');

// Exporta as configurações necessárias
module.exports = {
    port: PORT,
    host: HOST,
    url: HOST_URL,
    firebaseConfig: {
        apiKey: API_KEY,
        authDomain: AUTH_DOMAIN,
        databaseURL: DATABASE_URL,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID
    }
}
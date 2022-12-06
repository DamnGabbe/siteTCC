// Arquivo principal

'use strict'; // Codigo no modo estrito
const express = require('express'); // Importa o Express
const session = require('express-session'); // Importa a sessão
const cors = require('cors'); // Importa o cors
const bodyParser = require('body-parser'); // Importa o body-parser
const multer = require('multer') // Importa o middleware multer

const mercadopago = require ('mercadopago');

const config = require('./config'); // Importa o arquivo de configurações
const userRoutes = require('./routes/user-routes'); // Importa as rotas
const admRoutes = require('./routes/adm-routes'); // Importa as rotas
const db = require('./db') // Importa a classe de banco de dados
const app = express(); // Classe que controla a aplicação

const storage = require('./multerConfig')

const database = db.database();
const firestore = db.firestore()

mercadopago.configure({
    access_token: 'TEST-5389643563095272-120209-b6da0c0f47b8055d30445c546ebffa3c-820550557'
});

app.set('trust proxy', 1) 

app.use(session({ // Configurações de sessão
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: false,
}))

app.use(express.json()); // Configurando o app para json
app.use(cors()); // Usa Cross-Origin Resource Sharing

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json()); // Configura o app para trabalhar com json dentro do body-parse

app.use('/api', userRoutes.routes); // Define a rota de operações sobre usuários
app.use('/adm', admRoutes.routes); // Define a rota de operações da administração

app.use(express.static(__dirname + '/views/static'))

const upload = multer({storage: storage})

// Rotas
app.get('/', function(req, res) {

    res.render("index.pug", {session : req.session.login})
})

app.get('/produtos', function(req, res) {

    var products = []

    firestore.collection("products").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            var coiso = doc.data()
            coiso["id"] = doc.id
            products.push(coiso)
        });
        res.render("product.pug", {products: products, session : req.session.login})
    });    
})

app.get('/sobre', function(req, res) {

    var texts = []

    firestore.collection("texts").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            texts = doc.data()
        });

        res.render("about.pug", {p1: texts['p1'], p2: texts['p2'], p3: texts['p3'], session : req.session.login})
    }); 
})

app.get('/contato', function(req, res) {
    res.render("contact.pug", {session : req.session.login})
})

app.get("/sair", function(req, res) {
    req.session.login = undefined
    res.redirect("/")
})

app.get('/autenticar', function(req, res) {
    if (req.session.login) { // Verifica se a pessoa já está logada
        res.redirect("/")
    }
    else {
        res.sendFile(__dirname + "/views/login.html")
    }
})

app.get('/produto/:produto', function(req, res) {

    var docRef = firestore.collection("products").doc(req.params["produto"]);

    docRef.get().then((doc) => {

        res.render("produto.pug", {
            nome:doc.data()["name"], 
            desc:doc.data()["desc"], 
            price:doc.data()["price"],
            id:req.params["produto"]
        })
        
    }).catch((error) => {
        res.redirect('/produtos')
    });
})

app.get('/comprar/:produto', function(req, res) {


    if (!req.session.login) {
        res.redirect('/autenticar')
    }

    else {
        var produto = firestore.collection("products").doc(req.params["produto"]);
        var usuario = firestore.collection("users").doc(req.session.login);

        usuario.get().then((doc) => {

            produto.get().then((prod) => {
                var userInfo = doc.data()
                var userProducts = userInfo["products"]

                userProducts.push(prod.id)
                userInfo["products"] = userProducts

                usuario.set(userInfo);
            })


            res.redirect('/produto/'+req.params["produto"])

        })
    }
})

app.get('/carrinho', async function(req, res) {
    if (!req.session.login) {
        res.redirect('/autenticar')
    }

    else {
        const usuario = await firestore.collection('users').doc(req.session.login).get();
        const produtos = await firestore.collection('products')

        var snapshot
        var listaProdutos = []


        for(let i = 0; i < usuario.data()["products"].length; i++) {
            snapshot = await produtos.doc(usuario.data()["products"][i]).get()
            listaProdutos.push(snapshot.data())        
        }

        res.render('cart.pug', {produtos: listaProdutos})   
    }
})

app.get('/finalizar', function(req, res) {

    if (!req.session.login) {
        res.redirect('/autenticar')
    }

    else {
        var usuario = firestore.collection("users").doc(req.session.login);

        usuario.get().then((doc) => {

        
            var userInfo = doc.data()
            userInfo["products"] = []

            usuario.set(userInfo);

        }) 
        res.redirect('/')
    }
})


app.get('/compra/finalizar', function(req, res) {

    if (!req.session.login) {
        res.redirect('/autenticar')
    }

    else {
        var usuario = firestore.collection("users").doc(req.session.login);

        usuario.get().then((doc) => {

            var produtos = []

            doc.data()["products"].forEach((i) => {
                
                var produto = firestore.collection("products").doc(i);

                produto.get().then((prod) => {
                    produtos.push({
                        title: prod.data()["name"],
                        unit_price: parseFloat(prod.data()["price"]),
                        quantity: 1
                    })

                    let preference = {
                        items: produtos
                    };
            
                    mercadopago.preferences.create(preference).then(function(response){
                            global.id = response.body.id;
                    })
                })
            })

            return
        })

        res.render('finalizar.pug', {preference_id: global.id})
    }
})

// ADM
app.get('/administrar', function(req, res) {
    if (req.session.login) {
        res.redirect("/administrar/painel")
    }
    else {
        res.sendFile(__dirname + "/views/admin.html")
    }
})

app.get('/administrar/painel', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/admin-painel.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/funcionarios', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/funcionarios.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/adicionar/funcionario', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/adicionar-funcionario.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/excluir/funcionario', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/excluir-funcionario.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/produtos', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/produtos.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/adicionar/produto', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/adicionar-produto.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/excluir/produto', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/excluir-produto.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/textos', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/editar-textos.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.get('/administrar/textos/historia', function(req, res) {
    if (req.session.login) {
        res.sendFile(__dirname + "/views/editar-texto1.html")
    }
    else {
        res.redirect("/administrar")
    }
})

app.post('/adm/product', function(req, res) {
    try {
        firestore.collection('products').doc(req.body.id).set({
            "name": req.body.name, 
            "price": req.body.price, 
            "desc":req.body.desc
        });

        res.send('adicionado com sucesso!')
    }
        
    catch (error) {
        res.status(400).send(error.message);
        res.redirect("/administrar/painel")
    }
})

// Post
app.post('/message/add', function(req, res) {

    database.ref('message').set({
        email: req.body.email,
        message: req.body.message  
    })
    res.redirect('/contato')
})

app.listen(config.port, () => console.log('App is listening on url http://localhost:' + config.port)); // Roda o webserver
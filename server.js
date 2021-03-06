const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./datastore.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());
server.use('/api', router)

const SECRET_KEY = '123456789'

const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({email, password}){
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

// var port = process.env.OPENSHIFT_NODEJS_PORT || '3000';
// var ip = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var port = process.env.PORT || '3000';


server.post('/auth/login', (req, res) => {
  const {email, password} = req.body
  if (isAuthenticated({email, password}) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({status, message})
    return
  }
  const access_token = createToken({email, password})
  res.status(200).json({access_token})
})

server.get('/authorize', (req, res) => {
  var guid = createGuid();
  const fake_token = {
    aud: 'http://localhost:4200',
    iss: 'HR',
    jti: guid,
    nbf: 1558919776,
    role: 'developer',
    sub: 'applepie',
    unique_name: 'XYZ\\applepie',
  };

  const access_token = createToken(fake_token)
  res.status(200).json({access_token})
})

server.use(/^(?!\/auth).*$/,  (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({status, message})
    return
  }
  try {
     verifyToken(req.headers.authorization.split(' ')[1])
     next()
  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, message})
  }
})

function createGuid(){  
  function S4() {  
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);  
  }  
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();  
} 

server.use(router)

// server.listen(port, ip, () => {
//   console.log('Run Auth API Server at ' + ip + ':' + port)
// })

// Up and Running at Port 4000
server.listen(port, () => {
  console.log('A GraphQL API running at port 4000');
});

// server.listen(port, ip);

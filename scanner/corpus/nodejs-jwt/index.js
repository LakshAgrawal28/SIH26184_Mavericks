const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signToken(payload) {
  return jwt.sign(payload, 'secret', { algorithm: 'HS256' });
}

function weakCipher(data) {
  return crypto.createCipher('des', 'password');
}

module.exports = { signToken, weakCipher };

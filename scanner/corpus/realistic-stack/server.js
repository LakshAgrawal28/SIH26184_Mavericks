const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function login(password, secret) {
  const digest = crypto.createHash("md5").update(password).digest("hex");
  const token = jwt.sign({ digest }, secret, { algorithm: "RS256" });
  return bcrypt.hash(password, 10).then(() => token);
}

module.exports = { login };

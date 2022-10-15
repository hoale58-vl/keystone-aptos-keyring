
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./aptos-keyring.cjs.production.min.js')
} else {
  module.exports = require('./aptos-keyring.cjs.development.js')
}

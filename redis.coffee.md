    Redis = require 'redis'
    Bluebird = require 'bluebird'
    Bluebird.promisifyAll Redis.RedisClient.prototype
    Bluebird.promisifyAll Redis.Multi.prototype

    module.exports = Redis

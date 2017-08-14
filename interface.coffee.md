RedisInterface
==============

    seem = require 'seem'

    debug = (require 'tangible') 'normal-key:interface'

    class RedisInterface
      constructor: (@redises) ->

      timeout: 24*3600

Meta-manipulators

      all: (cb) ->
        Promise.all @redises.map cb

      multi: (key,cb) ->
        timeout = @timeout
        @all (redis) ->
          cb redis.multi()
          .expire key, timeout
          .exec()
          .catch -> yes

      first: seem (cb) ->
        for redis in @redises
          try
            v = yield cb redis
            return v
        return

Properties
----------

      set: (key,name,value) ->
        if value?
          @multi (key,redis) ->
            redis
            .hset key, name, value
        else
          @all (redis) ->
            redis
            .hdel key, name
            .catch -> yes

      get: (key,name) ->
        @first (redis) ->
          redis.hget key, name

      incr: (key,property,increment = 1) ->
        @multi (key,redis) ->
          redis
          .hincrby key, property, increment

      mapping: (key) ->
        @first seem (redis) ->
          result = {}
          cursor = 0
          while cursor isnt '0'
            [cursor,elements] = yield redis.hscan key, cursor
            for [k,v] in elements
              result[k] = v

          result

Sets
----

      add: (key,value) ->
        return unless value?
        @multi (key,redis) ->
          redis
          .sadd key, value

      remove: (key,value) ->
        return unless value?
        @multi (key,redis) ->
          redis
          .srem key, value

      has: (key,value) ->
        return unless value?
        @first (redis) ->
          redis.sismember key, value

      count: (key) ->
        @first (redis) ->
          redis.scard key

      members: (key) ->
        @first (redis) ->
          redis.smembers key

      clear: seem (key) ->
        @multi (key,redis) ->
          redis
          .sinterstore key, "#{key}--emtpy-set--"

      forEach: (key,cb) ->
        @first seem (redis) ->
          cursor = 0
          while cursor isnt '0'
            [cursor,keys] = yield redis.sscan key, cursor
            for key in keys
              try
                yield cb key
              catch error
                debug.dev "forEach cb on #{key}: #{error.stack ? error}"
          return

Sorted Sets
-----------

      sorted_add: seem (key,value,score = 0) ->
        return unless value?
        @multi (key,redis) ->
          redis
          .zadd key, score, value

      sorted_incr: seem (key,value,delta = 1) ->
        return unless value?
        @multi (key,redis) ->
          redis
          .zincrby key, delta, value

      sorted_remove: seem (key,value) ->
        return unless value?
        @multi (key,redis) ->
          redis
          .zrem key, value

      score: (key,value) ->
        return unless value?
        @first (redis) ->
          redis.zscore key, value

      sorted_count: (key) ->
        @first (redis) ->
          redis.zcard key

      sorted_forEach: (key,cb) ->
        @first seem (redis) ->
          cursor = 0
          while cursor isnt '0'
            [cursor,values] = yield redis.zscan key, cursor

            while values.length > 1
              key = values.shift()
              score = values.shift()
              try
                yield cb key, score
              catch error
                debug.dev "sorted_forEach cb on #{key}: #{error.stack ? error}"

          return

    module.exports = RedisInterface

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
          cb
          .call redis.multi()
          .expire key, timeout
          .exec()
          .catch -> yes

      first: seem (cb) ->
        for redis in @redises
          try
            v = yield cb.call redis
            return v
        return

Properties
----------

      set: (key,name,value) ->
        if value?
          @multi key, -> @hset key, name, value
        else
          @all (redis) ->
            redis
            .hdel key, name
            .catch -> yes

      get: (key,name) ->
        @first -> @hget key, name

      incr: (key,property,increment = 1) ->
        @multi key, -> @hincrby key, property, increment

      mapping: (key) ->
        @first seem ->
          result = {}
          cursor = 0
          while cursor isnt '0'
            [cursor,elements] = yield @hscan key, cursor
            for [k,v] in elements
              result[k] = v

          result

Sets
----

      add: (key,value) ->
        return unless value?
        @multi key, -> @sadd key, value

      remove: (key,value) ->
        return unless value?
        @multi key, -> @srem key, value

      has: seem (key,value) ->
        return unless value?
        it = yield @first -> @sismember key, value
        if it is 1 then true else false

      count: (key) ->
        @first -> @scard key

      members: (key) ->
        @first -> @smembers key

      clear: (key) ->
        @multi key, -> @sinterstore key, "#{key}--emtpy-set--"

      forEach: (key,cb) ->
        @first seem ->
          cursor = 0
          while cursor isnt '0'
            [cursor,keys] = yield @sscan key, cursor
            for key in keys
              try
                yield cb key
              catch error
                debug.dev "forEach cb on #{key}: #{error.stack ? error}"
          return

Sorted Sets
-----------

      sorted_add: (key,value,score = 0) ->
        return unless value?
        @multi key, -> @zadd key, score, value

      sorted_incr: (key,value,delta = 1) ->
        return unless value?
        @multi key, -> @zincrby key, delta, value

      sorted_remove: (key,value) ->
        return unless value?
        @multi key, -> @zrem key, value

      score: (key,value) ->
        return unless value?
        @first -> @zscore key, value

      sorted_count: (key) ->
        @first -> @zcard key

      sorted_forEach: (key,cb) ->
        @first seem ->
          cursor = 0
          while cursor isnt '0'
            [cursor,values] = yield @zscan key, cursor

            while values.length > 1
              key = values.shift()
              score = values.shift()
              try
                yield cb key, score
              catch error
                debug.dev "sorted_forEach cb on #{key}: #{error.stack ? error}"

          return

    module.exports = RedisInterface

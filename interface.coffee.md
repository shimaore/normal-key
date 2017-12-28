RedisInterface
==============

    seem = require 'seem'

    debug = (require 'tangible') 'normal-key:interface'

Default timeout is 24h.

    default_timeout = 24*3600

    class RedisInterface
      constructor: (@redis, @__timeout = default_timeout) ->
        @redis.defineCommand 'transition',
          numberOfKeys: 1,
          lua: """
            local key = KEYS[1]
            local old_value = ARGV[1]
            local new_value = ARGV[2]
            local current_value = redis.call('get',key)
            if current_value == old_value or (current_value == false and old_value == '')
            then
              if new_value == '' then
                return redis.call('del',key)
              else
                return redis.call('setex',key,#{@__timeout},new_value)
              end
            else
              return redis.error_reply('Current value `'..current_value..'` does not match `'..old_value..'`.')
            end
          """

      timeout: (timeout) ->
        self = new RedisInterface @redis, timeout

      multi: seem (op,key,args...) ->
        result = yield @redis
          .multi [
            [op,key,args...]
            ['expire',key,@__timeout]
          ]
          .exec()
          .catch (err) ->
            if err.previousErrors?
              Promise.reject new Error err.previousErrors[0].message
        result[0][1]

Properties
----------

      set: (key,name,value) ->
        if value?
          @multi 'hset', key, name, value
        else
          @redis.hdel key, name

      get: (key,name) ->
        @redis.hget key, name

      incr: (key,name,increment = 1) ->
        @multi 'hincrby', key, name, increment

      transition: (key,old_value,new_value) ->
        @redis.transition key, old_value, new_value

      mapping: seem (key) ->
        result = {}
        cursor = 0
        while cursor isnt '0'
          [cursor,elements] = yield @redis.hscan key, cursor
          for [k,v] in elements
            result[k] = v

        result

Sets
----

      add: (key,value) ->
        return unless value?
        @multi 'sadd', key, value

      remove: (key,value) ->
        return unless value?
        @multi 'srem', key, value

      has: seem (key,value) ->
        return unless value?
        it = yield @redis.sismember key, value
        if it is 1 then true else false

      count: (key) ->
        @redis.scard key

      members: (key) ->
        @redis.smembers key

      clear: (key) ->
        @redis.sinterstore key, "#{key}--emtpy-set--"

      forEach: seem (key,cb) ->
        cursor = 0
        while cursor isnt '0'
          [cursor,values] = foo = yield @redis.sscan key, cursor
          for value in values
            try
              yield cb value
            catch error
              debug.dev "forEach cb on #{value}: #{error.stack ? error}"
        return

Sorted Sets
-----------

      sorted_add: (key,value,score = 0) ->
        return unless value?
        @multi 'zadd', key, score, value

      sorted_incr: (key,value,delta = 1) ->
        return unless value?
        @multi 'zincrby', key, delta, value

      sorted_remove: (key,value) ->
        return unless value?
        @multi 'zrem', key, value

      score: seem (key,value) ->
        return unless value?
        parseFloat yield @redis.zscore key, value

      sorted_count: (key) ->
        @redis.zcard key

      sorted_forEach: seem (key,cb) ->
        cursor = 0
        while cursor isnt '0'
          [cursor,values] = yield @redis.zscan key, cursor

          while values.length > 1
            value = values.shift()
            score = values.shift()
            try
              yield cb value, score
            catch error
              debug.dev "sorted_forEach cb on #{value}: #{error.stack ? error}"

        return

    module.exports = RedisInterface

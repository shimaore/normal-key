RedisInterface
==============

    seem = require 'seem'

    debug = (require 'tangible') 'normal-key:client'

    class RedisInterface
      constructor: (@redises) ->

      expiry: 4*3600

Meta-manipulators

      all: (cb) ->
        Promise.all @redises.map cb

      first: seem (cb) ->
        for redis in @redises
          try
            v = yield cb redis
            return v

Expire tool

      expire: (key) ->
        @all (redis) =>
          redis.expireAsync key, @expiry
            .catch -> yes

Properties
----------

      set: seem (key,name,value) ->
        if value?
          yield @all (redis) ->
            redis.hsetAsync key, name, value
              .catch -> yes
        else
          yield @all (redis) ->
            redis.hdelAsync key, name
              .catch -> yes

        yield @expire key

      get: (key,name) ->
        @first (redis) ->
          redis.getAsync key, name

      incr: seem (key,property,increment = 1) ->
        yield @all (redis) ->
          redis.hincrbyAsync key, property, increment
            .catch -> yes
        yield @expire key

      add: seem (key,value) ->
        return unless value?
        yield @all (redis) ->
          redis.saddAsync key, value
            .catch -> yes
        yield @expire key

      remove: seem (key,value) ->
        return unless value?
        yield @all (redis) ->
          redis.sremAsync key, value
            .catch -> yes
        yield @expire key

      has: (key,value) ->
        return unless value?
        @first (redis) ->
          redis.sismemberAsync key, value

      count: (key) ->
        @first (redis) ->
          redis.scardAsync key

      members: (key) ->
        @first (redis) ->
          redis.smembersAsync key

      clear: seem (key) ->
        yield @all (redis) ->
          redis.sinterstoreAsync key, "#{key}--emtpy-set--"
            .catch -> yes
        yield @expire key

      forEach: (key,cb) ->
        @first seem (redis) ->
          cursor = 0
          while cursor isnt '0'
            [cursor,keys] = yield redis.sscanAsync key, cursor
            for key in keys
              try
                yield cb key
              catch error
                debug.dev "forEach cb on #{key}: #{error.stack ? error}"
          return

      sorted_add: seem (key,value,score = 0) ->
        return unless value?
        yield @all (redis) ->
          redis.zaddAsync key, score, value
            .catch -> yes
        yield @expire key

      sorted_incr: seem (key,value,delta = 1) ->
        return unless value?
        yield @all (redis) ->
          redis.zincrbyAsync key, delta, value
            .catch -> yes
        yield @expire key

      sorted_remove: seem (key,value) ->
        return unless value?
        yield @all (redis) ->
          redis.zremAsync key, value
            .catch -> yes
        yield @expire key

      score: (key,value) ->
        return unless value?
        @first (redis) ->
          redis.zscoreAsync key, value

      sorted_count: (key) ->
        @first (redis) ->
          redis.zcardAsync key

      sorted_forEach: (key,cb) ->
        @first seem (redis) ->
          cursor = 0
          while cursor isnt '0'
            [cursor,values] = yield redis.zscanAsync key, cursor

            while values.length > 1
              key = values.shift()
              score = values.shift()
              try
                yield cb key, score
              catch error
                debug.dev "sorted_forEach cb on #{key}: #{error.stack ? error}"

          return

    module.exports = RedisInterface

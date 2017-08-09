RedisClient
===========

This is a base class, meant to be implemented in a child class that adds the `redis` field, which should be a RedisInterface instance.

    seem = require 'seem'

    class RedisClient
      constructor: (@class_name,@key) ->

        throw new Error "RedisClient expects class name as first parameter" unless @class_name?
        throw new Error "RedisClient expects key as second parameter" unless @key?

        @__property_key = "#{@class_name}-#{@key}-P"
        @__set_key = "#{@class_name}-#{@key}-S"
        @__zset_key = "#{@class_name}-#{@key}-Z"
        @__tag_key = "#{@class_name}-#{@key}-T"

Properties
----------

      get: (property) ->
        @redis.get @__property_key, property

      set: (property,value) ->
        @redis.set @__property_key, property, value

      reset: (property) ->
        @set property, 0

      incr: (property,increment = 1) ->
        @redis.incr @__property_key, property, increment

Set
---

      add: (value) ->
        @redis.add @__set_key, value

      remove: (value) ->
        @redis.remove @__set_key, value

      has: (value) ->
        @redis.has @__set_key, value

      count: ->
        @redis.count @__set_key

      clear: ->
        @redis.clear @__set_key

      forEach: (cb) ->
        @redis.forEach @__set_key, cb

Ordered-Set
---

      sorted_add: (value,score = 0) ->
        @redis.sorted_add @__zset_key, value, score

      sorted_incr: (value,delta = 1) ->
        @redis.sorted_incr @__zset_key, value, delta

      sorted_remove: (value) ->
        @redis.sorted_remove @__zset_key, value

      sorted_has: (value) ->
        if value?
          @score(value)?

      score: (value) ->
        @redis.score @__zset_key, value

      sorted_count: ->
        @redis.sorted_count @__zset_key

      sorted_forEach: seem (cb) ->
        @redis.sorted_forEach @__zset_key, cb

Tags
----

      add_tag: (tag) ->
        @redis.add @__tag_key, tag

      add_tags: (tags) ->
        if tags.length > 0
          @redis.add @__tag_key, tags

      del_tag: seem (tag) ->
        @redis.remove @__tag_key, tag

      clear_tags: seem ->
        @redis.clear @__tag_key

      tags: seem ->
        @redis.members @__tag_key

      has_tag: seem (tag) ->
        @redis.has @__tag_key, tag

    module.exports = RedisClient

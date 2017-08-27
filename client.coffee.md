RedisClient
===========

This is a base class, meant to be implemented in a child class that adds the `interface` field, which should be a RedisInterface instance.

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
        @interface.get @__property_key, property

      set: (property,value) ->
        @interface.set @__property_key, property, value

      reset: (property) ->
        @set property, 0

      incr: (property,increment = 1) ->
        @interface.incr @__property_key, property, increment

Set
---

      add: (value) ->
        @interface.add @__set_key, value

      remove: (value) ->
        @interface.remove @__set_key, value

      has: (value) ->
        @interface.has @__set_key, value

      count: ->
        @interface.count @__set_key

      clear: ->
        @interface.clear @__set_key

      forEach: (cb) ->
        @interface.forEach @__set_key, cb

Ordered-Set
---

      sorted_add: (value,score = 0) ->
        @interface.sorted_add @__zset_key, value, score

      sorted_incr: (value,delta = 1) ->
        @interface.sorted_incr @__zset_key, value, delta

      sorted_remove: (value) ->
        @interface.sorted_remove @__zset_key, value

      sorted_has: (value) ->
        if value?
          @score(value)?

      score: (value) ->
        @interface.score @__zset_key, value

      sorted_count: ->
        @interface.sorted_count @__zset_key

      sorted_forEach: (cb) ->
        @interface.sorted_forEach @__zset_key, cb

Tags
----

      add_tag: (tag) ->
        @interface.add @__tag_key, tag

      add_tags: (tags) ->
        if tags.length > 0
          @interface.add @__tag_key, tags

      del_tag: (tag) ->
        @interface.remove @__tag_key, tag

      clear_tags: ->
        @interface.clear @__tag_key

      tags: ->
        @interface.members @__tag_key

      has_tag: (tag) ->
        @interface.has @__tag_key, tag

    module.exports = RedisClient

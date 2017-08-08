// Generated by CoffeeScript 1.12.7
(function() {
  var RedisClient, seem;

  seem = require('seem');

  RedisClient = (function() {
    function RedisClient(class_name, key) {
      this.class_name = class_name;
      this.key = key;
      debug('new RedisClient', this.class_name, this.key);
      if (this.class_name == null) {
        throw new Error("RedisClient expects class name as first parameter");
      }
      if (this.key == null) {
        throw new Error("RedisClient expects key as second parameter");
      }
      this.__property_key = this.class_name + "-" + this.key + "-P";
      this.__set_key = this.class_name + "-" + this.key + "-S";
      this.__zset_key = this.class_name + "-" + this.key + "-Z";
      this.__tag_key = this.class_name + "-" + this.key + "-T";
    }

    RedisClient.prototype.get = function(property) {
      return this.redis.get(this.__property_key, property);
    };

    RedisClient.prototype.set = function(property, value) {
      return this.redis.set(this.__property_key, property, value);
    };

    RedisClient.prototype.reset = function(property) {
      return this.set(property, 0);
    };

    RedisClient.prototype.incr = function(property, increment) {
      if (increment == null) {
        increment = 1;
      }
      return this.redis.incr(this.__property_key, property, increment);
    };

    RedisClient.prototype.add = function(value) {
      return this.redis.add(this.__set_key, value);
    };

    RedisClient.prototype.remove = function(value) {
      return this.redis.remove(this.__set_key, value);
    };

    RedisClient.prototype.has = function(value) {
      return this.redis.has(this.__set_key, value);
    };

    RedisClient.prototype.count = function() {
      return this.redis.count(this.__set_key);
    };

    RedisClient.prototype.clear = function() {
      return this.redis.clear(this.__set_key);
    };

    RedisClient.prototype.forEach = seem(function(cb) {
      return this.redis.forEach(this.__set_key, cb);
    });

    RedisClient.prototype.sorted_add = function(value, score) {
      if (score == null) {
        score = 0;
      }
      return this.redis.sorted_add(this.__zset_key, score, value);
    };

    RedisClient.prototype.sorted_incr = function(value, delta) {
      if (delta == null) {
        delta = 1;
      }
      return this.redis.sorted_incr(this.__zset_key, delta, value);
    };

    RedisClient.prototype.sorted_remove = function(value) {
      return this.redis.sorted_remove(this.__zset_key, value);
    };

    RedisClient.prototype.sorted_has = function(value) {
      if (value != null) {
        return this.score(value) != null;
      }
    };

    RedisClient.prototype.score = function(value) {
      return this.redis.score(this.__zset_key, value);
    };

    RedisClient.prototype.sorted_count = function() {
      return this.redis.sorted_count(this.__zset_key);
    };

    RedisClient.prototype.sorted_forEach = seem(function(cb) {
      return this.redis.sorted_forEach(this.__zset_key, cb);
    });

    RedisClient.prototype.add_tag = function(tag) {
      return this.redis.add(this.__tag_key, tag);
    };

    RedisClient.prototype.add_tags = function(tags) {
      if (tags.length > 0) {
        return this.redis.add(this.__tag_key, tags);
      }
    };

    RedisClient.prototype.del_tag = seem(function(tag) {
      return this.redis.remove(this.__tag_key, tag);
    });

    RedisClient.prototype.clear_tags = seem(function() {
      return this.redis.clear(this.__tag_key);
    });

    RedisClient.prototype.tags = seem(function() {
      return this.redis.members(this.__tag_key);
    });

    RedisClient.prototype.has_tag = seem(function(tag) {
      return this.redis.has(this.__tag_key, tag);
    });

    return RedisClient;

  })();

  module.exports = RedisClient;

}).call(this);

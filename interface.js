// Generated by CoffeeScript 1.12.7
(function() {
  var RedisInterface, debug, default_timeout, seem,
    slice = [].slice;

  seem = require('seem');

  debug = (require('tangible'))('normal-key:interface');

  default_timeout = 24 * 3600;

  RedisInterface = (function() {
    function RedisInterface(redis, __timeout) {
      this.redis = redis;
      this.__timeout = __timeout != null ? __timeout : default_timeout;
      this.redis.defineCommand('transition', {
        numberOfKeys: 1,
        lua: "local key = KEYS[1]\nlocal old_value = ARGV[1]\nlocal new_value = ARGV[2]\nlocal current_value = redis.call('get',key)\nif current_value == old_value or (current_value == false and old_value == '')\nthen\n  if new_value == '' then\n    return redis.call('del',key)\n  else\n    return redis.call('setex',key," + this.__timeout + ",new_value)\n  end\nelse\n  return redis.error_reply('Current value `'..current_value..'` does not match `'..old_value..'`.')\nend"
      });
    }

    RedisInterface.prototype.timeout = function(timeout) {
      var self;
      return self = new RedisInterface(this.redis, timeout);
    };

    RedisInterface.prototype.multi = seem(function*() {
      var args, key, op, result;
      op = arguments[0], key = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      result = (yield this.redis.multi([[op, key].concat(slice.call(args)), ['expire', key, this.__timeout]]).exec()["catch"](function(err) {
        if (err.previousErrors != null) {
          return Promise.reject(new Error(err.previousErrors[0].message));
        }
      }));
      return result[0][1];
    });

    RedisInterface.prototype.set = function(key, name, value) {
      if (value != null) {
        return this.multi('hset', key, name, value);
      } else {
        return this.redis.hdel(key, name);
      }
    };

    RedisInterface.prototype.get = function(key, name) {
      return this.redis.hget(key, name);
    };

    RedisInterface.prototype.incr = function(key, name, increment) {
      if (increment == null) {
        increment = 1;
      }
      return this.multi('hincrby', key, name, increment);
    };

    RedisInterface.prototype.transition = function(key, old_value, new_value) {
      return this.redis.transition(key, old_value, new_value);
    };

    RedisInterface.prototype.mapping = seem(function*(key) {
      var cursor, elements, i, k, len, ref, ref1, result, v;
      result = {};
      cursor = 0;
      while (cursor !== '0') {
        ref = (yield this.redis.hscan(key, cursor)), cursor = ref[0], elements = ref[1];
        for (i = 0, len = elements.length; i < len; i++) {
          ref1 = elements[i], k = ref1[0], v = ref1[1];
          result[k] = v;
        }
      }
      return result;
    });

    RedisInterface.prototype.add = function(key, value) {
      if (value == null) {
        return;
      }
      return this.multi('sadd', key, value);
    };

    RedisInterface.prototype.remove = function(key, value) {
      if (value == null) {
        return;
      }
      return this.multi('srem', key, value);
    };

    RedisInterface.prototype.has = seem(function*(key, value) {
      var it;
      if (value == null) {
        return;
      }
      it = (yield this.redis.sismember(key, value));
      if (it === 1) {
        return true;
      } else {
        return false;
      }
    });

    RedisInterface.prototype.count = function(key) {
      return this.redis.scard(key);
    };

    RedisInterface.prototype.members = function(key) {
      return this.redis.smembers(key);
    };

    RedisInterface.prototype.clear = function(key) {
      return this.redis.sinterstore(key, key + "--emtpy-set--");
    };

    RedisInterface.prototype.forEach = seem(function*(key, cb) {
      var cursor, error, foo, i, len, ref, ref1, value, values;
      cursor = 0;
      while (cursor !== '0') {
        ref = foo = (yield this.redis.sscan(key, cursor)), cursor = ref[0], values = ref[1];
        for (i = 0, len = values.length; i < len; i++) {
          value = values[i];
          try {
            yield cb(value);
          } catch (error1) {
            error = error1;
            debug.dev("forEach cb on " + value + ": " + ((ref1 = error.stack) != null ? ref1 : error));
          }
        }
      }
    });

    RedisInterface.prototype.sorted_add = function(key, value, score) {
      if (score == null) {
        score = 0;
      }
      if (value == null) {
        return;
      }
      return this.multi('zadd', key, score, value);
    };

    RedisInterface.prototype.sorted_incr = function(key, value, delta) {
      if (delta == null) {
        delta = 1;
      }
      if (value == null) {
        return;
      }
      return this.multi('zincrby', key, delta, value);
    };

    RedisInterface.prototype.sorted_remove = function(key, value) {
      if (value == null) {
        return;
      }
      return this.multi('zrem', key, value);
    };

    RedisInterface.prototype.score = seem(function*(key, value) {
      if (value == null) {
        return;
      }
      return parseFloat((yield this.redis.zscore(key, value)));
    });

    RedisInterface.prototype.sorted_count = function(key) {
      return this.redis.zcard(key);
    };

    RedisInterface.prototype.sorted_forEach = seem(function*(key, cb) {
      var cursor, error, ref, ref1, score, value, values;
      cursor = 0;
      while (cursor !== '0') {
        ref = (yield this.redis.zscan(key, cursor)), cursor = ref[0], values = ref[1];
        while (values.length > 1) {
          value = values.shift();
          score = values.shift();
          try {
            yield cb(value, score);
          } catch (error1) {
            error = error1;
            debug.dev("sorted_forEach cb on " + value + ": " + ((ref1 = error.stack) != null ? ref1 : error));
          }
        }
      }
    });

    return RedisInterface;

  })();

  module.exports = RedisInterface;

}).call(this);

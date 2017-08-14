Do `docker run -p 127.0.0.1:6379:6379 redis`, for example, before starting this test.

    seem = require 'seem'
    (require 'chai').should()

    describe 'When Redis is running', ->
      Redis = require 'ioredis'
      {RedisClient,RedisInterface} = require '..'

      redis = new RedisInterface [r = new Redis()]
      class TestClient extends RedisClient
        redis: redis

      cleanup = seem ->
        client = new TestClient 'Builder', 'Bob'
        yield r.del client.__property_key
        yield r.del client.__set_key
        yield r.del client.__zset_key
        yield r.del client.__tag_key
      before cleanup
      after cleanup

      it 'should set', ->
        client = new TestClient 'Builder', 'Bob'
        client.set 'age', 35

      it 'should get', seem ->
        client = new TestClient 'Builder', 'Bob'
        age = yield client.get 'age'
        age.should.equal '35'

      it 'should add tags', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.add_tag 'hat:yellow'
        yield client.add_tag 'can-we-do-it:yes'

      it 'should retrieve tags', seem ->
        client = new TestClient 'Builder', 'Bob'
        can_we_do_it = yield client.has_tag 'can-we-do-it:yes'
        can_we_do_it.should.be.true
        has_yellow_hat = yield client.has_tag 'hat:yellow'
        has_yellow_hat.should.be.true
        has_purple_hat = yield client.has_tag 'hat:purple'
        has_purple_hat.should.be.false

      it 'should s-insert', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.add 'hammer'
        yield client.add 'hammer'
        yield client.add 'screwdriver'

      it 'should s-count', seem ->
        client = new TestClient 'Builder', 'Bob'
        tools = yield client.count()
        tools.should.equal 2

      it 'should z-insert', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'screwdriver'

      it 'should z-count', seem ->
        client = new TestClient 'Builder', 'Bob'
        tools = yield r.zcard 'Builder-Bob-Z'
        tools.should.equal 2
        tools = yield client.sorted_count()
        tools.should.equal 2

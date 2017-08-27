Do `docker run -p 127.0.0.1:6379:6379 redis`, for example, before starting this test.

    seem = require 'seem'
    (chai = require 'chai').should()

    describe 'When Redis is running', ->
      Redis = require 'ioredis'
      {RedisClient,RedisInterface} = require '..'

      r = new Redis()
      i = new RedisInterface r
      class TestClient extends RedisClient
        interface: i

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
        client.set 'age', 35
        (yield client.get 'age').should.equal '35'
        yield client.incr 'age'
        (yield client.get 'age').should.equal '36'
        yield client.incr 'age', 7
        (yield client.get 'age').should.equal '43'
        yield client.reset 'age'
        (yield client.get 'age').should.equal '0'
        yield client.incr 'age', 43
        (yield client.get 'age').should.equal '43'
        yield client.set 'age', null
        chai.expect(yield client.get 'age').to.be.null
        yield client.incr 'age', 42
        (yield client.get 'age').should.equal '42'

      it 'should add tags', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.add_tag 'hat:yellow'
        yield client.add_tag 'can-we-do-it:yes'

      it 'should retrieve tags', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.clear_tags()
        (yield client.interface.count client.__tag_key).should.equal 0

        yield client.add_tag 'hat:yellow'
        yield client.add_tag 'can-we-do-it:yes'
        (yield client.has_tag 'can-we-do-it:yes').should.be.true
        (yield client.has_tag 'hat:yellow').should.be.true
        (yield client.has_tag 'hat:purple').should.be.false

        yield client.add_tags ['hat:blue','builder:true']
        (yield client.has_tag 'hat:blue').should.be.true
        (yield client.interface.count client.__tag_key).should.equal 4
        tags = yield client.tags()
        tags.should.have.length 4

        yield client.del_tag 'hat:red'
        (yield client.has_tag 'hat:blue').should.be.true
        (yield client.interface.count client.__tag_key).should.equal 4
        tags = yield client.tags()
        tags.should.have.length 4

        yield client.del_tag 'hat:blue'
        (yield client.has_tag 'hat:blue').should.be.false
        (yield client.interface.count client.__tag_key).should.equal 3
        tags = yield client.tags()
        tags.should.have.length 3

        yield client.clear_tags()
        (yield client.tags()).should.be.empty
        (yield client.interface.count client.__tag_key).should.equal 0

      it 'should s-insert', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.add 'hammer'
        yield client.add 'hammer'
        yield client.add 'screwdriver'

      it 'should s-count', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.clear()
        tools = yield client.count()
        tools.should.equal 0
        yield client.add 'hammer'
        yield client.add 'hammer'
        yield client.add 'screwdriver'
        (yield client.has 'hammer').should.be.true
        (yield client.has 'screwdriver').should.be.true
        (yield client.has 'hardhat').should.be.false
        tools = yield client.count()
        tools.should.equal 2
        yield client.add 'hardhat'
        (yield client.has 'hardhat').should.be.true
        tools = yield client.count()
        tools.should.equal 3
        yield client.remove 'hammer'
        (yield client.has 'hammer').should.be.false
        (yield client.has 'screwdriver').should.be.true
        (yield client.has 'hardhat').should.be.true
        tools = yield client.count()
        tools.should.equal 2
        yield client.forEach (x) -> client.remove x
        tools = yield client.count()
        tools.should.equal 0

      it 'should z-insert', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'screwdriver'

      it 'should z-count', seem ->
        client = new TestClient 'Builder', 'Bob'
        yield client.sorted_forEach (x) ->
          client.sorted_remove x
        (yield client.sorted_count()).should.equal 0
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'hammer'
        yield client.sorted_add 'screwdriver'
        tools = yield r.zcard 'Builder-Bob-Z'
        tools.should.equal 2
        tools = yield client.sorted_count()
        tools.should.equal 2
        yield client.sorted_incr 'screwdriver'
        (yield client.score 'hammer').should.equal 0
        (yield client.score 'screwdriver').should.equal 1

Do `docker run -p 127.0.0.1:6379:6379 redis`, for example, before starting this test.

    ({expect} = chai = require 'chai').should()

    describe 'When Redis is running', ->
      Redis = require 'ioredis'
      {RedisClient,RedisInterface} = require '..'

      r = new Redis()
      i = new RedisInterface r
      class TestClient extends RedisClient
        interface: i

      cleanup = ->
        client = new TestClient 'Builder', 'Bob'
        await r.del client.__property_key
        await r.del client.__set_key
        await r.del client.__zset_key
        await r.del client.__tag_key
        await r.del client.__state_key
      before cleanup
      after cleanup
      after -> r.end()

      it 'should set', ->
        client = new TestClient 'Builder', 'Bob'
        client.set 'age', 35

      it 'should get', ->
        client = new TestClient 'Builder', 'Bob'
        client.set 'age', 35
        (await client.get 'age').should.equal '35'
        await client.incr 'age'
        (await client.get 'age').should.equal '36'
        await client.incr 'age', 7
        (await client.get 'age').should.equal '43'
        await client.reset 'age'
        (await client.get 'age').should.equal '0'
        await client.incr 'age', 43
        (await client.get 'age').should.equal '43'
        await client.set 'age', null
        chai.expect(await client.get 'age').to.be.null
        await client.incr 'age', 42
        (await client.get 'age').should.equal '42'

      it 'should add tags', ->
        client = new TestClient 'Builder', 'Bob'
        await client.add_tag 'hat:yellow'
        await client.add_tag 'can-we-do-it:yes'

      it 'should retrieve tags', ->
        client = new TestClient 'Builder', 'Bob'
        await client.clear_tags()
        (await client.interface.count client.__tag_key).should.equal 0

        await client.add_tag 'hat:yellow'
        await client.add_tag 'can-we-do-it:yes'
        (await client.has_tag 'can-we-do-it:yes').should.be.true
        (await client.has_tag 'hat:yellow').should.be.true
        (await client.has_tag 'hat:purple').should.be.false

        await client.add_tags ['hat:blue','builder:true']
        (await client.has_tag 'hat:blue').should.be.true
        (await client.interface.count client.__tag_key).should.equal 4
        tags = await client.tags()
        tags.should.have.length 4

        await client.del_tag 'hat:red'
        (await client.has_tag 'hat:blue').should.be.true
        (await client.interface.count client.__tag_key).should.equal 4
        tags = await client.tags()
        tags.should.have.length 4

        await client.del_tag 'hat:blue'
        (await client.has_tag 'hat:blue').should.be.false
        (await client.interface.count client.__tag_key).should.equal 3
        tags = await client.tags()
        tags.should.have.length 3

        await client.clear_tags()
        (await client.tags()).should.be.empty
        (await client.interface.count client.__tag_key).should.equal 0

      it 'should s-insert', ->
        client = new TestClient 'Builder', 'Bob'
        await client.add 'hammer'
        await client.add 'hammer'
        await client.add 'screwdriver'

      it 'should s-count', ->
        client = new TestClient 'Builder', 'Bob'
        await client.clear()
        tools = await client.count()
        tools.should.equal 0
        await client.add 'hammer'
        await client.add 'hammer'
        await client.add 'screwdriver'
        (await client.has 'hammer').should.be.true
        (await client.has 'screwdriver').should.be.true
        (await client.has 'hardhat').should.be.false
        tools = await client.count()
        tools.should.equal 2
        await client.add 'hardhat'
        (await client.has 'hardhat').should.be.true
        tools = await client.count()
        tools.should.equal 3
        await client.remove 'hammer'
        (await client.has 'hammer').should.be.false
        (await client.has 'screwdriver').should.be.true
        (await client.has 'hardhat').should.be.true
        tools = await client.count()
        tools.should.equal 2
        await client.forEach (x) -> client.remove x
        tools = await client.count()
        tools.should.equal 0

      it 'should z-insert', ->
        client = new TestClient 'Builder', 'Bob'
        await client.sorted_add 'hammer'
        await client.sorted_add 'hammer'
        await client.sorted_add 'screwdriver'

      it 'should z-count', ->
        client = new TestClient 'Builder', 'Bob'
        await client.sorted_forEach (x) ->
          client.sorted_remove x
        (await client.sorted_count()).should.equal 0
        await client.sorted_add 'hammer'
        await client.sorted_add 'hammer'
        await client.sorted_add 'screwdriver'
        tools = await r.zcard 'Builder-Bob-Z'
        tools.should.equal 2
        tools = await client.sorted_count()
        tools.should.equal 2
        await client.sorted_incr 'screwdriver'
        (await client.score 'hammer').should.equal 0
        (await client.score 'screwdriver').should.equal 1

      it 'should transition', ->
        client = new  TestClient 'Builder', 'Bob'
        expect(await client.state()).to.be.null
        outcome = await client.transition_state null, 'new'
        outcome.should.equal 'OK'
        (await client.state()).should.equal 'new'
        try
          outcome = await client.transition_state null, 'new'
          outcome.should.equal 'OK'
        catch error
          error.message.should.equal 'Current value `new` does not match ``.'
        (await client.state()).should.equal 'new'
        await client.transition_state 'new', 'newer'
        (await client.state()).should.equal 'newer'
        await client.transition_state 'newer', 'final'
        (await client.state()).should.equal 'final'
        await client.transition_state 'final', null
        expect(await client.state()).to.be.null
        await client.transition_state null, 'new'
        (await client.state()).should.equal 'new'
        await client.transition_state 'new', null
        expect(await client.state()).to.be.null
        await client.transition_state '', null
        expect(await client.state()).to.be.null
        await client.transition_state null, null
        expect(await client.state()).to.be.null
        await client.transition_state null, ''
        expect(await client.state()).to.be.null
        await client.transition_state '', 'new'
        (await client.state()).should.equal 'new'

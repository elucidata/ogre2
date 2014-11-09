var Ogre= require('../'), type= require('elucidata-type'),
    // test= require('prova')
    test= require('tape')


test( 'Basic tests', function( t ){

  t.notEqual( Ogre, null, "exported value is not null" )
  t.equal( typeof Ogre, 'function', "exported value is a function" )

  t.end()
})


test( '.get() returns correct values', function(t){
  var src= { name:'Ogre', info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  t.equal( src, ds.get(), "returned value is the same object.")
  t.equal( ds.get('info.version'), 2, 'simple key path traversal')
  t.equal( ds.get('info.more.extra.value'), 'STUFF', 'deeply nested key path traversal')
  t.equal( ds.get('info.more.extra'), src.info.more.extra, 'object fetched is same as source, if unchanged')

  t.end()
})

test( '.set() only modifies changed objects', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  ds.set('info.more.extra.value', 'New')

  t.notEqual( ds.get(), src, 'returned value is a new object.')
  t.equal( ds.get('peer'), src.peer, 'unchanged branch is still the same object')
  t.notEqual( ds.get('info.more.extra'), src.info.more.extra, 'changed branch is new object')

  t.end()
})


test( '.onChange() events are fired', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  t.plan( 1 )

  ds.onChange(function(keys){
    t.deepEqual( keys, ['info.more.extra.value'], "event fired with correct changed key array")
  })

  ds.set('info.more.extra.value', 'New')
})


test( '.onChange() events are fired in a batch fashion', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  t.plan( 1 )

  ds.onChange(function(keys){
    t.deepEqual( keys, ['info.more.extra.value', 'peer.name'], "event fired with correct changed key array")
  })

  ds.set('info.more.extra.value', 'New')
  ds.set('peer.name', 'New')
})


test( '.onChange() events are fired individually if configured so', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src, { batchChanges:false })

  t.plan( 3 )

  ds.onChange(function(keys){
    t.equal(keys.length, 1, "onChange triggered with single changed key")
    // t.pass("single onChange triggered")
    // t.deepEqual( keys, ['info.more.extra.value', 'peer.name'], "event fired with correct changed key array")
  })

  ds.set('info.more.extra.value', 'New')
  ds.set('peer.name', 'New')
  ds.set('info.more.extra.value', 'Really New')
})

test('.offChange() should unsubscribe handler from events', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src),
      callback= function(keys) {
        t.deepEqual( keys, ['info.more.extra.value', 'peer.name'], "event fired with correct changed key array")
      }

  t.plan( 2 )

  ds.onChange( callback )

  ds.set('info.more.extra.value', 'New')
  ds.set('peer.name', 'New')

  // Since we're batching calls, we can't unsubscribe on this tick.
  setTimeout(function(){
      ds.offChange( callback )
      ds.set('peer.name', "Really New!")
      t.pass('unsubscribed')
  },1)


})

test( 'strict mode fails to create missing key paths', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  t.plan( 1 )

  t.throws(function(){
      ds.set('made.up.non.existant.path', 'YES')
  })

})


test( 'non-strict mode creates missing key paths', function(t){
  var src= { name:'Ogre', peer:{ name:'Uh huh' }, info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src, { strict: false })

  t.plan(8)

  t.doesNotThrow(function(){
      ds.set('made.up.non.existant.path', 'YES')
      t.equal( ds.get('made.up.non.existant.path'), 'YES', "new value is set")
  })

  ds.set('test.set', 'VALUE')
  ds.set('test.set2', { value:'VALUE' })
  ds.merge('test.merge', { value:'VALUE' })
  ds.push('test.push', 'VALUE')
  ds.unshift('test.unshift', "VALUE")
  ds.splice('test.splice', 1, 0, "VALUE")

  t.equal( type(ds.get('test.set')), 'string', 'result of set is string')
  t.equal( type(ds.get('test.set2')), 'object', 'result of set is object')
  t.equal( type(ds.get('test.merge')), 'object', 'result of merge is object')
  t.equal( type(ds.get('test.push')), 'array', 'result of push is array')
  t.equal( type(ds.get('test.unshift')), 'array', 'result of unshift is array')
  t.equal( type(ds.get('test.splice')), 'array', 'result of splice is array')

})

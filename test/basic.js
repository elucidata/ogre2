var Ogre= require('../'),
    // test= require('prova')
    test= require('tape')


test( 'Basic tests', function( t ){

  t.notEqual( Ogre, null, "exported value is not null" )
  t.equal( typeof Ogre, 'function', "exported value is a function" )

  t.end()
})

// test( '.get() returns source', function(t){
//   var src= { name:'Ogre' },
//       ds= new Ogre(src)
//
//
//
//   t.end()
// })


test( 'Base .get() tests', function(t){
  var src= { name:'Ogre', info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
      ds= new Ogre(src)

  t.equal( src, ds.get(), "returned value is the same object.")
  t.equal( ds.get('info.version'), 2, 'nested data is the same object')
  t.equal( ds.get('info.more.extra.value'), 'STUFF', 'nested data is the same object')
  t.equal( ds.get('info.more.extra'), src.info.more.extra, 'nested data is the same object')

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

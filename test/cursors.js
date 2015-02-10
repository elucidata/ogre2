var Ogre= require('../'),
    Cursor= require('../lib/cursor'),
    type= require('elucidata-type'),
    // test= require('prova')
    test= require('tape'),
    _= require( './_helpers')

function testx(){}

test( 'Basic cursor tests', function( t ){

  t.notEqual( Ogre, null, "exported value is not null" )
  t.equal( typeof Ogre, 'function', "exported value is a function" )

  test( '.scopeTo( path)', function(t){
    var src= { name:'Ogre', info:{ version:2, more:{ extra:{ value:'STUFF' } }} },
        ds= new Ogre(src)

    t.ok( ds.scopeTo, "exists" )

    t.end()
  })


  t.end()
})

test( 'Sub-tree modification via Cursor.set()', function( t){
  var src= new Ogre({ left:{}, right:{}, middle:{} }, { strict:false }),
      left= src.scopeTo( 'left'),
      right= src.scopeTo( 'right')

  t.ok( left, 'Left cursor created.')
  t.ok( right, 'Right cursor created.')

  t.ok( left.get(), 'Left.get() returns non-empty object.')
  t.ok( right.get(), 'Right.get() returns non-empty object.')

  src.set( 'middle.name', 'Something')

  t.equal( left.get(), src.get( 'left'), 'Sub-tree unaffected by unrelated change.')
  t.equal( right.get(), src.get( 'right'), 'Sub-tree unaffected by unrelated change.')

  var left_value= 'LEFT VALUE'
  left.set( left_value)
  t.equal( src.get( 'left'), left_value, 'String value. Sub-tree correctly modifies root tree.')

  left_value= 42
  left.set( left_value)
  t.equal( src.get( 'left'), left_value, 'Number value. Sub-tree correctly modifies root tree.')

  left_value= null
  left.set( left_value)
  t.equal( src.get( 'left'), left_value, 'Null value. Sub-tree correctly modifies root tree.')


  var right_value= { label:'RIGHT VALUE'}
  right.set( right_value)
  t.equal( src.get( 'right'), right_value, 'Object value. Sub-tree correctly modifies root tree.')

  right_value= ''
  right.set( right_value)
  t.equal( src.get( 'right'), right_value, 'Empty string value. Sub-tree correctly modifies root tree.')

  right_value= ['left', 'value']
  right.set( right_value)
  t.equal( src.get( 'right'), right_value, 'Array value. Sub-tree correctly modifies root tree.')

  right.push(['new'])
  t.equal( src.get( 'right.length'), 3, 'Array value. Sub-tree correctly modifies root tree.')

  right.push({})
  t.ok( src.get( 'right'), 'Empty object. Sub-tree correctly modifies root tree.')

  right.set({})
  left.set({})


left_value= 'LEFT VALUE'
left.set( 'child', left_value)
t.equal( src.get( 'left.child'), left_value, 'Pathed String value. Sub-tree correctly modifies root tree.')

left_value= 42
left.set( 'child', left_value)
t.equal( src.get( 'left.child'), left_value, 'Pathed Number value. Sub-tree correctly modifies root tree.')

left_value= null
left.set( 'child', left_value)
t.equal( src.get( 'left.child'), left_value, 'Pathed Null value. Sub-tree correctly modifies root tree.')

left.set({})
left_value= 'Hello'
left.set( 'child.much.deeper', left_value)
t.equal( src.get( 'left.child.much.deeper'), left_value, 'Deeply pathed string value. Sub-tree correctly modifies root tree.')


right_value= { label:'RIGHT VALUE'}
right.set( 'child', right_value)
t.equal( src.get( 'right.child'), right_value, 'Pathed Object value. Sub-tree correctly modifies root tree.')

right_value= ''
right.set( 'child', right_value)
t.equal( src.get( 'right.child'), right_value, 'Pathed Empty string value. Sub-tree correctly modifies root tree.')

right_value= ['left', 'value']
right.set( 'child', right_value)
t.equal( src.get( 'right.child'), right_value, 'Pathed Array value. Sub-tree correctly modifies root tree.')

right.push('child', ['new'])
t.equal( src.get( 'right.child.length'), 3, 'Pathed Array value. Sub-tree correctly modifies root tree.')

  t.end()
})

test( 'Sub-tree events (extracted from app)', function ( t){
  t.plan( 14 )

  var src= new Ogre({
        peer1: {
          name: 'p1'
        },
        peer2: {
          name: 'p2'
        }
      }, { strict:false}),
      _root_count= 0,
      _p1_count= 0,
      _p2_count= 0

  function root_onChange( keys){
    // console.log('orge.onChange', keys)
    _root_count += 1
    t.ok( keys, 'root onChange')
  }
  src.onChange( root_onChange)



  var p1= src.scopeTo( 'peer1'),
      p2= src.scopeTo( 'peer2'),
      p22= src.scopeTo( 'peer2')

  function peer1_onChange( keys){
    _p1_count += 1
    t.ok( keys, 'peer1 onChange')
    // console.log( 'peer1.onChange', keys)
  }
  p1.onChange( peer1_onChange)

  function peer2_onChange( keys){
    _p2_count += 1
    t.ok( keys, 'peer2 onChange')
    // console.log( 'peer2.onChange', keys)
  }
  p2.onChange( peer2_onChange)

  // p22.onChange(function(){
  //   console.log( ">>>>>>>>>>>> Second call")
  //   console.log( Cursor.listenerInfo( true))
  // })

  src.set( 'peer1.name', 'TEST')
  src.set( 'peer2.name', 'SHIT')

  setTimeout(function(){
    src.set('other.stuff', 'JUNK')
  }, 100)

  setTimeout(function(){
    src.set('peer1.has.stuff', 'JUNK')
  }, 200)

  setTimeout(function(){
    src.set('peer2.has.more.stuff', 'JUNK')
  }, 300)

  setTimeout(function(){
    var expected= { totalEventHandlers: 2, totalKeyWatches: 2, totalSources: 1 }
    t.deepLooseEqual( Cursor.listenerInfo(), expected)
    t.equal( src.$Ogre_emitter._events.change.length, 2, 'only two listeners on the source object' )

    src.offChange( root_onChange)
    t.equal( src.$Ogre_emitter._events.change.length, 1, 'now only one' )

    t.deepLooseEqual( Cursor.listenerInfo(), expected)

    p1.offChange( peer1_onChange)

    expected= { totalEventHandlers: 1, totalKeyWatches: 1, totalSources: 1 }
    t.deepLooseEqual( Cursor.listenerInfo(), expected)

    p2.offChange( peer2_onChange)

    expected= { totalEventHandlers: 0, totalKeyWatches: 0, totalSources: 0 }
    t.deepLooseEqual( Cursor.listenerInfo(), expected)
  }, 400)

})

test( 'test cursor change events', function( t){
  var src= new Ogre({
        peer1: {
          name: 'p1'
        },
        peer2: {
          name: 'p2'
        }
      }, { strict:false, batchChanges:false}),
      peer1= src.scopeTo( 'peer1'),
      peer2= src.scopeTo( 'peer2')

  function changed(target, keys) {
    t.ok( keys, target+ ' keys changed: '+ keys.join(', '))
    // console.log('> changed', key)
  }

  t.plan( 5)

  src.onChange( changed.bind(this, 'root'))
  peer1.onChange( changed.bind(this, 'peer1'))
  peer2.onChange( changed.bind(this, 'peer2'))

  // console.log(">> src.set('unrelated', 'value')")
  src.set('unrelated', 'value') // 1

  // console.log(">> peer1.set('name', 'updated')")
  peer1.set('name', 'updated') // 2

  // console.log(">> peer2.set('name', 'updated')")
  peer2.set('name', 'updated') // 2

})

test( 'test object-like mutators', function( t){
  var src= new Ogre({ child:{ left:{}, right:{} } }, { strict:false }),
      cursor= src.scopeTo( 'child')
  _.test_object( cursor, t)
})

test( 'test array-like mutators', function( t){
  var src= new Ogre({ child:{ left:{}, right:{} } }, { strict:false }),
      cursor= src.scopeTo( 'child')
  _.test_array( cursor, t)
})


test( 'test query methods', function( t){
  var src= new Ogre({ child:{ left:{}, right:{} } }, { strict:false }),
      cursor= src.scopeTo( 'child')
  _.test_query( cursor, t)
})

test( 'test other methods', function( t){
  var src= new Ogre({ child:{ left:{}, right:{} } }, { strict:false }),
      cursor= src.scopeTo( 'child')
  _.test_other( cursor, t)
})

test( 'test array key methods', function( t){
  var src= new Ogre({ child:{ left:{}, right:{} } }, { strict:false }),
      cursor= src.scopeTo( 'child')
  _.test_array_keys( cursor, t)
})

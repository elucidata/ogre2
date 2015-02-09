var type= require( 'elucidata-type')

function test_object( ds, t) {

  ds.set('misc', 'ITEM')
  t.equal( ds.get('misc'), 'ITEM')

  ds.merge('left', { name:'MID'})
  t.equal( ds.get('left.name'), 'MID')

  t.end()
}

function test_array( ds, t) {
  // ds.set( 'list', [])
  ds.push('list', 'hello')
  ds.push('list', 1)
  t.equal( ds.get('list.length'), 2)

  ds.splice('list', 0, 1)
  t.equal( ds.get('list.length'), 1)

  ds.unshift('list', 'new')
  t.equal( ds.get('list.length'), 2)

  t.equal( ds.get('list.0'), 'new')

  t.end()
}

function test_query( ds, t) {
  t.plan(15)

  ds.push('list', ['a','b','c','d'])
  t.equal( ds.get('list.length'), 4)
  ds.each( 'list', function( val){
    t.ok( val)
  })


  ds.push('list2', [1,2,3,4])
  t.equal( ds.get('list2.length'), 4)
  var r= ds.map( 'list2', function( val){
    t.ok( val)
    return val + 1
  })
  t.deepLooseEqual(r, [2,3,4,5])
  t.deepLooseEqual( ds.get('list2'), [1,2,3,4])
  var f= ds.filter( 'list2', function(val){
    return val > 2
  })

  t.deepLooseEqual(f, [3,4])

  var ff= ds.find( 'list2', function(val){
    return val > 2
  })

  t.equal(ff, 3)

  var i= ds.indexOf( 'list', 'b')
  t.equal(i, 1)
  // t.end()
}

function test_other( ds, t) {
  if( ds.source) {
    // Cursor
    ds.set('value')
    t.equal( ds.get(), 'value', 'set( string) on cursor')

    var value= ['item']
    ds.set(value)
    t.equal( ds.get(), value, 'set( array) on cursor')

    value= {}
    ds.set(value)
    t.equal( ds.get(), value, 'set( object) on cursor')

    value= { hello:'hello'}
    ds.merge(value)
    t.deepLooseEqual( ds.get(), value, 'merge( object) on cursor')

    value= { bob:'Robert'}
    ds.merge(value)
    t.deepLooseEqual( ds.get(), { hello:'hello', bob:'Robert'}, 'merge( object) on cursor')

    value= 10
    ds.set(value)
    t.equal( ds.get(), value, 'set( number) on cursor')

    value= true
    ds.set(value)
    t.equal( ds.get(), value, 'set( boolean) on cursor')

    value= null
    ds.set(value)
    t.equal( ds.get(), value, 'set( null) on cursor')

    value= []
    ds.set(value)
    t.equal( ds.get(), value, 'set( empty_array) on cursor')

    value= 'item'
    ds.push( value)
    t.equal( type( ds.get()), 'array', 'push( string) on cursor')
    t.deepLooseEqual( ds.get(), ['item'])
    t.equal( ds.get('length'), 1)

    value= 'item2'
    ds.unshift( value)
    t.deepLooseEqual( ds.get(), ['item2', 'item'])
    t.equal( ds.get('length'), 2)

    var r= ds.map(function( val){
      t.ok( val)
      return val + 'X'
    })
    t.deepLooseEqual(r, ['item2X', 'itemX'])

    r= ds.filter(function( val){
      t.ok( val)
      return val === 'item'
    })
    t.deepLooseEqual(r, ['item'])

    r= ds.find(function( val){
      t.ok( val)
      return val === 'item'
    })
    t.deepLooseEqual(r, 'item')

    r= ds.indexOf('item')
    t.equal(r, 1)

  }
  else {
    t.throws(function(){
      ds.set('value')
    }, /Invalid set/,
    "Empty .set() call not allowed on root Ogre dataset.")
  }

  t.end()
}

function test_array_keys( ds, t) {
  t.equal( ds.get(['left']), ds.get('left'), 'get() with array key')

  ds.set(['left', 'name'], "LEFT")
  t.equal( ds.get(['left', 'name']), "LEFT", 'set() with array key')
  t.equal( ds.get('left.name'), "LEFT", '... part deux')

  ds.merge(['left'], { other:"OTHER"})
  t.equal( ds.get(['left', 'other']), "OTHER", 'merge() with array key')
  t.equal( ds.get('left.other'), "OTHER", '... part deux')

  ds.push(['right', 'list'], 'A')
  t.equal( ds.get(['right', 'list', '0']), "A", 'push() with array key')
  t.equal( ds.get('right.list.0'), ds.get(['right', 'list', '0']), '... part deux')

  ds.unshift(['right', 'list'], 'B')
  t.equal( ds.get(['right', 'list', '0']), "B", 'unshift() with array key')
  t.equal( ds.get('right.list.0'), ds.get(['right', 'list', '0']), '... part deux')

  t.end()
}

module.exports= {
  test_object: test_object,
  test_array: test_array,
  test_query: test_query,
  test_other: test_other,
  test_array_keys: test_array_keys
}

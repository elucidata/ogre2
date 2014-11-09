/**
 * Ogre 2
 */
var type= require('elucidata-type'),
    update= require('react/lib/update'),
    EventEmitter= require( 'events' ).EventEmitter,
    assign= require('react/lib/Object.assign'),
    CHANGE_KEY= 'change'

class Ogre extends EventEmitter {

  constructor( initialState, options ) {
    super()

    this._root= initialState || {}
    this._changedKeys= []
    this._timer= null
    this.history= []

    this.options= assign({}, { // Defaults
      batchChanges: true,
      maxHistory: 1,
      strict: true
    }, options || {})

    // If it's a subclass that implements getInitialState()...
    if( this.getInitialState ) {
      this._root= this.getInitialState( this._root )
    }
  }

  // Querying

  get( path, defaultValue ) {
    if( path === '' || path == null ) return this._root // jshint ignore:line

    var value= findPath( path, this._root)

    if( type.isUndefined( value))
      return defaultValue
    else
      return value
  }

  getPrevious( path ) {
    return findPath( path, this.history[0] || {} )
  }

  map( path, fn ) {
    return this.get( path ).map( fn )
  }

  each( path, fn ) {
    this.get( path ).forEach( fn )
    return this // TODO: Each returns this???
  }

  filter( path, fn ) {
    return this.get( path ).filter( fn )
  }

  find( path, fn ) {
    var items= this.get( path ), i, l;
    for (i= 0, l= items.length; i < l; i++) {
      var item= items[i]
      if( fn( item ) === true ) {
        return item
      }
    }
    return void 0
  }

  indexOf( path, test ) {
    return this.get( path ).indexOf( test )
  }

  // Mutations

  set( path, value) {
    this._changeDataset( path, { $set:value }, 'object')
    return this
  }

  merge( path, object ) {
    this._changeDataset( path, { $merge:object }, 'object')
    return this
  }

  push( path, array ) {
    if( type.isNotArray( array )) array= [ array ]
    this._changeDataset( path, { $push:array }, 'array')
    return this
  }

  unshift( path, array ) {
    if( type.isNotArray( array )) array= [ array ]
    this._changeDataset( path, { $unshift:array }, 'array')
    return this
  }

  splice( path, start, howMany, ...items) {
    var spec
    if( arguments.length === 2 ) {
      spec= { $splice:start }
    }
    else {
      spec= { $splice:[ [start, howMany].concat( items ) ]}
    }
    this._changeDataset( path, spec, 'array' )
    return this
  }

  // Observing

  onChange( fn ) {
    this.on( CHANGE_KEY, fn )
    return this
  }

  offChange( fn ) {
    this.removeListener( CHANGE_KEY, fn )
    return this
  }



  // Type checking

  isUndefined( path ) { return type.isUndefined( this.get( path )) }
  isNotUndefined( path ) { return type.isNotUndefined( this.get( path )) }
  isDefined( path ) { return type.isNotUndefined( this.get( path )) }
  isNull( path ) { return type.isNull( this.get( path )) }
  isNotNull( path ) { return type.isNotNull( this.get( path )) }
  isEmpty( path ) { return type.isEmpty( this.get( path )) }
  isNotEmpty( path ) { return type.isNotEmpty( this.get( path )) }
  // Include other types? isString, isArray, isFunction, isObject, etc?

  _changeDataset( path, spec, containerType ) {
    if( this._changedKeys.length === 0 ) {
      this.history.unshift( this._root )
      while( this.options.maxHistory >= 0 && this.history.length > this.options.maxHistory ) {
        this.history.pop()
      }
    }
    if( this.options.strict === false ) {
      findPath( path, this._root, true, containerType )
    }
    this._root= update( this._root, buildSpecGraph( path, spec))
    this._scheduleChangeEvent( path )
  }

  _scheduleChangeEvent( key ) {
    this._changedKeys.push( key )
    if( this.options.batchChanges === true ) {
      if( this._timer === null ) {
        this._timer= setTimeout( this._sendChangeEvents.bind(this), 0)
      }
    }
    else {
      this._sendChangeEvents()
    }
  }

  _sendChangeEvents() {
    this.emit( CHANGE_KEY, this._changedKeys )
    this._changedKeys= []
    this._timer= null
  }

}

// Helpers

function findPath( path, source, create, containerType ) {
  path= path || ''
  source= source || {}
  create= (create === true) ? true : false

  if( path === '') {
    return source
  }

  var parts= keyParts( path ),
      obj= source, key;

  while( obj && parts.length ) {
    key= parts.shift()

    if( create && type.isUndefined( obj[key] ) ) {

      if( parts.length === 0 && containerType === 'array') {
        obj[ key ]= []
      }
      else {
        obj[ key ]= {}
      }
    }

    obj= obj[ key ]
  }

  return obj
}

function buildSpecGraph( path, spec ) {
  path= path || ''
  spec= spec || {}

  var graph= {}
  if( path === '') return graph

  var parts= keyParts( path ),
      obj= graph, key;

  while( parts.length ) {
    key= parts.shift()

    if( parts.length === 0 ) {
      obj[ key ]= spec
    }
    else {
      obj[ key ]= {}
    }

    obj= obj[ key ]
  }

  return graph
}

function keyParts( path ) {
  var arr;

  if( arr= keyCache[path] ) { // jshint ignore:line
    return arr.concat()
  }
  else {
    arr= keyCache[ path ]= path.split('.')
    return arr.concat()
  }
}

var keyCache= {
  '': ['']
}

keyParts.clearCache= function() {
  keyCache= {
    '': ['']
  }
}

module.exports= Ogre

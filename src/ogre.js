/**
 * Ogre 2
 */
var type= require('elucidata-type'),
    update= require('react/lib/update'),
    EventEmitter= require( 'events' ).EventEmitter,
    assign= require('react/lib/Object.assign'),
    CHANGE_KEY= 'datasource:change'

class Ogre extends EventEmitter {

  constructor( initialState, options ) {
    super()

    this._root= initialState || {}
    this._changedKeys= []
    this._timer= null
    this._previousRoot= null
    this._history= [] // TODO: Implement a (configurably) full history...
    this.options= assign({}, { // Defaults
      batchChanges: true,
      maxHistory: 1
    }, options || {})

    if( this.getInitialState ) {
      this._root= this.getInitialState( this._root )
    }
  }

  onChange( fn ) {
    this.on( CHANGE_KEY, fn )
    return this
  }

  offChange( fn ) {
    this.off( CHANGE_KEY, fn )
    return this
  }

  get( path, defaultValue ) {
    if( path === '' || path == null ) return this._root // jshint ignore:line

    var value= findPath( path, this._root)

    if( type.isUndefined( value))
      return defaultValue
    else
      return value
  }

  getPrevious( path ) {
    return findPath( path, this._previousRoot )
  }

  set( path, value, create) {
    this._changeDataset( path, { $set:value }, create)
    return this
  }

  push( path, array, create ) {
    if( type.isNotArray( array )) array= [ array ]
    this._changeDataset( path, { $push:array }, create)
    return this
  }

  unshift( path, array, create ) {
    if( type.isNotArray( array )) array= [ array ]
    this._changeDataset( path, { $unshift:array }, create)
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
    this._changeDataset( path, spec )
    return this
  }

  merge( path, object, create ) {
    this._changeDataset( path, { $merge:object }, create)
    return this
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
    var items= this.get( path )
    for (var i = 0; i < items.length; i++) {
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

  isUndefined( path ) { return type.isUndefined( this.get( path )) }
  isNotUndefined( path ) { return type.isNotUndefined( this.get( path )) }
  isDefined( path ) { return type.isNotUndefined( this.get( path )) }
  isNull( path ) { return type.isNull( this.get( path )) }
  isNotNull( path ) { return type.isNotNull( this.get( path )) }
  isEmpty( path ) { return type.isEmpty( this.get( path )) }
  isNotEmpty( path ) { return type.isNotEmpty( this.get( path )) }

  _changeDataset( path, spec, create ) {
    if( this._changedKeys.length === 0 ) {
      this._previousRoot= this._root
    }
    if( create === true ) {
      findPath( path, this._root, create )
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


function findPath( path, source, create ) {
  path= path || ''
  source= source || {}
  create= (create === true) ? true : false;

  if( path === '') {
    return source
  }

  var parts= keyParts( path ),
      obj= source, key;

  while( obj && parts.length ) {
    key= parts.shift()
    if( create && type.isUndefined( obj[key] ) ) {
      obj[ key ]= {}
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

var keyCache= {
  '': ['']
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

keyParts.clearCache= function() {
  keyCache= {
    '': ['']
  }
}

module.exports= Ogre

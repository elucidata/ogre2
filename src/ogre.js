/**
 * Ogre 2
 */
import type from 'elucidata-type'
import update from 'react/lib/update'
import assign from 'react/lib/Object.assign'
import EventEmitter from 'eventemitter3'
import Cursor from './cursor'
import {keyParts, findPath, buildSpecGraph} from './util'
import version from './version'

const CHANGE_KEY = 'change',
      OGRE_DEFAULTS = {
        batchChanges: true,
        maxHistory: 1,
        strict: true
      }

class Ogre  {

  constructor( initialState={}, options={} ) {
    if(! this instanceof Ogre) {
      return new Ogre( initialState, options )
    }

    this._root = initialState
    this._changedKeys = []
    this._timer = null
    this._emitter = new EventEmitter()
    this.history = []

    this.options = assign( {}, OGRE_DEFAULTS, options )

    // If it's a subclass that implements getInitialState()...
    if( 'getInitialState' in this ) {
      this._root = this.getInitialState( this._root )
    }
  }

  scopeTo( path ) {
    return Cursor.forPath( path, this )
  }

  // Querying

  get( path, defaultValue ) {
    if( path === '' || path == null ) return this._root // jshint ignore:line

    let value= findPath( path, this._root)

    if( type.isUndefined( value))
      return defaultValue
    else
      return value
  }

  getPrevious( path, step=0 ) {
    return findPath( path, this.history[ step] || {} )
  }

  map( path, fn ) {
    return this.get( path, [] ).map( fn )
  }

  // TODO: Each returns this???
  each( path, fn ) {
    this.get( path, [] ).forEach( fn )
    return this
  }

  forEach( path, fn ) {
    return this.each( path, fn)
  }

  filter( path, fn ) {
    return this.get( path, [] ).filter( fn )
  }

  reduce( path, fn, initialValue ) {
    return this.get( path, [] ).reduce( fn, initialValue )
  }

  find( path, fn ) {
    let items= this.get( path, [] ), i, l;
    for (i= 0, l= items.length; i < l; i++) {
      let item= items[i]
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

  set( path, value ) {
    argCheck( arguments, 'set' )
    this._changeDataset( path, { $set:value }, 'object' )
    return this
  }

  merge( path, object ) {
    this._changeDataset( path, { $merge:object }, 'object' )
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

  splice( path, start, howMany, ...items ) {
    let spec
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
    this._emitter.on( CHANGE_KEY, fn )
    return () => {
      this._emitter.removeListener( CHANGE_KEY, fn )
    }
  }

  offChange( fn ) {
    this._emitter.removeListener( CHANGE_KEY, fn )
    return this
  }


  // Type checking

  has( path ) {
    return this.isNotEmpty( path )
  }

  isUndefined( path )    { return type.isUndefined( this.get( path )) }
  isNotUndefined( path ) { return type.isNotUndefined( this.get( path )) }
  isDefined( path )      { return type.isNotUndefined( this.get( path )) }
  isNull( path )         { return type.isNull( this.get( path )) }
  isNotNull( path )      { return type.isNotNull( this.get( path )) }
  isEmpty( path )        { return type.isEmpty( this.get( path )) }
  isNotEmpty( path )     { return type.isNotEmpty( this.get( path )) }

  isString( path )       { return type.isString( this.get( path )) }
  isNotString( path )    { return type.isNotString( this.get( path )) }
  isArray( path )        { return type.isArray( this.get( path )) }
  isNotArray( path )     { return type.isNotArray( this.get( path )) }
  isObject( path )       { return type.isObject( this.get( path )) }
  isNotObject( path )    { return type.isNotObject( this.get( path )) }
  isNumber( path )       { return type.isNumber( this.get( path )) }
  isNotNumber( path )    { return type.isNotNumber( this.get( path )) }



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
    if( type.isArray( key)) key= key.join('.')
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
    this._emitter.emit( CHANGE_KEY, this._changedKeys )
    this._changedKeys= []
    this._timer= null
  }

  _clearKeyCache() {
    keyParts.clearCache()
  }

}

Ogre.version= version

// Helpers

function argCheck( args, target='' ) {
  if( args.length < 2) {
    throw new Error( `Invalid ${ target } call: Requires path and value` )
  }
}

module.exports= Ogre

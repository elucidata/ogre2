import 'es6-collections'
import type from 'elucidata-type'
import {startsWith} from './util'

class Cursor {

  constructor( source, basePath ) {
    this.source = source
    this.basePath = type.isArray( basePath) ? basePath.join( '.') : basePath
  }

  scopeTo( path ) {
    return Cursor.forPath( this.basePath +'.'+ path, this.source )
  }

  onChange( handler ) {
    onSourceChange( this.source, this.basePath, handler )

    return () => {
      offSourceChange( this.source, this.basePath, handler )
    }
  }

  offChange( handler ) {
    offSourceChange( this.source, this.basePath, handler )

    return this
  }

  getFullPath( path ) {
      var subPath= this.basePath

      if( path ) {
        if( type.isArray( path )) {
          if( path.length > 0 ) {
            subPath += '.'
            subPath += path.join( '.')
          }
        }
        else {
          subPath += '.'
          subPath += path
        }
      }

      return subPath
  }

  static forPath( path, source ) {
    return new Cursor( source, path )
  }

  // Just for internal, testing, usage!
  static listenerInfo( full=false ) {
    var totalSources= _eventsForSource.size,
        totalKeyWatches= 0,
        totalEventHandlers= 0

    _eventsForSource.forEach(( keyMap, source )=>{
      Object.keys( keyMap ).forEach( key =>{
        var handlers= keyMap[ key ]
        totalKeyWatches += 1
        totalEventHandlers += handlers.length
      })
    })

    var report= { totalSources, totalKeyWatches, totalEventHandlers }

    // if( full) {
    //   var handlers= ( JSON.stringify(_eventsForSource))
    //   report.events_for_source= handlers
    //   console.dir( handlers)
    // }

    return report
  }

}


[ // Build pass-thru methods...
  'get', 'getPrevious', 'set', 'has', 'merge', 'push', 'unshift', 'splice',
  'map', 'each', 'forEach', 'reduce', 'filter', 'find', 'indexOf', 'isUndefined',
  'isNotUndefined', 'isDefined', 'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty',
  'isString', 'isNotString', 'isArray', 'isNotArray', 'isObject', 'isNotObject',
  'isNumber', 'isNotNumber'
].map( method => {

  Cursor.prototype[ method ]= function(...args) {
    var argsLen= args.length, path, params
    if( argsLen === 0 ) {
      return this.source[ method ].call( this.source, this.basePath)
    }
    else if( argsLen === 1 ) {
      path= args[ 0]
      if( _assumedValueMethods.has( method)) {
        return this.source[ method ].call( this.source, this.basePath, path)
      }
      else {
        return this.source[ method ].call( this.source, this.getFullPath( path ))
      }
    }
    else {
      [path, ...params]= args
      params.unshift( this.getFullPath( path))
      return this.source[ method].apply( this.source, params)
    }
  }

})

var _eventsForSource= new Map(),
    _sourceHandlers= new WeakMap(),
    _assumedValueMethods= new Set([
      'set', 'merge', 'push', 'unshift', 'splice', 'indexOf', 'map', 'each',
      'forEach', 'reduce', 'filter', 'find'
    ])


function onSourceChange( source, key, handler ) {
  handleEventsFor( source )

  let keyMap= _eventsForSource.get( source )

  keyMap[ key ]= keyMap[ key ] || []
  keyMap[ key ].push( handler )
}

function offSourceChange( source, key, handler) {
  let keyMap= _eventsForSource.get( source)

  keyMap[ key]= keyMap[ key] || []
  keyMap[ key].splice(  keyMap[ key].indexOf( handler), 1)

  if( keyMap[ key].length === 0 ) {
    delete keyMap[ key]

    if( Object.keys( keyMap).length === 0) {
      let srcHandler= _sourceHandlers.get( source )

      source.offChange( srcHandler )
      _sourceHandlers.delete( source )
      _eventsForSource.delete( source )
    }
  }
}

function handleEventsFor( source) {
  if(! _eventsForSource.has( source)) {
    var handler= globalEventHandler.bind( this, source)

    source.onChange( handler)
    _eventsForSource.set( source, { })
    _sourceHandlers.set( source, handler)
  }
}

function globalEventHandler( source, changedPaths) {
  if(! _eventsForSource.has( source)) {
    console.log( "Ghost bug: Cursor#globalEventHandler() called with a source no longer tracked!")
    return
  }

  let trackedMap= _eventsForSource.get( source ),
      trackedPaths= Object.keys( trackedMap ),
      callbacks= []

  if( trackedPaths && trackedPaths.length ) {
    for( let i=0; i< trackedPaths.length; i++) {
      let trackPath= trackedPaths[ i]

      for( let j=0; j< changedPaths.length; j++) {
        let changedPath= changedPaths[ j]

        if( startsWith( changedPath, trackPath)) {
          let cursor_callbacks= trackedMap[ trackPath]

          callbacks= callbacks.concat( cursor_callbacks)
          break
        }
      }
    }
  }

  if( callbacks.length) {
    callbacks.forEach(( fn)=>{
      fn( changedPaths)
    })
  }
}

module.exports= Cursor

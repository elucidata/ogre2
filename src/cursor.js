var type= require( 'elucidata-type'),
    shim= require( 'es6-collections'),
    {startsWith}= require( './util')

class Cursor {

  constructor( source, basePath) {
    this.source= source
    this.basePath= type.isArray( basePath) ? basePath.join( '.') : basePath
  }

  scopeTo( path) {
    return Cursor.forPath( this.basePath +'.'+ path, this.source)
  }

  onChange( handler) {
    onSourceChange( this.source, this.basePath, handler)

    return () => {
      offSourceChange( this.source, this.basePath, handler)
    }
  }

  offChange( handler) {
    offSourceChange( this.source, this.basePath, handler)

    return this
  }

  getFullPath( path) {
      var sub_path= this.basePath

      if( path) {
        if( type.isArray( path)) {
          if( path.length > 0) {
            sub_path += '.'
            sub_path += path.join( '.')
          }
        }
        else {
          sub_path += '.'
          sub_path += path
        }
      }

      return sub_path
  }

  static forPath( path, source) {
    return new Cursor( source, path)
  }

  // Just for internal, testing, usage!
  static listenerInfo( full=false) {
    var totalSources= _events_for_source.size,
        totalKeyWatches= 0,
        totalEventHandlers= 0

    _events_for_source.forEach(( key_map, source)=>{
      Object.keys( key_map).forEach(( key)=>{
        var handlers= key_map[ key]
        totalKeyWatches += 1
        totalEventHandlers += handlers.length
      })
    })

    var report= { totalSources, totalKeyWatches, totalEventHandlers }

    // if( full) {
    //   var handlers= ( JSON.stringify(_events_for_source))
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
].map(( method)=>{
  Cursor.prototype[ method]= function(){
    var arg_len= arguments.length, path, params
    if( arg_len === 0) {
      return this.source[ method].call( this.source, this.basePath)
    }
    else if( arg_len === 1) {
      path= arguments[ 0]
      if( _assumed_value_methods.has( method)) {
        return this.source[ method].call( this.source, this.basePath, path)
      }
      else {
        return this.source[ method].call( this.source, this.getFullPath( path))
      }
    }
    else {
      [path, ...params]= arguments
      params.unshift( this.getFullPath( path))
      return this.source[ method].apply( this.source, params)
    }
  }
})

var _events_for_source= new Map(),
    _source_handlers= new WeakMap(),
    _assumed_value_methods= new Set([
      'set', 'merge', 'push', 'unshift', 'splice', 'indexOf', 'map', 'each',
      'forEach', 'reduce', 'filter', 'find'
    ])


function onSourceChange( source, key, handler) {
  handleEventsFor( source)

  var key_map= _events_for_source.get( source)

  key_map[ key]= key_map[ key] || []
  key_map[ key].push( handler)
}

function offSourceChange( source, key, handler) {
  var key_map= _events_for_source.get( source)

  key_map[ key]= key_map[ key] || []
  key_map[ key].splice(  key_map[ key].indexOf( handler), 1)

  if( key_map[ key].length === 0 ) {
    delete key_map[ key]

    if( Object.keys( key_map).length === 0) {
      var src_handler= _source_handlers.get( source)

      source.offChange( src_handler)
      _source_handlers.delete( source)
      _events_for_source.delete( source)
    }
  }
}

function handleEventsFor( source) {
  if(! _events_for_source.has( source)) {
    var handler= globalEventHandler.bind( this, source)

    source.onChange( handler)
    _events_for_source.set( source, { })
    _source_handlers.set( source, handler)
  }
}

function globalEventHandler( source, changed_paths) {
  if(! _events_for_source.has( source)) {
    console.log( "Ghost bug: Cursor#globalEventHandler() called with a source no longer tracked!")
    return
  }

  var tracked_map= _events_for_source.get( source),
      tracked_paths= Object.keys( tracked_map),
      callbacks= []

  if( tracked_paths && tracked_paths.length) {
    for( var i=0; i< tracked_paths.length; i++) {
      var track_path= tracked_paths[ i]

      for( var j=0; j< changed_paths.length; j++) {
        var changed_path= changed_paths[ j]

        if( startsWith( changed_path, track_path)) {
          var cursor_callbacks= tracked_map[ track_path]

          callbacks= callbacks.concat( cursor_callbacks)
          break
        }
      }
    }
  }

  if( callbacks.length) {
    callbacks.forEach(( fn)=>{
      fn( changed_paths)
    })
  }
}

module.exports= Cursor

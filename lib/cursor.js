var type= require( 'elucidata-type'),
    shim= require( 'es6-collections'),
    $__0= require( './util'),startsWith=$__0.startsWith



  function Cursor(source, basePath) {"use strict";
    this.source= source
    this.basePath= type.isArray( basePath) ? basePath.join( '.') : basePath
  }

  Cursor.prototype.dispose=function() {"use strict";
    this.$Cursor_handlers.forEach(function( fn){
      this.offChange( fn)
    }.bind(this))
  };

  Cursor.prototype.scopeTo=function(path) {"use strict";
    return Cursor.forPath( this.basePath +'.'+ path, this.source)
  };

  Cursor.prototype.onChange=function(handler) {"use strict";
    onSourceChange( this.source, this.basePath, handler)
    return this
  };

  Cursor.prototype.offChange=function(handler) {"use strict";
    offSourceChange( this.source, this.basePath, handler)
    return this
  };

  Cursor.prototype.getFullPath=function(path) {"use strict";
      var sub_path= this.basePath

      if( path) {
        sub_path += '.'
        sub_path += path
      }

      return sub_path
  };

  Cursor.forPath=function(path, source) {"use strict";
    return new Cursor( source, path)
  };

  // Just for internal, testing, usage!
  Cursor.listenerInfo=function() {"use strict";
    var totalSources= _events_for_source.size,
        totalKeyWatches= 0,
        totalEventHandlers= 0
    _events_for_source.forEach(function( key_map, source){
      Object.keys( key_map).forEach(function( key){
        var handlers= key_map[ key]
        totalKeyWatches += 1
        totalEventHandlers += handlers.length
      })
    })
    return { totalSources:totalSources, totalKeyWatches:totalKeyWatches, totalEventHandlers:totalEventHandlers }
  };



[ // Build pass-thru methods...
  'get', 'getPrevious', 'set', 'has', 'merge', 'push', 'unshift', 'splice',
  'map', 'each', 'forEach', 'reduce', 'filter', 'find', 'indexOf', 'isUndefined',
  'isNotUndefined', 'isDefined', 'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty',
  'isString', 'isNotString', 'isArray', 'isNotArray', 'isObject', 'isNotObject',
  'isNumber', 'isNotNumber'
].map(function( method){
  Cursor.prototype[ method]= function(){
    if( arguments.length === 0) {
      return this.source[ method].call( this.source, this.basePath)
    }
    else {
      var $__0=  arguments,path=$__0[0],params=Array.prototype.slice.call($__0,1)
      if( params.length === 0) {
        if( typeof path === 'string' &&
            method != 'set' &&
            method != 'push' &&
            method != 'indexOf' &&
            method != 'unshift')
        {
          return this.source[ method].call( this.source, this.getFullPath( path))
        }
        else {
          return this.source[ method].call( this.source, this.basePath, path)
        }
      }
      else {
        params.unshift( this.getFullPath( path))
        return this.source[ method].apply( this.source, params)
      }
    }
  }
}.bind(this))

// var _sources= new WeakSet(),
//     _events_for_source= new WeakMap()

var _events_for_source= new Map(),
    _source_handlers= new WeakMap()

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

function globalEventHandler( source, changedKeys) {
  if(! _events_for_source.has( source)) {
    console.log( "Ghost bug: Cursor#globalEventHandler() called with a source no longer tracked!")
    return
  }
  var key_map= _events_for_source.get( source),
      keys= Object.keys( key_map)

  if( keys && keys.length) {
    var i=0, l=changedKeys.length
    var handlers= [], key, ii=0, ll= keys.length, changedKey

    for( ii=0; ii < ll; ii++ ) {
      key= keys[ ii]

      for (; i < l; i++) {
        changedKey= changedKeys[ i]

        if( startsWith(changedKey, key)) {
          var callbacks= key_map[ key]
          handlers= handlers.concat( callbacks)
          break
        }
      }
    }

    if( handlers.length) {
      handlers.forEach(function( fn){
        fn( changedKeys)
      })
    }
  }
}

module.exports= Cursor

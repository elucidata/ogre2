/**
 * Ogre 2
 */
var type= require('elucidata-type'),
    update= require('react/lib/update'),
    EventEmitter= require( 'events' ).EventEmitter,
    assign= require('react/lib/Object.assign'),
    CHANGE_KEY= 'change'

for(var EventEmitter____Key in EventEmitter){if(EventEmitter.hasOwnProperty(EventEmitter____Key)){Ogre[EventEmitter____Key]=EventEmitter[EventEmitter____Key];}}var ____SuperProtoOfEventEmitter=EventEmitter===null?null:EventEmitter.prototype;Ogre.prototype=Object.create(____SuperProtoOfEventEmitter);Ogre.prototype.constructor=Ogre;Ogre.__superConstructor__=EventEmitter;

  function Ogre(initialState, options)  {"use strict";
    EventEmitter.call(this)

    this.$Ogre_root= initialState || {}
    this.$Ogre_changedKeys= []
    this.$Ogre_timer= null
    this.$Ogre_history= []
    this.options= assign({}, { // Defaults
      batchChanges: true,
      maxHistory: 1,
      strict: true
    }, options || {})

    // If it's a subclass that implements getInitialState()...
    if( this.getInitialState ) {
      this.$Ogre_root= this.getInitialState( this.$Ogre_root )
    }
  }

  // Querying

  Ogre.prototype.get=function(path, defaultValue)  {"use strict";
    if( path === '' || path == null ) return this.$Ogre_root // jshint ignore:line

    var value= findPath( path, this.$Ogre_root)

    if( type.isUndefined( value))
      return defaultValue
    else
      return value
  };

  Ogre.prototype.getPrevious=function(path)  {"use strict";
    return findPath( path, this.$Ogre_history[0] || {} )
  };

  Ogre.prototype.map=function(path, fn)  {"use strict";
    return this.get( path ).map( fn )
  };

  Ogre.prototype.each=function(path, fn)  {"use strict";
    this.get( path ).forEach( fn )
    return this // TODO: Each returns this???
  };

  Ogre.prototype.filter=function(path, fn)  {"use strict";
    return this.get( path ).filter( fn )
  };

  Ogre.prototype.find=function(path, fn)  {"use strict";
    var items= this.get( path )
    for (var i = 0; i < items.length; i++) {
      var item= items[i]
      if( fn( item ) === true ) {
        return item
      }
    }
    return void 0
  };

  Ogre.prototype.indexOf=function(path, test)  {"use strict";
    return this.get( path ).indexOf( test )
  };

  // Mutations

  Ogre.prototype.set=function(path, value) {"use strict";
    this.$Ogre_changeDataset( path, { $set:value }, 'object')
    return this
  };

  Ogre.prototype.merge=function(path, object)  {"use strict";
    this.$Ogre_changeDataset( path, { $merge:object }, 'object')
    return this
  };

  Ogre.prototype.push=function(path, array)  {"use strict";
    if( type.isNotArray( array )) array= [ array ]
    this.$Ogre_changeDataset( path, { $push:array }, 'array')
    return this
  };

  Ogre.prototype.unshift=function(path, array)  {"use strict";
    if( type.isNotArray( array )) array= [ array ]
    this.$Ogre_changeDataset( path, { $unshift:array }, 'array')
    return this
  };

  Ogre.prototype.splice=function(path, start, howMany)  {"use strict";var items=Array.prototype.slice.call(arguments,3);
    var spec
    if( arguments.length === 2 ) {
      spec= { $splice:start }
    }
    else {
      spec= { $splice:[ [start, howMany].concat( items ) ]}
    }
    this.$Ogre_changeDataset( path, spec, 'array' )
    return this
  };

  // Observing

  Ogre.prototype.onChange=function(fn)  {"use strict";
    this.on( CHANGE_KEY, fn )
    return this
  };

  Ogre.prototype.offChange=function(fn)  {"use strict";
    this.off( CHANGE_KEY, fn )
    return this
  };



  // Type checking

  Ogre.prototype.isUndefined=function(path)  {"use strict"; return type.isUndefined( this.get( path )) };
  Ogre.prototype.isNotUndefined=function(path)  {"use strict"; return type.isNotUndefined( this.get( path )) };
  Ogre.prototype.isDefined=function(path)  {"use strict"; return type.isNotUndefined( this.get( path )) };
  Ogre.prototype.isNull=function(path)  {"use strict"; return type.isNull( this.get( path )) };
  Ogre.prototype.isNotNull=function(path)  {"use strict"; return type.isNotNull( this.get( path )) };
  Ogre.prototype.isEmpty=function(path)  {"use strict"; return type.isEmpty( this.get( path )) };
  Ogre.prototype.isNotEmpty=function(path)  {"use strict"; return type.isNotEmpty( this.get( path )) };
  // Include other types? isString, isArray, isFunction, isObject, etc?

  Ogre.prototype.$Ogre_changeDataset=function(path, spec, containerType)  {"use strict";
    if( this.$Ogre_changedKeys.length === 0 ) {
      this.$Ogre_history.unshift( this.$Ogre_root )
      while( this.options.maxHistory >= 0 && this.$Ogre_history.length > this.options.maxHistory ) {
        this.$Ogre_history.pop()
      }
    }
    if( this.options.strict === false ) {
      findPath( path, this.$Ogre_root, true, containerType )
    }
    this.$Ogre_root= update( this.$Ogre_root, buildSpecGraph( path, spec))
    this.$Ogre_scheduleChangeEvent( path )
  };

  Ogre.prototype.$Ogre_scheduleChangeEvent=function(key)  {"use strict";
    this.$Ogre_changedKeys.push( key )
    if( this.options.batchChanges === true ) {
      if( this.$Ogre_timer === null ) {
        this.$Ogre_timer= setTimeout( this.$Ogre_sendChangeEvents.bind(this), 0)
      }
    }
    else {
      this.$Ogre_sendChangeEvents()
    }
  };

  Ogre.prototype.$Ogre_sendChangeEvents=function() {"use strict";
    this.emit( CHANGE_KEY, this.$Ogre_changedKeys )
    this.$Ogre_changedKeys= []
    this.$Ogre_timer= null
  };



// Helpers

function findPath( path, source, create, containerType ) {
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

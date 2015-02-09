/**
 * Ogre 2
 */
var type= require( 'elucidata-type'),
    update= require( 'react/lib/update'),
    assign= require( 'react/lib/Object.assign'),
    EventEmitter= require( 'events').EventEmitter,
    Cursor= require( './cursor'),
    CHANGE_KEY= 'change',
    $__0=   require( './util'),keyParts=$__0.keyParts,findPath=$__0.findPath,buildSpecGraph=$__0.buildSpecGraph

    // keyParts= util.keyParts,
    // findPath= util.findPath,
    // buildSpecGraph= util.buildSpecGraph




  function Ogre(initialState, options)  {"use strict";
    if(! this instanceof Ogre) {
      return new Ogre( initialState, options )
    }

    this.$Ogre_root= initialState || {}
    this.$Ogre_changedKeys= []
    this.$Ogre_timer= null
    this.$Ogre_emitter= new EventEmitter()
    this.history= []

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

  Ogre.prototype.scopeTo=function(path) {"use strict";
    return Cursor.forPath( path, this)
  };

  // Querying

  Ogre.prototype.get=function(path, defaultValue)  {"use strict";
    if( path === '' || path == null ) return this.$Ogre_root // jshint ignore:line

    var value= findPath( path, this.$Ogre_root)

    if( type.isUndefined( value))
      return defaultValue
    else
      return value
  };

  Ogre.prototype.getPrevious=function(path, step)  {"use strict";
    step= step || 0
    return findPath( path, this.history[ step] || {} )
  };

  Ogre.prototype.map=function(path, fn)  {"use strict";
    return this.get( path, [] ).map( fn )
  };

  // TODO: Each returns this???
  Ogre.prototype.each=function(path, fn)  {"use strict";
    this.get( path, [] ).forEach( fn )
    return this
  };

  Ogre.prototype.forEach=function(path, fn)  {"use strict";
    return this.each( path, fn)
  };

  Ogre.prototype.filter=function(path, fn)  {"use strict";
    return this.get( path, [] ).filter( fn )
  };

  Ogre.prototype.reduce=function(path, fn, initialValue)  {"use strict";
    return this.get( path, [] ).reduce( fn, initialValue )
  };

  Ogre.prototype.find=function(path, fn)  {"use strict";
    var items= this.get( path, [] ), i, l;
    for (i= 0, l= items.length; i < l; i++) {
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
    if( arguments.length < 2) {
      throw new Error("Invalid set() call: Requires path and value.")
    }
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
    this.$Ogre_emitter.on( CHANGE_KEY, fn )
    return this
  };

  Ogre.prototype.offChange=function(fn)  {"use strict";
    this.$Ogre_emitter.removeListener( CHANGE_KEY, fn )
    return this
  };


  // Type checking

  Ogre.prototype.has=function(path) {"use strict";
    return this.isNotEmpty( path)
  };

  Ogre.prototype.isUndefined=function(path)  {"use strict"; return type.isUndefined( this.get( path )) };
  Ogre.prototype.isNotUndefined=function(path)  {"use strict"; return type.isNotUndefined( this.get( path )) };
  Ogre.prototype.isDefined=function(path)  {"use strict"; return type.isNotUndefined( this.get( path )) };
  Ogre.prototype.isNull=function(path)  {"use strict"; return type.isNull( this.get( path )) };
  Ogre.prototype.isNotNull=function(path)  {"use strict"; return type.isNotNull( this.get( path )) };
  Ogre.prototype.isEmpty=function(path)  {"use strict"; return type.isEmpty( this.get( path )) };
  Ogre.prototype.isNotEmpty=function(path)  {"use strict"; return type.isNotEmpty( this.get( path )) };

  Ogre.prototype.isString=function(path)  {"use strict"; return type.isString( this.get( path )) };
  Ogre.prototype.isNotString=function(path)  {"use strict"; return type.isNotString( this.get( path )) };
  Ogre.prototype.isArray=function(path)  {"use strict"; return type.isArray( this.get( path )) };
  Ogre.prototype.isNotArray=function(path)  {"use strict"; return type.isNotArray( this.get( path )) };
  Ogre.prototype.isObject=function(path)  {"use strict"; return type.isObject( this.get( path )) };
  Ogre.prototype.isNotObject=function(path)  {"use strict"; return type.isNotObject( this.get( path )) };
  Ogre.prototype.isNumber=function(path)  {"use strict"; return type.isNumber( this.get( path )) };
  Ogre.prototype.isNotNumber=function(path)  {"use strict"; return type.isNotNumber( this.get( path )) };



  Ogre.prototype.$Ogre_changeDataset=function(path, spec, containerType)  {"use strict";
    if( this.$Ogre_changedKeys.length === 0 ) {
      this.history.unshift( this.$Ogre_root )
      while( this.options.maxHistory >= 0 && this.history.length > this.options.maxHistory ) {
        this.history.pop()
      }
    }
    if( this.options.strict === false ) {
      findPath( path, this.$Ogre_root, true, containerType )
    }

    this.$Ogre_root= update( this.$Ogre_root, buildSpecGraph( path, spec))
    this.$Ogre_scheduleChangeEvent( path )
  };

  Ogre.prototype.$Ogre_scheduleChangeEvent=function(key)  {"use strict";
    if( type.isArray( key)) key= key.join('.')
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
    this.$Ogre_emitter.emit( CHANGE_KEY, this.$Ogre_changedKeys )
    this.$Ogre_changedKeys= []
    this.$Ogre_timer= null
  };

  Ogre.prototype.$Ogre_clearKeyCache=function() {"use strict";
    keyParts.clearCache()
  };



// Helpers

module.exports= Ogre

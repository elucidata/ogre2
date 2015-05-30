import type from 'elucidata-type'
// var type= require( 'elucidata-type')

export function findPath( path, source, create, containerType ) {
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

export function buildSpecGraph( path, spec ) {
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

export function keyParts( path ) {
  var arr;

  if( type.isArray( path)) {
    return path.concat()
  }

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

var _last_id = 0

export function uid ( radix){
  var now = Math.floor( (new Date()).getTime() / 1000 )
  radix= radix || 36

  while ( now <= _last_id ) {
    now += 1
  }

  _last_id= now

  return now.toString( radix)
}

/* global performance */
export var now= (()=>{
  if( typeof performance === 'object' && performance.now ) {
    return performance.now.bind( performance )
  }
  else if( Date.now ) {
    return Date.now.bind(Date)
  }
  else {
    return ()=> {
      return (new Date()).getTime()
    }
  }
})()

export function startsWith( haystack, needle) {
  // position = position || 0;
  // return haystack.lastIndexOf(needle, position) === position;
  return haystack.indexOf( needle) == 0
}


// module.exports= {
//   keyParts,
//   findPath,
//   buildSpecGraph,
//   uid,
//   now,
//   startsWith
// }

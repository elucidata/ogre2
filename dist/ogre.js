!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Ogre=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var name, type, _elementTestRe, _fn, _i, _keys, _len, _ref, _typeList;

  _typeList = "Boolean Number String Function Array Date RegExp Undefined Null NodeList".split(" ");

  _elementTestRe = /element$/;

  _keys = Object.keys || function(obj) {
    var key, v, _results;
    _results = [];
    for (key in obj) {
      v = obj[key];
      _results.push(key);
    }
    return _results;
  };

  type = (function() {
    var classToType, elemParser, name, toStr, _i, _len;
    toStr = Object.prototype.toString;
    elemParser = /\[object HTML(.*)\]/;
    classToType = {};
    for (_i = 0, _len = _typeList.length; _i < _len; _i++) {
      name = _typeList[_i];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function(obj) {
      var found, strType;
      strType = toStr.call(obj);
      if (found = classToType[strType]) {
        return found;
      } else if (found = strType.match(elemParser)) {
        return found[1].toLowerCase();
      } else {
        return "object";
      }
    };
  })();

  _ref = _typeList.concat(['Object']);
  _fn = function(name) {
    var nameLower;
    nameLower = name.toLowerCase();
    type["is" + name] = function(target) {
      return type(target) === nameLower;
    };
    return type["isNot" + name] = function(target) {
      return type(target) !== nameLower;
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    name = _ref[_i];
    _fn(name);
  }

  type.isEmpty = function(target) {
    switch (type(target)) {
      case 'null':
        return true;
      case 'undefined':
        return true;
      case 'string':
        return target === '';
      case 'object':
        return _keys(target).length === 0;
      case 'array':
        return target.length === 0;
      case 'number':
        return isNaN(target);
      case 'nodelist':
        return target.length === 0;
      default:
        return false;
    }
  };

  type.isNotEmpty = function(target) {
    return !type.isEmpty(target);
  };

  type.isElement = function(target) {
    return _elementTestRe.test(type(target));
  };

  type.isNotElement = function(target) {
    return !type.isElement(target);
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = type;
  } else {
    this.type = type;
  }

}).call(this);

},{}],2:[function(require,module,exports){
(function (global){
(function (exports) {'use strict';
  //shared pointer
  var i;
  //shortcuts
  var defineProperty = Object.defineProperty, is = Object.is;


  //Polyfill global objects
  if (typeof WeakMap == 'undefined') {
    exports.WeakMap = createCollection({
      // WeakMap#delete(key:void*):boolean
      'delete': sharedDelete,
      // WeakMap#clear():
      clear: sharedClear,
      // WeakMap#get(key:void*):void*
      get: sharedGet,
      // WeakMap#has(key:void*):boolean
      has: mapHas,
      // WeakMap#set(key:void*, value:void*):void
      set: sharedSet
    }, true);
  }

  if (typeof Map == 'undefined') {
    exports.Map = createCollection({
      // WeakMap#delete(key:void*):boolean
      'delete': sharedDelete,
      //:was Map#get(key:void*[, d3fault:void*]):void*
      // Map#has(key:void*):boolean
      has: mapHas,
      // Map#get(key:void*):boolean
      get: sharedGet,
      // Map#set(key:void*, value:void*):void
      set: sharedSet,
      // Map#keys(void):Array === not in specs
      keys: sharedKeys,
      // Map#values(void):Array === not in specs
      values: sharedValues,
      // Map#forEach(callback:Function, context:void*):void ==> callback.call(context, key, value, mapObject) === not in specs`
      forEach: sharedForEach,
      // Map#clear():
      clear: sharedClear
    });
  }

  if (typeof Set == 'undefined') {
    exports.Set = createCollection({
      // Set#has(value:void*):boolean
      has: setHas,
      // Set#add(value:void*):boolean
      add: sharedAdd,
      // Set#delete(key:void*):boolean
      'delete': sharedDelete,
      // Set#clear():
      clear: sharedClear,
      // Set#values(void):Array === not in specs
      values: sharedValues,
      // Set#forEach(callback:Function, context:void*):void ==> callback.call(context, value, index) === not in specs
      forEach: sharedSetIterate
    });
  }

  if (typeof WeakSet == 'undefined') {
    exports.WeakSet = createCollection({
      // WeakSet#delete(key:void*):boolean
      'delete': sharedDelete,
      // WeakSet#add(value:void*):boolean
      add: sharedAdd,
      // WeakSet#clear():
      clear: sharedClear,
      // WeakSet#has(value:void*):boolean
      has: setHas
    }, true);
  }


  /**
   * ES6 collection constructor
   * @return {Function} a collection class
   */
  function createCollection(proto, objectOnly){
    function Collection(a){
      if (!this || this.constructor !== Collection) return new Collection(a);
      this._keys = [];
      this._values = [];
      this.objectOnly = objectOnly;

      //parse initial iterable argument passed
      if (a) init.call(this, a);
    }

    //define size for non object-only collections
    if (!objectOnly) {
      defineProperty(proto, 'size', {
        get: sharedSize
      });
    }

    //set prototype
    proto.constructor = Collection;
    Collection.prototype = proto;

    return Collection;
  }


  /** parse initial iterable argument passed */
  function init(a){
    var i;
    //init Set argument, like `[1,2,3,{}]`
    if (this.add)
      a.forEach(this.add, this);
    //init Map argument like `[[1,2], [{}, 4]]`
    else
      a.forEach(function(a){this.set(a[0],a[1])}, this);
  }


  /** delete */
  function sharedDelete(key) {
    if (this.has(key)) {
      this._keys.splice(i, 1);
      this._values.splice(i, 1);
    }
    // Aurora here does it while Canary doesn't
    return -1 < i;
  };

  function sharedGet(key) {
    return this.has(key) ? this._values[i] : undefined;
  }

  function has(list, key) {
    if (this.objectOnly && key !== Object(key))
      throw new TypeError("Invalid value used as weak collection key");
    //NaN or 0 passed
    if (key != key || key === 0) for (i = list.length; i-- && !is(list[i], key););
    else i = list.indexOf(key);
    return -1 < i;
  }

  function setHas(value) {
    return has.call(this, this._values, value);
  }

  function mapHas(value) {
    return has.call(this, this._keys, value);
  }

  /** @chainable */
  function sharedSet(key, value) {
    this.has(key) ?
      this._values[i] = value
      :
      this._values[this._keys.push(key) - 1] = value
    ;
    return this;
  }

  /** @chainable */
  function sharedAdd(value) {
    if (!this.has(value)) this._values.push(value);
    return this;
  }

  function sharedClear() {
    this._values.length = 0;
  }

  /** keys, values, and iterate related methods */
  function sharedValues() {
    return this._values.slice();
  }

  function sharedKeys() {
    return this._keys.slice();
  }

  function sharedSize() {
    return this._values.length;
  }

  function sharedForEach(callback, context) {
    var self = this;
    var values = self._values.slice();
    self._keys.slice().forEach(function(key, n){
      callback.call(context, values[n], key, self);
    });
  }

  function sharedSetIterate(callback, context) {
    var self = this;
    self._values.slice().forEach(function(value){
      callback.call(context, value, value, self);
    });
  }

})(typeof exports != 'undefined' && typeof global != 'undefined' ? global : window );

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
'use strict';

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (this._events[evt].fn) return [this._events[evt].fn];

  for (var i = 0, l = this._events[evt].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[evt][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],4:[function(require,module,exports){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.assign
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

function assign(target, sources) {
  if (target == null) {
    throw new TypeError('Object.assign target cannot be null or undefined');
  }

  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    // We don't currently support accessors nor proxies. Therefore this
    // copy cannot throw. If we ever supported this then we must handle
    // exceptions and side-effects. We don't support symbols so they won't
    // be transferred.

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  return to;
};

module.exports = assign;

},{}],5:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== "production") {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],6:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],7:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule update
 */

"use strict";

var assign = require("./Object.assign");
var keyOf = require("./keyOf");
var invariant = require("./invariant");

function shallowCopy(x) {
  if (Array.isArray(x)) {
    return x.concat();
  } else if (x && typeof x === 'object') {
    return assign(new x.constructor(), x);
  } else {
    return x;
  }
}

var COMMAND_PUSH = keyOf({$push: null});
var COMMAND_UNSHIFT = keyOf({$unshift: null});
var COMMAND_SPLICE = keyOf({$splice: null});
var COMMAND_SET = keyOf({$set: null});
var COMMAND_MERGE = keyOf({$merge: null});
var COMMAND_APPLY = keyOf({$apply: null});

var ALL_COMMANDS_LIST = [
  COMMAND_PUSH,
  COMMAND_UNSHIFT,
  COMMAND_SPLICE,
  COMMAND_SET,
  COMMAND_MERGE,
  COMMAND_APPLY
];

var ALL_COMMANDS_SET = {};

ALL_COMMANDS_LIST.forEach(function(command) {
  ALL_COMMANDS_SET[command] = true;
});

function invariantArrayCase(value, spec, command) {
  ("production" !== "production" ? invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  ) : invariant(Array.isArray(value)));
  var specValue = spec[command];
  ("production" !== "production" ? invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  ) : invariant(Array.isArray(specValue)));
}

function update(value, spec) {
  ("production" !== "production" ? invariant(
    typeof spec === 'object',
    'update(): You provided a key path to update() that did not contain one ' +
    'of %s. Did you forget to include {%s: ...}?',
    ALL_COMMANDS_LIST.join(', '),
    COMMAND_SET
  ) : invariant(typeof spec === 'object'));

  if (spec.hasOwnProperty(COMMAND_SET)) {
    ("production" !== "production" ? invariant(
      Object.keys(spec).length === 1,
      'Cannot have more than one key in an object with %s',
      COMMAND_SET
    ) : invariant(Object.keys(spec).length === 1));

    return spec[COMMAND_SET];
  }

  var nextValue = shallowCopy(value);

  if (spec.hasOwnProperty(COMMAND_MERGE)) {
    var mergeObj = spec[COMMAND_MERGE];
    ("production" !== "production" ? invariant(
      mergeObj && typeof mergeObj === 'object',
      'update(): %s expects a spec of type \'object\'; got %s',
      COMMAND_MERGE,
      mergeObj
    ) : invariant(mergeObj && typeof mergeObj === 'object'));
    ("production" !== "production" ? invariant(
      nextValue && typeof nextValue === 'object',
      'update(): %s expects a target of type \'object\'; got %s',
      COMMAND_MERGE,
      nextValue
    ) : invariant(nextValue && typeof nextValue === 'object'));
    assign(nextValue, spec[COMMAND_MERGE]);
  }

  if (spec.hasOwnProperty(COMMAND_PUSH)) {
    invariantArrayCase(value, spec, COMMAND_PUSH);
    spec[COMMAND_PUSH].forEach(function(item) {
      nextValue.push(item);
    });
  }

  if (spec.hasOwnProperty(COMMAND_UNSHIFT)) {
    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
    spec[COMMAND_UNSHIFT].forEach(function(item) {
      nextValue.unshift(item);
    });
  }

  if (spec.hasOwnProperty(COMMAND_SPLICE)) {
    ("production" !== "production" ? invariant(
      Array.isArray(value),
      'Expected %s target to be an array; got %s',
      COMMAND_SPLICE,
      value
    ) : invariant(Array.isArray(value)));
    ("production" !== "production" ? invariant(
      Array.isArray(spec[COMMAND_SPLICE]),
      'update(): expected spec of %s to be an array of arrays; got %s. ' +
      'Did you forget to wrap your parameters in an array?',
      COMMAND_SPLICE,
      spec[COMMAND_SPLICE]
    ) : invariant(Array.isArray(spec[COMMAND_SPLICE])));
    spec[COMMAND_SPLICE].forEach(function(args) {
      ("production" !== "production" ? invariant(
        Array.isArray(args),
        'update(): expected spec of %s to be an array of arrays; got %s. ' +
        'Did you forget to wrap your parameters in an array?',
        COMMAND_SPLICE,
        spec[COMMAND_SPLICE]
      ) : invariant(Array.isArray(args)));
      nextValue.splice.apply(nextValue, args);
    });
  }

  if (spec.hasOwnProperty(COMMAND_APPLY)) {
    ("production" !== "production" ? invariant(
      typeof spec[COMMAND_APPLY] === 'function',
      'update(): expected spec of %s to be a function; got %s.',
      COMMAND_APPLY,
      spec[COMMAND_APPLY]
    ) : invariant(typeof spec[COMMAND_APPLY] === 'function'));
    nextValue = spec[COMMAND_APPLY](nextValue);
  }

  for (var k in spec) {
    if (!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
      nextValue[k] = update(value[k], spec[k]);
    }
  }

  return nextValue;
}

module.exports = update;

},{"./Object.assign":4,"./invariant":5,"./keyOf":6}],8:[function(require,module,exports){
var type= require( 'elucidata-type'),
    shim= require( 'es6-collections'),
    $__0= require( './util'),startsWith=$__0.startsWith



  function Cursor(source, basePath) {"use strict";
    this.source= source
    this.basePath= type.isArray( basePath) ? basePath.join( '.') : basePath
  }

  Cursor.prototype.scopeTo=function(path) {"use strict";
    return Cursor.forPath( this.basePath +'.'+ path, this.source)
  };

  Cursor.prototype.onChange=function(handler) {"use strict";
    onSourceChange( this.source, this.basePath, handler)

    return function()  {
      offSourceChange( this.source, this.basePath, handler)
    }.bind(this)
  };

  Cursor.prototype.offChange=function(handler) {"use strict";
    offSourceChange( this.source, this.basePath, handler)

    return this
  };

  Cursor.prototype.getFullPath=function(path) {"use strict";
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
  };

  Cursor.forPath=function(path, source) {"use strict";
    return new Cursor( source, path)
  };

  // Just for internal, testing, usage!
  Cursor.listenerInfo=function(full) {"use strict";
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

    var report= { totalSources:totalSources, totalKeyWatches:totalKeyWatches, totalEventHandlers:totalEventHandlers }

    // if( full) {
    //   var handlers= ( JSON.stringify(_events_for_source))
    //   report.events_for_source= handlers
    //   console.dir( handlers)
    // }

    return report
  };




[ // Build pass-thru methods...
  'get', 'getPrevious', 'set', 'has', 'merge', 'push', 'unshift', 'splice',
  'map', 'each', 'forEach', 'reduce', 'filter', 'find', 'indexOf', 'isUndefined',
  'isNotUndefined', 'isDefined', 'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty',
  'isString', 'isNotString', 'isArray', 'isNotArray', 'isObject', 'isNotObject',
  'isNumber', 'isNotNumber'
].map(function( method){
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
      var $__0=  arguments,path=$__0[0],params=Array.prototype.slice.call($__0,1);
      params.unshift( this.getFullPath( path))
      return this.source[ method].apply( this.source, params)
    }
  }
}.bind(this))

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
    callbacks.forEach(function( fn){
      fn( changed_paths)
    })
  }
}

module.exports= Cursor

},{"./util":10,"elucidata-type":1,"es6-collections":2}],9:[function(require,module,exports){
/**
 * Ogre 2
 */
var type= require( 'elucidata-type'),
    update= require( 'react/lib/update'),
    assign= require( 'react/lib/Object.assign'),
    EventEmitter= require( 'eventemitter3'), // require( 'events').EventEmitter, //
    Cursor= require( './cursor'),
    CHANGE_KEY= 'change',
    $__0=   require( './util'),keyParts=$__0.keyParts,findPath=$__0.findPath,buildSpecGraph=$__0.buildSpecGraph,
    version= require( './version')

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
    this.$Ogre_emitter.setMaxListeners( 0 )
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
    return function()  {
      this.$Ogre_emitter.removeListener( CHANGE_KEY, fn )
    }.bind(this)
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



Ogre.version= version

// Helpers

module.exports= Ogre

},{"./cursor":8,"./util":10,"./version":11,"elucidata-type":1,"eventemitter3":3,"react/lib/Object.assign":4,"react/lib/update":7}],10:[function(require,module,exports){
var type= require( 'elucidata-type')

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

function uid ( radix){
  var now = Math.floor( (new Date()).getTime() / 1000 )
  radix= radix || 36

  while ( now <= _last_id ) {
    now += 1
  }

  _last_id= now

  return now.toString( radix)
}

/* global performance */
var now= (function(){
  if( typeof performance === 'object' && performance.now ) {
    return performance.now.bind( performance )
  }
  else if( Date.now ) {
    return Date.now.bind(Date)
  }
  else {
    return function() {
      return (new Date()).getTime()
    }
  }
})()

function startsWith( haystack, needle) {
  // position = position || 0;
  // return haystack.lastIndexOf(needle, position) === position;
  return haystack.indexOf( needle) == 0
}


module.exports= {
  keyParts:keyParts,
  findPath:findPath,
  buildSpecGraph:buildSpecGraph,
  uid:uid,
  now:now,
  startsWith:startsWith
}

},{"elucidata-type":1}],11:[function(require,module,exports){
module.exports= "0.3.6";
},{}]},{},[9])(9)
});
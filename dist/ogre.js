!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Ogre=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports= require('./lib/ogre')

},{"./lib/ogre":3}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('es6-collections');

var _elucidataType = require('elucidata-type');

var _elucidataType2 = _interopRequireDefault(_elucidataType);

var _util = require('./util');

var Cursor = (function () {
  function Cursor(source, basePath) {
    _classCallCheck(this, Cursor);

    this.source = source;
    this.basePath = _elucidataType2['default'].isArray(basePath) ? basePath.join('.') : basePath;
  }

  Cursor.prototype.scopeTo = function scopeTo(path) {
    return Cursor.forPath(this.basePath + '.' + path, this.source);
  };

  Cursor.prototype.onChange = function onChange(handler) {
    var _this = this;

    onSourceChange(this.source, this.basePath, handler);

    return function () {
      offSourceChange(_this.source, _this.basePath, handler);
    };
  };

  Cursor.prototype.offChange = function offChange(handler) {
    offSourceChange(this.source, this.basePath, handler);

    return this;
  };

  Cursor.prototype.getFullPath = function getFullPath(path) {
    var subPath = this.basePath;

    if (path) {
      if (_elucidataType2['default'].isArray(path)) {
        if (path.length > 0) {
          subPath += '.';
          subPath += path.join('.');
        }
      } else {
        subPath += '.';
        subPath += path;
      }
    }

    return subPath;
  };

  Cursor.forPath = function forPath(path, source) {
    return new Cursor(source, path);
  };

  // Just for internal, testing, usage!

  Cursor.listenerInfo = function listenerInfo() {
    var full = arguments[0] === undefined ? false : arguments[0];

    var totalSources = _eventsForSource.size,
        totalKeyWatches = 0,
        totalEventHandlers = 0;

    _eventsForSource.forEach(function (keyMap, source) {
      Object.keys(keyMap).forEach(function (key) {
        var handlers = keyMap[key];
        totalKeyWatches += 1;
        totalEventHandlers += handlers.length;
      });
    });

    var report = { totalSources: totalSources, totalKeyWatches: totalKeyWatches, totalEventHandlers: totalEventHandlers };

    // if( full) {
    //   let handlers= ( JSON.stringify(_eventsForSource))
    //   report.events_for_source= handlers
    //   console.dir( handlers)
    // }

    return report;
  };

  return Cursor;
})();

[// Build pass-thru methods...
'get', 'getPrevious', 'set', 'has', 'merge', 'push', 'unshift', 'splice', 'map', 'each', 'forEach', 'reduce', 'filter', 'find', 'indexOf', 'isUndefined', 'isNotUndefined', 'isDefined', 'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty', 'isString', 'isNotString', 'isArray', 'isNotArray', 'isObject', 'isNotObject', 'isNumber', 'isNotNumber'].map(function (method) {

  Cursor.prototype[method] = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var argsLen = args.length,
        path = undefined,
        params = undefined;
    if (argsLen === 0) {
      return this.source[method].call(this.source, this.basePath);
    } else if (argsLen === 1) {
      path = args[0];
      if (_assumedValueMethods.has(method)) {
        return this.source[method].call(this.source, this.basePath, path);
      } else {
        return this.source[method].call(this.source, this.getFullPath(path));
      }
    } else {
      path = args[0];
      params = args.slice(1);

      params.unshift(this.getFullPath(path));
      return this.source[method].apply(this.source, params);
    }
  };
});

var _eventsForSource = new Map(),
    _sourceHandlers = new WeakMap(),
    _assumedValueMethods = new Set(['set', 'merge', 'push', 'unshift', 'splice', 'indexOf', 'map', 'each', 'forEach', 'reduce', 'filter', 'find']);

function onSourceChange(source, key, handler) {
  handleEventsFor(source);

  var keyMap = _eventsForSource.get(source);

  keyMap[key] = keyMap[key] || [];
  keyMap[key].push(handler);
}

function offSourceChange(source, key, handler) {
  var keyMap = _eventsForSource.get(source);

  keyMap[key] = keyMap[key] || [];
  keyMap[key].splice(keyMap[key].indexOf(handler), 1);

  if (keyMap[key].length === 0) {
    delete keyMap[key];

    if (Object.keys(keyMap).length === 0) {
      var srcHandler = _sourceHandlers.get(source);

      source.offChange(srcHandler);
      _sourceHandlers['delete'](source);
      _eventsForSource['delete'](source);
    }
  }
}

function handleEventsFor(source) {
  if (!_eventsForSource.has(source)) {
    var handler = globalEventHandler.bind(this, source);

    source.onChange(handler);
    _eventsForSource.set(source, {});
    _sourceHandlers.set(source, handler);
  }
}

function globalEventHandler(source, changedPaths) {
  if (!_eventsForSource.has(source)) {
    console.log('Ghost bug: Cursor#globalEventHandler() called with a source no longer tracked!');
    return;
  }

  var trackedMap = _eventsForSource.get(source),
      trackedPaths = Object.keys(trackedMap),
      callbacks = [];

  if (trackedPaths && trackedPaths.length) {
    for (var i = 0; i < trackedPaths.length; i++) {
      var trackPath = trackedPaths[i];

      for (var j = 0; j < changedPaths.length; j++) {
        var changedPath = changedPaths[j];

        if ((0, _util.startsWith)(changedPath, trackPath)) {
          var cursor_callbacks = trackedMap[trackPath];

          callbacks = callbacks.concat(cursor_callbacks);
          break;
        }
      }
    }
  }

  if (callbacks.length) {
    callbacks.forEach(function (fn) {
      fn(changedPaths);
    });
  }
}

module.exports = Cursor;
},{"./util":4,"elucidata-type":6,"es6-collections":7}],3:[function(require,module,exports){
/**
 * Ogre 2
 */
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _elucidataType = require('elucidata-type');

var _elucidataType2 = _interopRequireDefault(_elucidataType);

var _reactLibUpdate = require('react/lib/update');

var _reactLibUpdate2 = _interopRequireDefault(_reactLibUpdate);

var _reactLibObjectAssign = require('react/lib/Object.assign');

var _reactLibObjectAssign2 = _interopRequireDefault(_reactLibObjectAssign);

var _eventemitter3 = require('eventemitter3');

var _eventemitter32 = _interopRequireDefault(_eventemitter3);

var _cursor = require('./cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _util = require('./util');

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

var CHANGE_KEY = 'change',
    OGRE_DEFAULTS = {
  batchChanges: true,
  maxHistory: 1,
  strict: true
};

var Ogre = (function () {
  function Ogre() {
    var initialState = arguments[0] === undefined ? {} : arguments[0];
    var options = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Ogre);

    if (!this instanceof Ogre) {
      return new Ogre(initialState, options);
    }

    this._root = initialState;
    this._changedKeys = [];
    this._timer = null;
    this._emitter = new _eventemitter32['default']();
    this.history = [];

    this.options = (0, _reactLibObjectAssign2['default'])({}, OGRE_DEFAULTS, options);

    // If it's a subclass that implements getInitialState()...
    if ('getInitialState' in this) {
      this._root = this.getInitialState(this._root);
    }
  }

  Ogre.prototype.scopeTo = function scopeTo(path) {
    return _cursor2['default'].forPath(path, this);
  };

  // Querying

  Ogre.prototype.get = function get(path, defaultValue) {
    if (path === '' || path == null) return this._root; // jshint ignore:line

    var value = (0, _util.findPath)(path, this._root);

    if (_elucidataType2['default'].isUndefined(value)) return defaultValue;else return value;
  };

  Ogre.prototype.getPrevious = function getPrevious(path) {
    var step = arguments[1] === undefined ? 0 : arguments[1];

    return (0, _util.findPath)(path, this.history[step] || {});
  };

  Ogre.prototype.map = function map(path, fn) {
    return this.get(path, []).map(fn);
  };

  // TODO: Each returns this???

  Ogre.prototype.each = function each(path, fn) {
    this.get(path, []).forEach(fn);
    return this;
  };

  Ogre.prototype.forEach = function forEach(path, fn) {
    return this.each(path, fn);
  };

  Ogre.prototype.filter = function filter(path, fn) {
    return this.get(path, []).filter(fn);
  };

  Ogre.prototype.reduce = function reduce(path, fn, initialValue) {
    return this.get(path, []).reduce(fn, initialValue);
  };

  Ogre.prototype.find = function find(path, fn) {
    var items = this.get(path, []),
        i = undefined,
        l = undefined;
    for (i = 0, l = items.length; i < l; i++) {
      var item = items[i];
      if (fn(item) === true) {
        return item;
      }
    }
    return void 0;
  };

  Ogre.prototype.indexOf = function indexOf(path, test) {
    return this.get(path).indexOf(test);
  };

  // Mutations

  Ogre.prototype.set = function set(path, value) {
    argCheck(arguments, 'set');
    this._changeDataset(path, { $set: value }, 'object');
    return this;
  };

  Ogre.prototype.merge = function merge(path, object) {
    this._changeDataset(path, { $merge: object }, 'object');
    return this;
  };

  Ogre.prototype.push = function push(path, array) {
    if (_elucidataType2['default'].isNotArray(array)) array = [array];
    this._changeDataset(path, { $push: array }, 'array');
    return this;
  };

  Ogre.prototype.unshift = function unshift(path, array) {
    if (_elucidataType2['default'].isNotArray(array)) array = [array];
    this._changeDataset(path, { $unshift: array }, 'array');
    return this;
  };

  Ogre.prototype.splice = function splice(path, start, howMany) {
    for (var _len = arguments.length, items = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      items[_key - 3] = arguments[_key];
    }

    var spec = undefined;
    if (arguments.length === 2) {
      spec = { $splice: start };
    } else {
      spec = { $splice: [[start, howMany].concat(items)] };
    }
    this._changeDataset(path, spec, 'array');
    return this;
  };

  // Observing

  Ogre.prototype.onChange = function onChange(fn) {
    var _this = this;

    this._emitter.on(CHANGE_KEY, fn);
    return function () {
      _this._emitter.removeListener(CHANGE_KEY, fn);
    };
  };

  Ogre.prototype.offChange = function offChange(fn) {
    this._emitter.removeListener(CHANGE_KEY, fn);
    return this;
  };

  // Type checking

  Ogre.prototype.has = function has(path) {
    return this.isNotEmpty(path);
  };

  Ogre.prototype.isUndefined = function isUndefined(path) {
    return _elucidataType2['default'].isUndefined(this.get(path));
  };

  Ogre.prototype.isNotUndefined = function isNotUndefined(path) {
    return _elucidataType2['default'].isNotUndefined(this.get(path));
  };

  Ogre.prototype.isDefined = function isDefined(path) {
    return _elucidataType2['default'].isNotUndefined(this.get(path));
  };

  Ogre.prototype.isNull = function isNull(path) {
    return _elucidataType2['default'].isNull(this.get(path));
  };

  Ogre.prototype.isNotNull = function isNotNull(path) {
    return _elucidataType2['default'].isNotNull(this.get(path));
  };

  Ogre.prototype.isEmpty = function isEmpty(path) {
    return _elucidataType2['default'].isEmpty(this.get(path));
  };

  Ogre.prototype.isNotEmpty = function isNotEmpty(path) {
    return _elucidataType2['default'].isNotEmpty(this.get(path));
  };

  Ogre.prototype.isString = function isString(path) {
    return _elucidataType2['default'].isString(this.get(path));
  };

  Ogre.prototype.isNotString = function isNotString(path) {
    return _elucidataType2['default'].isNotString(this.get(path));
  };

  Ogre.prototype.isArray = function isArray(path) {
    return _elucidataType2['default'].isArray(this.get(path));
  };

  Ogre.prototype.isNotArray = function isNotArray(path) {
    return _elucidataType2['default'].isNotArray(this.get(path));
  };

  Ogre.prototype.isObject = function isObject(path) {
    return _elucidataType2['default'].isObject(this.get(path));
  };

  Ogre.prototype.isNotObject = function isNotObject(path) {
    return _elucidataType2['default'].isNotObject(this.get(path));
  };

  Ogre.prototype.isNumber = function isNumber(path) {
    return _elucidataType2['default'].isNumber(this.get(path));
  };

  Ogre.prototype.isNotNumber = function isNotNumber(path) {
    return _elucidataType2['default'].isNotNumber(this.get(path));
  };

  Ogre.prototype._changeDataset = function _changeDataset(path, spec, containerType) {
    if (this._changedKeys.length === 0) {
      this.history.unshift(this._root);
      while (this.options.maxHistory >= 0 && this.history.length > this.options.maxHistory) {
        this.history.pop();
      }
    }
    if (this.options.strict === false) {
      (0, _util.findPath)(path, this._root, true, containerType);
    }

    this._root = (0, _reactLibUpdate2['default'])(this._root, (0, _util.buildSpecGraph)(path, spec));
    this._scheduleChangeEvent(path);
  };

  Ogre.prototype._scheduleChangeEvent = function _scheduleChangeEvent(key) {
    if (_elucidataType2['default'].isArray(key)) key = key.join('.');
    this._changedKeys.push(key);
    if (this.options.batchChanges === true) {
      if (this._timer === null) {
        this._timer = setTimeout(this._sendChangeEvents.bind(this), 0);
      }
    } else {
      this._sendChangeEvents();
    }
  };

  Ogre.prototype._sendChangeEvents = function _sendChangeEvents() {
    this._emitter.emit(CHANGE_KEY, this._changedKeys);
    this._changedKeys = [];
    this._timer = null;
  };

  Ogre.prototype._clearKeyCache = function _clearKeyCache() {
    _util.keyParts.clearCache();
  };

  return Ogre;
})();

Ogre.version = _version2['default'];

// Helpers

function argCheck(args) {
  var target = arguments[1] === undefined ? '' : arguments[1];

  if (args.length < 2) {
    throw new Error('Invalid ' + target + ' call: Requires path and value');
  }
}

module.exports = Ogre;
},{"./cursor":2,"./util":4,"./version":5,"elucidata-type":6,"eventemitter3":8,"react/lib/Object.assign":9,"react/lib/update":12}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.findPath = findPath;
exports.buildSpecGraph = buildSpecGraph;
exports.keyParts = keyParts;
exports.uid = uid;
exports.startsWith = startsWith;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _elucidataType = require('elucidata-type');

var _elucidataType2 = _interopRequireDefault(_elucidataType);

function findPath(path, source, create, containerType) {
  path = path || '';
  source = source || {};
  create = create === true ? true : false;

  if (path === '') {
    return source;
  }

  var parts = keyParts(path),
      obj = source,
      key = undefined;

  while (obj && parts.length) {
    key = parts.shift();

    if (create && _elucidataType2['default'].isUndefined(obj[key])) {

      if (parts.length === 0 && containerType === 'array') {
        obj[key] = [];
      } else {
        obj[key] = {};
      }
    }

    obj = obj[key];
  }

  return obj;
}

function buildSpecGraph(path, spec) {
  path = path || '';
  spec = spec || {};

  var graph = {};
  if (path === '') return graph;

  var parts = keyParts(path),
      obj = graph,
      key = undefined;

  while (parts.length) {
    key = parts.shift();

    if (parts.length === 0) {
      obj[key] = spec;
    } else {
      obj[key] = {};
    }

    obj = obj[key];
  }

  return graph;
}

function keyParts(path) {
  var arr = undefined;

  if (_elucidataType2['default'].isArray(path)) {
    return path.concat();
  }

  if (arr = keyCache[path]) {
    // jshint ignore:line
    return arr.concat();
  } else {
    arr = keyCache[path] = path.split('.');
    return arr.concat();
  }
}

var keyCache = {
  '': ['']
};

keyParts.clearCache = function () {
  keyCache = {
    '': ['']
  };
};

var _last_id = 0;

function uid(radix) {
  var now = Math.floor(new Date().getTime() / 1000);
  radix = radix || 36;

  while (now <= _last_id) {
    now += 1;
  }

  _last_id = now;

  return now.toString(radix);
}

/* global performance */
var now = (function () {
  if (typeof performance === 'object' && performance.now) {
    return performance.now.bind(performance);
  } else if (Date.now) {
    return Date.now.bind(Date);
  } else {
    return function () {
      return new Date().getTime();
    };
  }
})();

exports.now = now;

function startsWith(haystack, needle) {
  // position = position || 0;
  // return haystack.lastIndexOf(needle, position) === position;
  return haystack.indexOf(needle) == 0;
}
},{"elucidata-type":6}],5:[function(require,module,exports){
"use strict";

module.exports = "0.4.0";
},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"./Object.assign":9,"./invariant":10,"./keyOf":11}]},{},[1])(1)
});
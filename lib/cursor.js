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

      //if( _assumedValueMethods.has( method )) {
      if (_assumedValueMethods.indexOf(method) >= 0) {
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
    _assumedValueMethods = ['set', 'merge', 'push', 'unshift', 'splice', 'indexOf', 'map', 'each', 'forEach', 'reduce', 'filter', 'find'];

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
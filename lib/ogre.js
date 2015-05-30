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
        i,
        l;
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

    var spec;
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
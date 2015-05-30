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
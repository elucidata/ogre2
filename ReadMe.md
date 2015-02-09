# Ogre

> Object Graph Manager


## Contents

- [Overview](#overview)
- [API](#api)
- [Todo](#todo)
- [Building](#building)
- [License](#license)

<!-- end toc -->


## Overview

Built with React in mind, Ogre is a simple graph manager that leverages React's own [immutability helpers](http://facebook.github.io/react/docs/update.html) to update objects without changing the surrounding topography. Allows for efficient object equality checks.

``` javascript
shouldComponentUpdate( nextProps, _ ) {
    return this.props.item !== nextProps.item
}
```

Example:

``` javascript
var data= new Ogre({
    idList: [],
    itemMap: {}
})

data.onChange( function( changedKeys ){ /* Now you know */ } )

var item= { id:'ID1', name:'The First' }

// Both of these mutations will only result in a single
// 'onChange' event on the nextTick.
data.set('itemMap.ID1', item)
data.push('idList', item.id )

data.get('itemMap.ID1') === item // => true

```

Since the onChange event is accumulated, by default, you could have multiple stores (in a synchronous Flux pattern) all modify a global application state graph (ogre), and only trigger a single render call.


## API
### `new Ogre( initialState={}, options={} )`

**Options:**

| name           | description                                            | default |
|:---------------|:-------------------------------------------------------|:--------|
| `maxHistory`   | Number of old states to remember                       | 1       |
| `batchChanges` | Batch synchronous mutations into single 'change' event | true    |
| `strict`       | Throw error when mutating non-existing key paths       | true    |

If `strict` is `false`, Ogre will automatically create all the missing object paths (Rather like `mkdir -p` does). It will try to deduce the final leaf container type based on the operation being used. For example if using: `ogreData.push( 'new.deeply.nested.leaf')` Ogre knows that `push` is for Arrays, so it'll create the `leaf` container as an Array. By default any elements in between, if missing, will be objects.

### `get( path, defaultValue )`
### `set( path, value )`

### `scopeTo( path)`

Returns a lightweight 'cursor' object that has the same API as an Ogre object, but is bound to the specified `path` as the root. If you subscribe to events on cursors, the callbacks will only be triggered when an element of the graph has changed for this `path`.

### `getPrevious( path, step=0)`

Returns data from history. Step 0 is the previous version. If you set the `maxHistory` to a higher amount than the default of 1, you can get values up to that many steps back.

Note: Stored revisions of the graph are for the whole tree.

### `merge( path, object )`
### `push( path, array )`
### `unshift( path, array )`
### `splice( path, start, howMany, ...items) {`

### `map( path, fn )`
### `each( path, fn )`
### `forEach( path, fn )`
### `filter( path, fn )`
### `find( path, fn )`
### `indexOf( path, value )`
### `reduce( path, fn, initialValue )`

### `onChange( handlerFn )`
### `offChange( handlerFn )`

### `isUndefined( path )`
### `isNotUndefined( path )`
### `isDefined( path )`
### `isNull( path )`
### `isNotNull( path )`
### `isEmpty( path )`
### `isNotEmpty( path )`
### `isString( path )`
### `isNotString( path )`
### `isArray( path )`
### `isNotArray( path )`
### `isObject( path )`
### `isNotObject( path )`
### `isNumber( path )`
### `isNotNumber( path )`

## Todo

- Flesh out API docs.
- More examples.


## Building

Compile from `src/` to `lib/`:

    npm run build

Compiles for browser to `dist/`:

    npm run dist

Minify browser build:

    npm run minify

Run tests:

    npm test

The whole shebang:

    npm run all


## License

> The MIT License (MIT)
>
> Copyright (c) 2014 Elucidata unLTD
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

# Ogre 2

> Object Graph Engine


## Contents

- [Overview](#overview)
- [API](#api)
- [Todo](#todo)
- [Building](#building)
- [License](#license)

<!-- end toc -->


## Overview

Why an *engine*, you ask? 'Cause I needed the 'e' in Ogre to make sense. :)

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
### `new Ogre( defaultState={}, options={} )`

**Options:**

| name           | description                                            | default |
|:---------------|:-------------------------------------------------------|:--------|
| `maxHistory`   | Number of old states to remember                       | 1       |
| `batchChanges` | Batch synchronous mutations into single 'change' event | true    |
| `strict`       | Throw error when mutating non-existing key paths       | true    |

### `get( path, defaultValue )`

### `set( path, value )`

### `merge( path, object )`

### `push( path, array )`

### `unshift( path, array )`

### `splice( path, start, howMany, ...items) {`

### `map( path, fn )`
### `each( path, fn )`
### `filter( path, fn )`
### `find( path, fn )`
### `indexOf( path, value )`

### `onChange( handlerFn )`

### `offChange( handlerFn )`

### `isUndefined( path )`
### `isNotUndefined( path )`
### `isDefined( path )`
### `isNull( path )`
### `isNotNull( path )`
### `isEmpty( path )`
### `isNotEmpty( path )`


## Todo

- Flesh out API docs.
- More examples.
- Better test coverage.


## Building

Compile from `src/` to `lib/`:

    npm run build

Compiles for browser to `dist/`:

    npm run dist

Minify browser build:

    npm run minify

Run tests:

    npm test


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

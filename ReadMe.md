# Ogre 2

> Object Graph Engine

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

Since the onChange event is accumulated, you could have multiple stores (in a syncronous Flux pattern) all modify a global application state graph (ogre), and only trigger a single render call.

## Todo

- More/better docs.
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

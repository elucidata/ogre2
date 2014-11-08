# Ogre Notebook

> This document is for me to flesh out my thoughts on current or future features in Ogre. You're welcome to read (and comment) but it may only make to sense me.

## Contents

- [Ideas](#ideas)
    - [Undo/Redo Support](#undoredo-support)
- [Questions](#questions)
    - [Key Path Events](#key-path-events)
    - [Flux Integration](#flux-integration)

<!-- end toc -->

## Ideas

### Undo/Redo Support
Ogre keeps an internal history of previous states. The history length is configurable, and defaults to `1` (only the last state).

However, that history is different than a true 'undo' history. I think if you are using a global state object, there are some things that would be changed that you don't want to include in an 'undo' history. So a separate class for undo support seems in order. Or else, some sort of undo 'transaction' support within Ogre itself?

**Built in to Ogre:**

``` javascript
var data= new Ogre( defaultData, {
        maxHistory: 100, // Store last 100 changes in history
        batchChanges: false, // Emit and log each change instead of batching 'em
        undoable:true // Enable undo support (?)
    })

data.set('some.arbitrary.key', 'value')
data.set('some.arbitrary.key', 'value2')
data.undo()
data.get('some.arbitrary.key') === 'value' // => true
```

Perhaps a specific undo transaction would be needed to mark a particular history entry as 'undoable?'

``` javascript
data.undoable(( txn )=>{
    txn.set('some.arbitrary.key', 'newValue')
})

data.set('other.value', 'newValue')

data.undo() // Only reverts changes to 'some.arbitrary.key'
```

Or:

``` javascript
data.undoableStart()
data.set('some.arbitrary.key', 'newValue')
data.undoableEnd()

data.set('other.value', 'newValue')

data.undo() // Only reverts changes to 'some.arbitrary.key'
```

But then what happens if you forget to 'end' it?

**Separate support:**

``` javascript
var data= new Ogre( defaultData, {
        maxHistory: 100, // Store last 100 changes in history
        batchChanges: false // Emit and log each change instead of batching 'em
    }),
    undoMgr= new Ogre.UndoManager( data )

undoMgr.set('parent.child2.name', 'something')
data.set('parent.child1.name', 'other')

undoMgr.undo() // Reverts `parent.child2.name`, leaves `parent.child1.name` as is.
```

## Questions

### Key Path Events
In addition to the `change` event emitted by Ogre, should an event be emitted for each changed key path? Example:

``` javascript
var data= new Ogre({
    auth: {
        valid: false,
        user: null
    }
})

data.on('auth.valid', function( newValidValue ){
    if( newValidValue === true ) {
        // Logged in
    }
    else {
        // Logged out
    }
})
```

This is an interesting idea, but what are the implications? It seems like I'd want to want for changes within a base path, like `data.on('auth')` or `data.on('auth.*')`. EventEmitter doesn't support that AFAIK, I would need a custom implementation (or to support RegExp event names `data.on(/auth\../)`).

**Problems:**

I don't think I'm interested in building applications that are reactive to Ogre change events. This would inevitably lead to hairy event chains and cascades that are a pain to debug. No, the `change` event should purely be for notification of state change for display purposes.

### Flux Integration

Is there anything Flux-specific that would be useful to add or support?

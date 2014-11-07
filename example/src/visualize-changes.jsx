var React= require('react'),
    Ogre= require('../../lib/ogre'),
    randomColor = require('random-color')

var data= new Ogre({
  items: [
    { name:'Item 1'}
  ]
}), count= 2

window.data= data
console.log("Global `data` variable is available for mucking around:", data)

var Item= React.createClass({

  shouldComponentUpdate: function(nextProps, nextState) {
    return this.props.item !== nextProps.item
  },

  actionChangeItem(e) {
    e.preventDefault()
    console.log('changing', this.props.idx, this.props.item)
    var key= `items.${ this.props.idx }.name`
    data.set(key, data.get(key) ) // Setting the same value is 'touching' the object, so it will no longer strictly equate (===)
  },

  actionRemoveItem(e) {
    e.preventDefault()
    console.log('removing', this.props.idx, this.props.item)
    data.splice('items', this.props.idx, 1)
  },

  render() {
    var now= Date.now().toString(36),
        color= randomColor()
    return (
      <li>
        <small style={{ backgroundColor:color }}>{ now }</small>
        <span>{ this.props.item.name }</span>
        <button title="Change me..." onClick={ this.actionChangeItem }>...</button>
        <button title="Delete me..." onClick={ this.actionRemoveItem }>&times;</button>
      </li>
    )
  }
})

var Root= React.createClass({
  actionAdd(e) {
    e.preventDefault()
    data.push('items', { name:('Item '+ count++)})
  },

  render() {
    return (
      <div>
        <h4>Items:</h4>
        <ul>
        { this.props.items.map((item, i)=>{
            return <Item key={item.name} item={item} idx={i}/>
        })}
        </ul>
        <button onClick={this.actionAdd}>Add Item</button>
        <p>Each item gets a newly random color on every <code>render()</code> call. If the color doesn't change, then the underlying items didn't change (<code>this.props.item !== nextProps.item</code>)</p>
      </div>
    )
  }
})


function renderRoot() {
    React.render(
      <Root items={ data.get('items') }/>,
      document.body
    )
}

data.onChange( renderRoot )
renderRoot()

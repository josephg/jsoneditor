const html = require('choo/html')
const css = require('sheetify')

const container = css`
  :host {
    margin-left: 30px;
  }
`

const getPath = link => {
  const p = []
  for (let l = link; l != null; l = l.parent) p.unshift(l.k)
  return p
}

// const getAtPath = (data, path) => {
//   let container = data
//   for (let i = 0; i < path.length; i++) {
//     if (container == null) return undefined
//     container = container[path[i]]
//   }
//   return container
// }

// const setAtPath = (data, path, val) => {
//   let container = data
//   for (let i = 0; i < path.length - 1; i++) {
//     container = container[k]
//     // assert(container).
//   }
//   container[path[path.length - 1]] = val
// }

function strDiffToOp(oldval, newval) {
  if (oldval === newval) return null;

  let commonStart = 0
  while (oldval.charAt(commonStart) === newval.charAt(commonStart)) commonStart++

  var commonEnd = 0
  while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
      commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
    commonEnd++
  }

  const op = commonStart > 0 ? [commonStart] : []

  if (oldval.length !== commonStart + commonEnd) {
    op.push({d: oldval.length - commonStart - commonEnd})
    // ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
  }
  if (newval.length !== commonStart + commonEnd) {
    op.push(newval.slice(commonStart, newval.length - commonEnd))
    // ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
  }
  return op
}

const textEditClass = css`
  :host {
    font-family: inherit;
    font-size: inherit;
    border: none;
  }
  :host[type=text] {
    color: green;
  }
  :host[type=number] {
    color: dodgerblue;
  }
  :host:not(:focus) {
    background-color: transparent;
  }
`

const boolEditClass = css`
  :host {
    color: darkred;
    user-select: none;
  }
`

const keyClass = css`
  :host {
    font-size: 0.9em;
    font-weight: lighter;
    color: #444;
  }
`

const rowClass = css`
  :host:hover {
    background-color: rgba(255,255,255,0.5);
  }
`

function valueEditor({link, thing}, emit) {
  // console.log('thingue', thing, 'at', getPath(link))
  let view

  if (typeof thing === 'boolean') {
    view = html`<span class='${boolEditClass}'><label>
      <input type='checkbox' checked=${thing} onchange=${(e) => {
        const newval = e.target.checked
        emit('editor op', {path: getPath(link), component: {r:true, i:newval}})
      }} >${thing}
    </label></span>`
  } else if (typeof thing === 'string') {
    //size='${thing.length}'
    view = html`<span><input class='${textEditClass}' type=text value="${thing}" oninput=${(e) => {
      const newval = e.target.value
      emit('editor op', {path: getPath(link), component: {es: strDiffToOp(thing, newval)}})
    }} ></span>`
  } else if (typeof thing === 'number') {
    view = html`<span><input class='${textEditClass}' type=number value="${thing}" oninput=${(e) => {
      const newval = e.target.value
      emit('editor op', {path: getPath(link), component: {r: true, i:+newval}})
    }} ></span>`
  } else view = html`<span>${''+thing}</span>`

  return [
    view,
    null
  ]
}

const disclosureBtn = (state, path, emit) => {
  const toggle = () => emit('editor toggle expand', path)
  // TODO: replace this with a checkbox.
  const button = html`<button type='button' onclick=${toggle}>${state ? 'V' : '>'}</button>`
  return button
}

function objEditor({expand, link, thing}, emit) {
  const expandSelf = expand ? expand[0] : true
  const expandChildren = (expand && expand[1] && typeof expand[1] === 'object') ? expand[1] : {}

  // console.log('obj')
  const toggleBtn = disclosureBtn(expandSelf, getPath(link), emit)
  const keys = Object.keys(thing).sort()
  return [
    html`<span>{ Object (${keys.length}) ${toggleBtn} ${expandSelf ? '' : '}'}</span>`,
    expandSelf ? html`<div>
      <div class='${container}'>
        ${keys.map(k => {
          const [inline, child] = anyEditor({
            thing:thing[k],
            link:{parent: link, k},
            expand: expandChildren[k]
          }, emit)

          return html`<div class='${rowClass}'>
            <span><span class='${keyClass}'>${k}:</span> ${inline}</span>
            ${child}
          </div>`
        })}
      </div>}
    </div>` : null
  ]
}

const listItemClass = css`
  :host {
    cursor: pointer;
    cursor: -webkit-grab;
  }
  :host:hover {
    background-color: rgba(255,255,255,0.5);
  }
`

function listEditor({expand, link, thing}, emit) {
  const expandSelf = expand ? expand[0] : true
  const expandChildren = (expand && expand[1] && Array.isArray(expand[1])) ? expand[1] : []

  const toggleBtn = disclosureBtn(expandSelf, getPath(link), emit)
  return [
    html`<span>[ Array (${thing.length}) ${toggleBtn} ${expandSelf ? '' : ']'}</span>`,
    expandSelf ? html`<div>
      <div class='${container}'>
        ${thing.map((item, i) => {
          const [inline, child] = anyEditor({
            thing:item,
            link:{parent: link, k:i},
            expand: expandChildren[i],
          }, emit)
          return html`<div draggable=true class="${listItemClass}" ondragstart=${(e => {console.log(e)})}>
            <span><span class='${keyClass}'>${i}:</span> ${inline}</span>
            ${child}
          </div>`
        })}
      </div>
    ]</div>` : null
  ]
}

function anyEditor(item, emit) {
  const {thing} = item
  // console.log('anyedi', thing)
  if (thing == null) return valueEditor(item, emit)
  else if (Array.isArray(thing)) return listEditor(item, emit)
  else if (typeof thing === 'object') return objEditor(item, emit)
  else return valueEditor(item, emit)
}

const mainClass = css`
  :host {
    font-family: monospace;
    border-top: 4px solid #333;
    border-bottom: 4px solid #333;
    background-color: #eeeeee;
    padding: 5px 0;
  }
`


module.exports = (onEdit) => {
  const expand = [true, null]

  return {
    middleware(state, emitter) {

      emitter.on('editor toggle expand', (path) => {
        let e = expand
        // debugger
        path.forEach(p => {
          // The path item is a string for object keys and a number for lists.
          let children = e[1]
          if (typeof p === 'string') {
            if (children == null || Array.isArray(children)) e[1] = children = {}
          } else {
            if (children == null || !Array.isArray(children)) e[1] = children = []
          }
          if (children[p] == null) children[p] = [true, null]
          e = children[p]
        })

        e[0] = !e[0]
        // console.log('expand', JSON.stringify(expand))
        emitter.emit('render')
      })

      emitter.on('editor op', ({path, component}) => {
        const op = path
        op.push(component)
        onEdit(op)
        // console.log('op', op)
        // const oldval = getAtPath(state, dataPath)
        // const newval = json.apply(oldval, op)
        // setAtPath(state, dataPath, newval)
        // emitter.emit('render')
      })
    },

    view(thing, emit) {
      // const thing = getAtPath(state, dataPath)
      const [inline, child] = anyEditor({expand, thing}, emit)

      return html`<div class='${mainClass}'>
        <div>${inline}</div>
        ${child}
      </div>`
    }
  }

}


console.log('hi')
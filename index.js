const html = require('choo/html')
const json = require('ot-json1').type
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

function valueEditor({link, thing}, emit) {
  // console.log('thingue', thing, 'at', getPath(link))
  return [html`<span>${thing}</span>`, null]
}

const disclosureBtn = (state, path, emit) => {
  const toggle = () => emit('editor toggle expand', path)
  // TODO: replace this with a checkbox.
  const button = html`<button type=button onclick=${toggle}>${state ? 'V' : '>'}</button>`
  return button
}

function objEditor({expand, link, thing}, emit) {
  const expandSelf = expand ? expand[0] : true
  const expandChildren = (expand && expand[1] && typeof expand[1] === 'object') ? expand[1] : {}

  // console.log('obj')
  const toggleBtn = disclosureBtn(expandSelf, getPath(link), emit)
  const keys = Object.keys(thing)
  return [
    html`<span>{ (Object (${keys.length}) ${toggleBtn} ${expandSelf ? '' : '}'}</span>`,
    expandSelf ? html`<div>
      <div class='${container}'>
        ${keys.map(k => {
          const [inline, child] = anyEditor({
            thing:thing[k],
            link:{parent: link, k},
            expand: expandChildren[k]
          }, emit)

          return html`<div>
            <span>${k}: ${inline}</span>
            ${child}
          </div>`
        })}
      </div>}
    </div>` : null
  ]
}

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
          return html`<div>
            <span>${i}: ${inline}</span>
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

const editor = exports.editor = (expand, thing, emit) => {
  const [inline, child] = anyEditor({expand, thing}, emit)
  return html`<div class='${mainClass}'>
    <div>${inline}</div>
    ${child}
  </div>`
}

exports.middleware = (key) => (state, emitter) => {
  if (state[key] == null) state[key] = [true, null]
  const expand = state[key]

  emitter.on('editor toggle expand', (path) => {
    let e = expand
    path.forEach(p => {
      // The path item is a string for object keys and a number for lists.
      let children = expand[1]
      if (typeof p === 'string') {
        if (children == null || Array.isArray(children)) expand[1] = children = {}
      } else {
        if (children == null || !Array.isArray(children)) expand[1] = children = []
      }
      if (children[p] == null) children[p] = [true, null]
      e = children[p]
    })

    e[0] = !e[0]
    console.log('expand', JSON.stringify(expand))
    emitter.emit('render')
  })
}

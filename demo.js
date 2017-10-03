const choo = require('choo')
const html = require('choo/html')
const makeEditor = require('./index')
const css = require('sheetify')
const json = require('ot-json1').type

css`
html {
  box-sizing: border-box;
  font-size: 16px;
}

body, h1, h2, h3, h4, h5, h6, p, ol, ul {
  margin: 0;
  padding: 0;
  font-weight: normal;
}

*, *:before, *:after {
  box-sizing: inherit;
}

#editor {
  max-width: 600px;
  margin: 2em auto 0 auto;
}

h1, h2 {
  margin-top: 2em;
}
`

const app = choo()

// {editor, middleware}

// app.use(middleware)

let editorView

app.use((state, emitter) => {
  state.data = {x:45, z: null, y:'hi there', bool:true, ff:false, alist: ['a', 'b', {x:10}]}
  state.ops = null

  const editor = makeEditor((op) => {
    state.data = json.apply(state.data, op)
    console.log('applying op', op, '->', JSON.stringify(state.data))
    state.ops = json.compose(state.ops, op)
    emitter.emit('render')
  })

  app.use(editor.middleware)
  editorView = editor.view
})

app.route('/', mainView)
app.route('/jsoneditor', mainView)
app.mount('body')

function mainView (state, emit) {
  return html`
    <body>
      <div id=editor>
        <h1>JSON Editor demo!</h1>
        ${editorView(state.data, emit)}

        <h2>Aggregate operation:</h2>
        <pre style='font-family: monospace;'>${JSON.stringify(state.ops, null, 2)}</pre>
      </div>
      <div style=''>
      </div>
    </body>
  `
}

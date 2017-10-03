const choo = require('choo')
const html = require('choo/html')
const {editor, middleware} = require('./index')
const css = require('sheetify')

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
`

const app = choo()

app.use(middleware('expand'))
app.route('/', mainView)
app.mount('body')

function mainView (state, emit) {
  return html`
    <body>
      <h1>JSON Editor demo!</h1>
      ${editor(state.expand, {x:45, z: null, y:'hi there', bool:true, ff:false, alist: ['a', 'b', {x:10}]}, emit)}
    </body>
  `
}

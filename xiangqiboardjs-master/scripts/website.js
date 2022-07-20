// -----------------------------------------------------------------------------
// This file builds the website contents in the docs/ folder
// -----------------------------------------------------------------------------

// libraries
const fs = require('fs-plus')
const kidif = require('kidif')
const mustache = require('mustache')
const Terser = require('terser')
const csso = require('csso')
const path = require('path')

const encoding = { encoding: 'utf8' }

// grab some mustache templates
const headTemplate = fs.readFileSync(path.join('templates', '_head.mustache'), encoding)
const headerTemplate = fs.readFileSync(path.join('templates', '_header.mustache'), encoding)
const footerTemplate = fs.readFileSync(path.join('templates', '_footer.mustache'), encoding)
const homepageTemplate = fs.readFileSync(path.join('templates', 'homepage.mustache'), encoding)
const examplesTemplate = fs.readFileSync(path.join('templates', 'examples.mustache'), encoding)
const singleExampleTemplate = fs.readFileSync(path.join('templates', 'single-example.mustache'), encoding)
const docsTemplate = fs.readFileSync(path.join('templates', 'docs.mustache'), encoding)
const docsJSON = JSON.parse(fs.readFileSync(path.join('templates', 'docs.json'), encoding))

// dependent files
const latestPrettifyJS = fs.readFileSync(path.join('node_modules', 'code-prettify', 'src', 'prettify.js'), encoding)
const latestJQueryMinJS = fs.readFileSync(path.join('node_modules', 'jquery', 'dist', 'jquery.min.js'), encoding)
const latestNormalizeCSS = fs.readFileSync(path.join('node_modules', 'normalize.css', 'normalize.css'), encoding)

// grab the examples
const examplesArr = kidif(path.join('templates', 'examples', '*.example'))
const examplesObj = examplesArr.reduce((examplesObj, example) => {
  examplesObj[example.id] = example
  return examplesObj
}, {})

const examplesGroups = [
  {
    name: 'Basic Usage',
    examples: [1000, 1001, 1002, 1003, 1004]
  },
  {
    name: 'Config',
    examples: [2000, 2001, 2002, 2044, 2063, 2003, 2082, 2004, 2030, 2005, 2006]
  },
  {
    name: 'Methods',
    examples: [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007]
  },
  {
    name: 'Events',
    examples: [4000, 4001, 4002, 4003, 4004, 4005, 4006, 4011, 4012]
  },
  {
    name: 'Integration',
    examples: [5000, 5001, 5002, 5003, 5004, 5005]
  }
]

const homepageExample1 = 'const board1 = Xiangqiboard(\'board1\', \'start\')'

const homepageExample2 = `
const board2 = Xiangqiboard('board2', {
  draggable: true,
  dropOffBoard: 'trash',
  sparePieces: true
})

$('#startBtn').on('click', board2.start)
$('#clearBtn').on('click', board2.clear)`.trim()

function writeHomepage () {
  const headHTML = mustache.render(headTemplate, { pageTitle: 'Homepage' })

  const html = mustache.render(homepageTemplate, {
    head: headHTML,
    mostRecentVersion: buildMostRecentVersionHTML(),
    footer: footerTemplate,
    example1: homepageExample1,
    example2: homepageExample2
  })
  fs.writeFileSync(path.join('docs', 'index.html'), html, encoding)
}

function writeExamplesPage () {
  const headHTML = mustache.render(headTemplate, { pageTitle: 'Examples' })
  const headerHTML = mustache.render(headerTemplate, { examplesActive: true })

  const html = mustache.render(examplesTemplate, {
    head: headHTML,
    header: headerHTML,
    footer: footerTemplate,
    nav: buildExamplesNavHTML(),
    examplesJavaScript: buildExamplesJS()
  })
  fs.writeFileSync(path.join('docs', 'examples.html'), html, encoding)
}

function isIntegrationExample (example) {
  return (example.id + '').startsWith('5')
}

function writeSingleExamplePage (example) {
  if (isIntegrationExample(example)) example.includeXiangqiJS = true
  if (example.css) example.css = '\n' + example.css
  if (example.js) example.js = '\n' + example.js
  const html = mustache.render(singleExampleTemplate, example)
  fs.writeFileSync(path.join('docs', 'examples', example.id + '.html'), html, encoding)
}

function writeSingleExamplesPages () {
  examplesArr.forEach(writeSingleExamplePage)
}

const configTableRowsHTML = docsJSON.config.reduce(function (html, itm) {
  if (isString(itm)) return html
  return html + buildConfigDocsTableRowHTML('config', itm)
}, '')

const methodTableRowsHTML = docsJSON.methods.reduce(function (html, itm) {
  if (isString(itm)) return html
  return html + buildMethodRowHTML(itm)
}, '')

const errorRowsHTML = docsJSON.errors.reduce(function (html, itm) {
  if (isString(itm)) return html
  return html + buildErrorRowHTML(itm)
}, '')

function writeDocsPage () {
  const headHTML = mustache.render(headTemplate, { pageTitle: 'Documentation' })
  const headerHTML = mustache.render(headerTemplate, { docsActive: true })

  const html = mustache.render(docsTemplate, {
    head: headHTML,
    header: headerHTML,
    configTableRows: configTableRowsHTML,
    methodTableRows: methodTableRowsHTML,
    errorRows: errorRowsHTML,
    footer: footerTemplate
  })
  fs.writeFileSync('docs/docs.html', html, encoding)
}

function writeWebsite () {
  writeHomepage()
  writeExamplesPage()
  writeSingleExamplesPages()
  writeDocsPage()
}

function updateWebsite () {
  fs.writeFileSync(path.join('docs', 'js', 'prettify.min.js'), Terser.minify(latestPrettifyJS).code, encoding)
  fs.writeFileSync(path.join('docs', 'js', 'jquery.min.js'), latestJQueryMinJS, encoding)
  fs.writeFileSync(path.join('docs', 'css', 'normalize.min.css'), csso.minify(latestNormalizeCSS).css, encoding)
}

writeWebsite()
updateWebsite()

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------

function buildExamplesJS () {
  let txt = 'window.CHESSBOARD_EXAMPLES = {}\n\n'

  examplesArr.forEach(function (ex) {
    let css = ''
    if (ex.css) {
      css = '  css: ' + JSON.stringify(ex.css) + ',\n'
    }
    txt += 'CHESSBOARD_EXAMPLES["' + ex.id + '"] = {\n' +
      '  description: ' + JSON.stringify(ex.description) + ',\n' +
      css +
      '  html: ' + JSON.stringify(ex.html) + ',\n' +
      '  name: ' + JSON.stringify(ex.name) + ',\n' +
      '  jsStr: ' + JSON.stringify(ex.js) + ',\n' +
      '  jsFn: function () {\n' + ex.js + '\n  }\n' +
      '};\n\n'
  })

  return txt
}

function buildExamplesNavHTML () {
  let html = ''
  examplesGroups.forEach(function (group, idx) {
    html += buildExampleGroupHTML(idx, group.name, group.examples)
  })
  return html
}

function buildExampleGroupHTML (idx, groupName, examplesInGroup) {
  const groupNum = idx + 1
  let html = '<h4 id="groupHeader-' + groupNum + '">' + groupName + '</h4>' +
    '<ul id="groupContainer-' + groupNum + '" style="display:none">'

  examplesInGroup.forEach(function (exampleId) {
    const example = examplesObj[exampleId]
    html += '<li id="exampleLink-' + exampleId + '">' + example.name + '</li>'
  })

  html += '</ul>'

  return html
}

function buildConfigDocsTableRowHTML (propType, prop) {
  let html = ''

  // table row
  html += '<tr id="' + propType + ':' + prop.name + '">'

  // property and type
  html += '<td>' + buildPropertyAndTypeHTML(propType, prop.name, prop.type) + '</td>'

  // Required
  html += '<td class="center">' + buildRequiredHTML(prop.req) + '</td>'

  // default
  html += '<td class="center"><p>' + buildDefaultHTML(prop.default) + '</p></td>'

  // description
  html += '<td>' + buildDescriptionHTML(prop.desc) + '</td>'

  // examples
  html += '<td>' + buildExamplesCellHTML(prop.examples) + '</td>'

  html += '</tr>'

  return html
}

function buildMethodRowHTML (method) {
  const nameNoParents = method.name.replace(/\(.+$/, '')

  let html = ''

  // table row
  if (method.noId) {
    html += '<tr>'
  } else {
    html += '<tr id="methods:' + nameNoParents + '">'
  }

  // name
  html += '<td><p><a href="docs.html#methods:' + nameNoParents + '">' +
    '<code class="js plain">' + method.name + '</code></a></p></td>'

  // args
  if (method.args) {
    html += '<td>'
    method.args.forEach(function (arg) {
      html += '<p>' + arg[1] + '</p>'
    })
    html += '</td>'
  } else {
    html += '<td><small>none</small></td>'
  }

  // description
  html += '<td>' + buildDescriptionHTML(method.desc) + '</td>'

  // examples
  html += '<td>' + buildExamplesCellHTML(method.examples) + '</td>'

  html += '</tr>'

  return html
}

function buildErrorRowHTML (error) {
  let html = ''

  // table row
  html += '<tr id="errors:' + error.id + '">'

  // id
  html += '<td class="center">' +
    '<p><a href="docs.html#errors:' + error.id + '">' + error.id + '</a></p></td>'

  // desc
  html += '<td><p>' + error.desc + '</p></td>'

  // more information
  if (error.fix) {
    if (!Array.isArray(error.fix)) {
      error.fix = [error.fix]
    }

    html += '<td>'
    error.fix.forEach(function (p) {
      html += '<p>' + p + '</p>'
    })
    html += '</td>'
  } else {
    html += '<td><small>n/a</small></td>'
  }

  html += '</tr>'

  return html
}

function buildPropertyAndTypeHTML (section, name, type) {
  return '<p><a href="docs.html#' + section + ':' + name + '">' +
    '<code class="js plain">' + name + '</code></a></p>' +
    '<p class=property-type-7ae66>' + buildTypeHTML(type) + '</p>'
}

function buildTypeHTML (type) {
  if (!Array.isArray(type)) {
    type = [type]
  }

  let html = ''
  for (let i = 0; i < type.length; i++) {
    if (i !== 0) {
      html += ' <small>or</small><br />'
    }
    html += type[i]
  }

  return html
}

function buildRequiredHTML (req) {
  if (!req) return 'no'
  if (req === true) return 'yes'
  return req
}

function buildDefaultHTML (defaultValue) {
  if (!defaultValue) {
    return '<small>n/a</small>'
  }
  return defaultValue
}

function buildDescriptionHTML (desc) {
  if (!Array.isArray(desc)) {
    desc = [desc]
  }

  let html = ''
  desc.forEach(function (d) {
    html += '<p>' + d + '</p>'
  })

  return html
}

function buildExamplesCellHTML (examplesIds) {
  if (!Array.isArray(examplesIds)) {
    examplesIds = [examplesIds]
  }

  let html = ''
  examplesIds.forEach(function (exampleId) {
    const example = examplesObj[exampleId]
    if (!example) return
    html += '<p><a href="examples.html#' + exampleId + '">' + example.name + '</a></p>'
  })

  return html
}

function buildMostRecentVersionHTML () {
  const VERSION = JSON.parse(fs.readFileSync('package.json', encoding)).version
  return '<a href="https://github.com/lengyanyu258/xiangqiboardjs/releases/download/v'
    + VERSION + '/xiangqiboardjs-' + VERSION + '.zip">Download v' + VERSION + '</a>'
}

function isString (s) {
  return typeof s === 'string'
}

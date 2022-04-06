const fs = require('fs')
const files = fs.readdirSync(__filename.split('\\').at(-2))
files.splice(files.indexOf(__filename.split('\\').at(-1)), 1)
files.forEach(f => {
    exports[f.split('.')[0]] = require('./' + f)
});
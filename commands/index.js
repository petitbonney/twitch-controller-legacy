const fs = require('fs')
const path = require('path');
const split = __filename.split(path.sep)
const files = fs.readdirSync(split[split.length-2])
files.splice(files.indexOf(split[split.length-1]), 1)
files.forEach(f => {
    exports[f.split('.')[0]] = require('./' + f)
});
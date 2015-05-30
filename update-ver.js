var p= require('./package.json'),
    content= 'module.exports= "'+ p.version +'";',
    fs= require('fs')


fs.writeFileSync( './lib/version.js', content, { flag:'w' })
fs.writeFileSync( './src/version.js', content, { flag:'w' })

console.log( "Updated to: "+ p.version )

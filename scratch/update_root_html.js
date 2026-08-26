const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let newHtml = html.replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n', '');

newHtml = newHtml.replace(/<script type="text\/babel">[\s\S]*?<\/script>/, '<script src="react_app.js?v=41.2"></script>');

fs.writeFileSync('index.html', newHtml);
console.log("Root HTML actualizado.");

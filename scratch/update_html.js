const fs = require('fs');
const html = fs.readFileSync('dashboard/index.html', 'utf8');

// Eliminar el script de Babel Standalone
let newHtml = html.replace('<script src="https://unpkg.com/@babel/standalone@7.22.20/babel.min.js"></script>\n', '');

// Reemplazar todo el bloque <script type="text/babel"> ... </script>
newHtml = newHtml.replace(/<script type="text\/babel">[\s\S]*?<\/script>/, '<script src="react_app.js?v=41.2"></script>');

fs.writeFileSync('dashboard/index.html', newHtml);
console.log("HTML actualizado.");

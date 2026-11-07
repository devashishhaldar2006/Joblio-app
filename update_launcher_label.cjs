const fs = require('fs');
const file = 'innovatex/mobile/app.json';
let appJson = JSON.parse(fs.readFileSync(file, 'utf8'));

// Android launcher label under icon
appJson.expo.name = "Wingr";

// Android launcher label explicit override
if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.label = "Wingr";

fs.writeFileSync(file, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
console.log('Updated app.json: Launcher label set strictly to Wingr');

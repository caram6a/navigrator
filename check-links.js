const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('=== БЛОКИРУЮЩИЕ ЭЛЕМЕНТЫ ===');
    // pointer-events
    console.log('pointer-events:none:', (d.match(/pointer-events:\s*none/gi) || []).length);
    // position fixed/absolute с z-index
    console.log('position:fixed/absolute:', (d.match(/<div[^>]*(?:fixed|absolute)[^>]*?(?:z-\d+|inset-0|top-0)[^>]*>/gi) || []).length);
    // opacity:0
    console.log('opacity:0:', (d.match(/opacity:\s*0[^.]/gi) || []).length);
    // display:none
    console.log('display:none:', (d.match(/display:\s*none/gi) || []).length);

    console.log('\n=== ССЫЛКИ ===');
    const regex = /<a[\s\S]*?href="([^"]*)"[\s\S]*?<\/a>/g;
    let m;
    while ((m = regex.exec(d)) !== null) {
      const text = m[0].replace(/<[^>]*>/g, '').trim().slice(0, 25);
      console.log('  "' + text + '" -> ' + m[1] + ' (длина href: ' + m[1].length + ')');
    }

    console.log('\n=== ПРОВЕРЯЮ /register ===');
    http.get('http://localhost:3000/register', (r2) => {
      let d2 = '';
      r2.on('data', c => d2 += c);
      r2.on('end', () => console.log('  /register: ' + r2.statusCode));
    });
    console.log('=== ПРОВЕРЯЮ /test ===');
    http.get('http://localhost:3000/test', (r3) => {
      let d3 = '';
      r3.on('data', c => d3 += c);
      r3.on('end', () => console.log('  /test: ' + r3.statusCode));
    });
  });
});
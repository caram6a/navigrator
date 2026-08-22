const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('=== ВСЕ ССЫЛКИ НА ГЛАВНОЙ ===');
    const regex = /<a[\s\S]*?href="([^"]*)"[\s\S]*?<\/a>/g;
    let match;
    while ((match = regex.exec(d)) !== null) {
      const text = match[0].replace(/<[^>]*>/g, '').trim().slice(0, 30);
      console.log('  "' + text + '" -> ' + match[1]);
    }

    console.log('\n=== Проверяю /register ===');
    http.get('http://localhost:3000/register', (r2) => {
      let d2 = '';
      r2.on('data', c => d2 += c);
      r2.on('end', () => console.log('  /register: ' + r2.statusCode + ' (' + d2.length + ' bytes)'));
    });

    console.log('=== Проверяю /test ===');
    http.get('http://localhost:3000/test', (r3) => {
      let d3 = '';
      r3.on('data', c => d3 += c);
      r3.on('end', () => console.log('  /test: ' + r3.statusCode + ' (' + d3.length + ' bytes)'));
    });
  });
});
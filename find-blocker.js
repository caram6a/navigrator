const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Ищем элемент с position:relative, absolute или fixed который может перекрывать
    const regex = /<div[^>]*(?:fixed|absolute|sticky|relative)[^>]*>/gi;
    let m;
    while ((m = regex.exec(d)) !== null) {
      const el = m[0];
      // Проверяем, перекрывает ли он по z-index или inset
      if (el.includes('z-') || el.includes('inset-') || el.includes('top-0') || el.includes('bottom-0')) {
        console.log('НАЙДЕНО:', el.substring(0, 250));
        // Показываем контекст
        const start = Math.max(0, m.index - 100);
        const end = Math.min(d.length, m.index + 500);
        console.log('КОНТЕКСТ:', d.substring(start, end));
        console.log('---');
      }
    }
    
    // Ищем gradient overlay (bg-gradient-to-br с absolute
    const gradRegex = /bg-gradient[^>]*absolute/gi;
    if (gradRegex.test(d)) {
      console.log('НАЙДЕН GRADIENT OVERLAY!');
      gradRegex.lastIndex = 0;
      const match = gradRegex.exec(d);
      if (match) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(d.length, match.index + 300);
        console.log('GRADIENT CONTEXT:', d.substring(start, end));
      }
    }
  });
});
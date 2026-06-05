const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');  // ← import langsung, bukan destructuring

const PDF_FOLDER = './pdf-articles';
const OUTPUT_FILE = './articles.json';

async function extractAll() {
  console.log('Starting PDF extraction...');

  const files = fs.readdirSync(PDF_FOLDER).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files`);

  const articles = [];

  for (const file of files) {
    console.log(`Processing: ${file}...`);
    try {
      const buffer = fs.readFileSync(path.join(PDF_FOLDER, file));
      const data = await pdf(buffer);  // ← pdf() dipanggil sebagai function

      const article = {
        id: path.basename(file, '.pdf').replace(/\s+/g, '-').toLowerCase(),
        title: path.basename(file, '.pdf'),
        content: data.text.replace(/\s+/g, ' ').trim(),
        source: file,
        pages: data.numpages
      };

      articles.push(article);
      console.log(`  ✓ OK — ${data.numpages} halaman, ${data.text.length} karakter`);
    } catch (err) {
      console.warn(`  ✗ Skipped: ${file} (${err.message})`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2));
  console.log(`\nSelesai! ${articles.length} artikel disimpan ke ${OUTPUT_FILE}`);
}

extractAll();
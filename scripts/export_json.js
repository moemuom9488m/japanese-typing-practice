import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QUIZ_DATA } from '../src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'raw_data.json');
fs.writeFileSync(outputPath, JSON.stringify(QUIZ_DATA, null, 2));
console.log(`Successfully exported ${QUIZ_DATA.length} quiz items to raw_data.json`);

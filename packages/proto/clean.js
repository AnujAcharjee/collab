import fs from 'fs';

if (fs.existsSync('./generated')) {
  fs.rmSync('./generated', { recursive: true, force: true });
}

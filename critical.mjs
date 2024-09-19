import { generate } from 'critical';
import { promises as fs } from 'fs';
import path from 'path';

const basePath = 'dist/';

async function generateCriticalCss(file) {
    const srcPath = path.join(basePath, file);
    const backupPath = path.join(basePath, `backup_${file}`);

    try {
        // Backup the original HTML file
        await fs.copyFile(srcPath, backupPath);
        console.log(`Backup of ${file} created.`);

        // Generate and inline critical CSS
        await generate({
            inline: true,
            base: basePath,
            src: file,
            target: file,
            width: 1300,
            height: 900
        });
        console.log(`Critical CSS generated and inlined for ${file}`);
    } catch (err) {
        // Restore backup if something went wrong
        await fs.copyFile(backupPath, srcPath);
        console.error(`Error generating Critical CSS for ${file}:`, err);
    }
}

async function runCritical() {
    try {
        const files = await fs.readdir(basePath);
        const htmlFiles = files.filter(file => file.endsWith('.html'));

        for (const file of htmlFiles) {
            await generateCriticalCss(file);
        }
    } catch (err) {
        console.error('Error processing HTML files:', err);
    }
}

runCritical();
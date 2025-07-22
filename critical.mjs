import { generate } from 'critical';
import { promises as fs } from 'fs';
import path from 'path';

const basePath = 'dist/';
const args = process.argv.slice(2);

async function generateCriticalCss(file) {
    const srcPath = path.join(basePath, file);
    const backupPath = path.join(basePath, `backup_${file}`);

    try {
        await fs.access(srcPath);

        await fs.copyFile(srcPath, backupPath);
        // console.log(`Backup created for ${file}`);

        await generate({
            inline: true,
            base: basePath,
            src: file,
            target: file,
            width: 1300,
            height: 900
        });

        // console.log(`Critical CSS generated for ${file}`);
    } catch (err) {
        if (await fileExists(backupPath)) {
            await fs.copyFile(backupPath, srcPath);
            // console.error(`Error on ${file}. Restored from backup.`);
        }
        // console.error(`${file} error:`, err.message);
    }
}

async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function runCritical() {
    try {
        let htmlFiles;

        if (args.length === 0) {
            const allFiles = await fs.readdir(basePath);
            htmlFiles = allFiles.filter(file => file.endsWith('.html'));
            // console.log(`Processing all HTML files in ${basePath}`);
        } else {
            htmlFiles = args;
            // console.log(`Processing specified file(s): ${htmlFiles.join(', ')}`);
        }

        for (const file of htmlFiles) {
            await generateCriticalCss(file);
        }
    } catch (err) {
        // console.error('Failed during execution:', err);
    }
}

runCritical();
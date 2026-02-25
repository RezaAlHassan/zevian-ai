import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (f.endsWith('.tsx') && !dirPath.includes('ui\\')) {
            callback(path.join(dir, f));
        }
    });
}

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. IMPORTS
    // Generic replacer for old component imports
    const replaceImport = (baseName, uiName) => {
        const rx1 = new RegExp(`import ${baseName} from ['"](.*?)components/${baseName}['"];?`, 'g');
        content = content.replace(rx1, `import { ${baseName} } from '$1components/ui/${uiName}';`);
        const rx2 = new RegExp(`import ${baseName} from ['"]\\./${baseName}['"];?`, 'g');
        content = content.replace(rx2, `import { ${baseName} } from './ui/${uiName}';`);
    };

    replaceImport('Button', 'button');
    replaceImport('Badge', 'badge');
    replaceImport('Input', 'input');
    replaceImport('Checkbox', 'checkbox');

    // Fix halfway AST modifiers: `import Button from "../components/ui/button"` -> `import { Button } }`
    content = content.replace(/import Button from ['"](.*?)components\/ui\/button['"];?/g, "import { Button } from '$1components/ui/button';");
    content = content.replace(/import Button from ['"]\.\/ui\/button['"];?/g, "import { Button } from './ui/button';");

    content = content.replace(/import Badge from ['"](.*?)components\/ui\/badge['"];?/g, "import { Badge } from '$1components/ui/badge';");
    content = content.replace(/import Badge from ['"]\.\/ui\/badge['"];?/g, "import { Badge } from './ui/badge';");

    // 2. PROPS
    // Button Variants & Sizes
    content = content.replace(/<Button([^>]*)variant=['"]primary['"]([^>]*)>/g, '<Button$1$2>');
    content = content.replace(/<Button([^>]*)variant=['"]danger['"]([^>]*)>/g, '<Button$1variant="destructive"$2>');
    content = content.replace(/<Button([^>]*)size=['"]md['"]([^>]*)>/g, '<Button$1$2>');
    content = content.replace(/<Button([^>]*)fullWidth(=\{true\})?([^>]*)>/g, '<Button$1className="w-full"$3>');
    content = content.replace(/<Button([^>]*)isLoading(=\{true\})?([^>]*)>/g, '<Button$1disabled={true} className="opacity-50 cursor-not-allowed"$3>');

    // Icons in Button (Regex handling of basic cases)
    // E.g. icon={ArrowLeft} iconPosition="left"
    content = content.replace(/<Button([^>]*)icon=\{([a-zA-Z0-9_]+)\}([^>]*)>/g, (match, p1, iconName, p3) => {
        // If iconPosition="right" isn't present, we'll prepend. We can't robustly do AST wrapping with Regex,
        // so we'll just drop the prop and let manual fixes handle complex icon mappings, or inject it right after the tag if it's self closing,
        // but React buttons have children. So we just leave the icon out for now - manual fix is safer than breaking JSX tree.
        // Actually, shedding the wrapper props and fixing them visually might be required.
        // Let's just remove the icon prop to avoid React errors (Shadcn Button doesn't accept `icon` prop).
        return `<Button${p1} data-icon="${iconName}"${p3}>`;
    });
    content = content.replace(/iconPosition=['"][^'"]+['"]/g, '');

    content = content.replace(/<Button([^>]*)data-icon="([a-zA-Z0-9_]+)"([^>]*)>([\s\S]*?)<\/Button>/g, (match, p1, iconName, p3, children) => {
        return `<Button${p1}${p3}>\n<${iconName} className="mr-2 h-4 w-4" />\n${children}</Button>`;
    });
    content = content.replace(/<Button([^>]*)data-icon="([a-zA-Z0-9_]+)"([^>]*)\/>/g, (match, p1, iconName, p3) => {
        return `<Button${p1}${p3}>\n<${iconName} className="mr-2 h-4 w-4" />\n</Button>`;
    });

    // Badge Variants
    content = content.replace(/<Badge([^>]*)variant=['"]success['"]([^>]*)>/g, '<Badge$1variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"$2>');
    content = content.replace(/<Badge([^>]*)variant=['"]warning['"]([^>]*)>/g, '<Badge$1variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"$2>');
    content = content.replace(/<Badge([^>]*)variant=['"]info['"]([^>]*)>/g, '<Badge$1variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"$2>');

    // Input & Checkbox (Already handled by extending shadcn wrapper!)

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Modified: ${filePath}`);
    }
}

const baseDir = path.dirname(__dirname); // one level up from scripts
walkDir(path.join(baseDir, 'pages'), refactorFile);
walkDir(path.join(baseDir, 'components'), refactorFile);
console.log('Codemod regex script complete.');

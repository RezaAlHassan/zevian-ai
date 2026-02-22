const fs = require('fs');
const path = require('path');

const replacements = {
    'bg-surface-elevated': 'bg-goten',
    'bg-surface/50': 'bg-gohan/50',
    'bg-surface/30': 'bg-gohan/30',
    'bg-surface/20': 'bg-gohan/20',
    'bg-surface': 'bg-gohan',
    'border-border': 'border-beerus',
    'text-on-surface-secondary': 'text-trunks',
    'text-on-surface-tertiary': 'text-trunks/70',
    'text-on-surface': 'text-bulma',
    'text-primary': 'text-piccolo',
    'bg-primary': 'bg-piccolo',
    'bg-primary/20': 'bg-piccolo/20',
    'bg-primary/10': 'bg-piccolo/10',
    'bg-primary/5': 'bg-piccolo/5',
    'bg-primary-hover': 'bg-piccolo/90',
    'border-primary/20': 'border-piccolo/20',
    'border-primary/10': 'border-piccolo/10',
    'border-primary/30': 'border-piccolo/30',
    'text-error': 'text-dodoria',
    'bg-error/5': 'bg-dodoria/5',
    'bg-error/10': 'bg-dodoria/10',
    'border-error/20': 'border-dodoria/20',
    'shadow-sm': 'shadow-moon-sm',
    'shadow-lg': 'shadow-moon-lg',
    'rounded-lg': 'rounded-moon-s-md',
    'rounded-xl': 'rounded-moon-s-lg',
    'rounded-2xl': 'rounded-moon-s-xl',
    'text-xs': 'text-moon-12',
    'text-sm': 'text-moon-14',
    'text-base': 'text-moon-16',
    'text-lg': 'text-moon-18',
    'text-xl': 'text-moon-20',
    'text-2xl': 'text-moon-24',
};

// Also apply to ProjectsPage and StatCard
const files = [
    'pages/DashboardPage.tsx',
    'pages/ProjectsPage.tsx',
    'components/StatCard.tsx',
    'components/UserProjectsModal.tsx',
    'pages/OrganizationPage.tsx',
    'components/OrganizationUsersTab.tsx',
];

for (const filePath of files) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) continue;
    let fileContent = fs.readFileSync(fullPath, 'utf8');

    for (const [key, value] of Object.entries(replacements)) {
        // Escape special characters for regex
        const safeKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Look for the class string bounded by space, quote, or backtick
        const regex = new RegExp(`(?<=\\s|["'\`>])${safeKey}(?=\\s|["'\`<])`, 'g');
        fileContent = fileContent.replace(regex, value);
    }

    fs.writeFileSync(fullPath, fileContent);
    console.log(`Updated ${filePath}`);
}

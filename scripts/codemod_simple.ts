import { API, FileInfo, Options } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API, options: Options) {
    const j = api.jscodeshift;
    const root = j(file.source);
    let hasChanges = false;

    // --- 1. Replace Imports ---
    const replaceImport = (sourceValue: string, newSource: string, importName: string) => {
        root.find(j.ImportDeclaration, { source: { value: sourceValue } })
            .forEach((path: any) => {
                const specifiers = path.node.specifiers || [];
                const hasMatch = specifiers.some((s: any) => s.local.name === importName);
                if (hasMatch) {
                    path.node.source.value = newSource;
                    hasChanges = true;
                    // If named import Badge, change to named import Badge from ui/badge
                    if (specifiers[0].type === 'ImportSpecifier' && importName === 'Badge') {
                        // keep it as named import
                    }
                }
            });
    };

    // Button Imports
    ['../components/Button', '../../components/Button', './components/Button', './Button'].forEach(src => {
        const isTwoUp = src.startsWith('../../');
        const isSameDir = src.startsWith('./Button');
        let newSrc = '../components/ui/button';
        if (isTwoUp) newSrc = '../../components/ui/button';
        if (isSameDir) newSrc = './ui/button';
        replaceImport(src, newSrc, 'Button');
    });

    // Badge Imports
    ['../components/Badge', '../../components/Badge', './components/Badge', './Badge'].forEach(src => {
        const isTwoUp = src.startsWith('../../');
        const isSameDir = src.startsWith('./Badge');
        let newSrc = '../components/ui/badge';
        if (isTwoUp) newSrc = '../../components/ui/badge';
        if (isSameDir) newSrc = './ui/badge';
        replaceImport(src, newSrc, 'Badge');
    });


    // --- 2. Transform Button ---
    root.find(j.JSXElement, { openingElement: { name: { name: 'Button' } } }).forEach((path: any) => {
        const attributes = path.node.openingElement.attributes;
        if (!attributes) return;

        let classesToAdd: string[] = [];
        const newAttributes: any[] = [];
        let hasIcon = false;
        let iconName = '';
        let isIconRight = false;
        let isLoading = false;

        attributes.forEach((attr: any) => {
            if (attr.type === 'JSXAttribute') {
                const name = attr.name.name;

                if (name === 'variant') {
                    if (attr.value && attr.value.type === 'StringLiteral') {
                        const val = attr.value.value;
                        if (val === 'danger') newAttributes.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('destructive')));
                        else if (val !== 'primary') newAttributes.push(attr); // keep others, drop primary (default)
                    } else {
                        newAttributes.push(attr);
                    }
                } else if (name === 'size') {
                    if (attr.value && attr.value.type === 'StringLiteral') {
                        if (attr.value.value !== 'md') newAttributes.push(attr); // drop md (default)
                    } else {
                        newAttributes.push(attr);
                    }
                } else if (name === 'fullWidth') {
                    classesToAdd.push('w-full');
                } else if (name === 'isLoading') {
                    isLoading = true;
                    // Add disabled attr
                    newAttributes.push(j.jsxAttribute(j.jsxIdentifier('disabled'), j.jsxExpressionContainer(j.booleanLiteral(true))));
                    classesToAdd.push('opacity-50', 'cursor-not-allowed');
                } else if (name === 'icon') {
                    hasIcon = true;
                    if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                        iconName = attr.value.expression.name;
                    }
                } else if (name === 'iconPosition') {
                    if (attr.value && attr.value.type === 'StringLiteral') {
                        isIconRight = attr.value.value === 'right';
                    }
                } else if (name === 'className') {
                    // handled later
                    newAttributes.push(attr);
                } else {
                    newAttributes.push(attr);
                }
            } else {
                newAttributes.push(attr); // JSXSpreadAttribute etc.
            }
        });

        if (classesToAdd.length > 0) {
            let classNameAttr = newAttributes.find(a => a.name && a.name.name === 'className');
            if (classNameAttr) {
                if (classNameAttr.value.type === 'StringLiteral') {
                    classNameAttr.value.value = `${classesToAdd.join(' ')} ${classNameAttr.value.value}`;
                } else if (classNameAttr.value.type === 'JSXExpressionContainer' && classNameAttr.value.expression.type === 'StringLiteral') {
                    classNameAttr.value.expression.value = `${classesToAdd.join(' ')} ${classNameAttr.value.expression.value}`;
                }
            } else {
                newAttributes.push(j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral(classesToAdd.join(' '))));
            }
        }

        path.node.openingElement.attributes = newAttributes;

        // Handle children transformation for icons/loading
        if (iconName && !isLoading) { // Simplify: don't do spinner if we have an icon logic, just use icon mapping
            const iconElement = j.jsxElement(
                j.jsxOpeningElement(j.jsxIdentifier(iconName), [
                    j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral(isIconRight ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"))
                ], true),
                null,
                []
            );
            const children = path.node.children || [];
            path.node.children = isIconRight ? [...children, iconElement] : [iconElement, ...children];
        }
    });


    // --- 3. Transform Badge ---
    root.find(j.JSXElement, { openingElement: { name: { name: 'Badge' } } }).forEach((path: any) => {
        const attributes = path.node.openingElement.attributes;
        if (!attributes) return;
        const newAttributes: any[] = [];

        attributes.forEach((attr: any) => {
            if (attr.type === 'JSXAttribute' && attr.name.name === 'variant') {
                if (attr.value && attr.value.type === 'StringLiteral') {
                    const val = attr.value.value;
                    if (val === 'success' || val === 'warning' || val === 'info') {
                        // shadcn badge doesn't have these, map to default and we'll handle styling via className if needed. But for now map to secondary or destructive
                        if (val === 'success') newAttributes.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('default')));
                        else if (val === 'warning') newAttributes.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('secondary')));
                        else if (val === 'info') newAttributes.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('secondary')));
                    } else {
                        newAttributes.push(attr);
                    }
                } else {
                    newAttributes.push(attr);
                }
            } else {
                newAttributes.push(attr);
            }
        });
        path.node.openingElement.attributes = newAttributes;
    });

    return hasChanges ? root.toSource() : null;
}

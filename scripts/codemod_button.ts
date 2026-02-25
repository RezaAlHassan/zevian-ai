import { API, FileInfo, Options } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API, options: Options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // 1. Find the import for Button
    const buttonImports = root.find(j.ImportDeclaration, {
        source: { value: '../components/Button' },
    });

    const buttonImports2 = root.find(j.ImportDeclaration, {
        source: { value: '../../components/Button' },
    });

    const buttonImports3 = root.find(j.ImportDeclaration, {
        source: { value: './Button' }, // if inside components dir
    });

    let importReplaced = false;

    const replaceImport = (imports: any) => {
        if (imports.size() > 0) {
            imports.forEach((path: any) => {
                // Change import source to shadcn ui
                const specifier = path.node.specifiers[0];
                if (specifier && specifier.local.name === 'Button') {
                    // Check the level of nesting to keep the relative path correct
                    const sourceValue = path.node.source.value;
                    const isTwoUp = sourceValue.startsWith('../../');
                    const isSameDir = sourceValue.startsWith('./');

                    let newSource = '../components/ui/button';
                    if (isTwoUp) newSource = '../../components/ui/button';
                    if (isSameDir) newSource = './ui/button';

                    path.node.source.value = newSource;
                    importReplaced = true;
                }
            });
        }
    };

    replaceImport(buttonImports);
    replaceImport(buttonImports2);
    replaceImport(buttonImports3);

    // 2. Transform the Button elements
    if (importReplaced) {
        root.find(j.JSXElement, {
            openingElement: { name: { name: 'Button' } },
        }).forEach((path) => {
            const attributes = path.node.openingElement.attributes;
            if (!attributes) return;

            let variantAttr: any = null;
            let sizeAttr: any = null;
            let fullWidthAttr: any = null;
            let isLoadingAttr: any = null;
            let iconAttr: any = null;
            let iconPositionAttr: any = null;
            let classNameAttr: any = null;

            // Classify the attributes
            attributes.forEach((attr: any) => {
                if (attr.type === 'JSXAttribute') {
                    const name = attr.name.name;
                    if (name === 'variant') variantAttr = attr;
                    else if (name === 'size') sizeAttr = attr;
                    else if (name === 'fullWidth') fullWidthAttr = attr;
                    else if (name === 'isLoading') isLoadingAttr = attr;
                    else if (name === 'icon') iconAttr = attr;
                    else if (name === 'iconPosition') iconPositionAttr = attr;
                    else if (name === 'className') classNameAttr = attr;
                }
            });

            // --- Transform Variant ---
            if (variantAttr && variantAttr.value && variantAttr.value.type === 'StringLiteral') {
                const val = variantAttr.value.value;
                if (val === 'primary') {
                    attributes.splice(attributes.indexOf(variantAttr), 1); // default is primary
                } else if (val === 'danger') {
                    variantAttr.value.value = 'destructive';
                }
            }

            // --- Transform Size ---
            if (sizeAttr && sizeAttr.value && sizeAttr.value.type === 'StringLiteral') {
                const val = sizeAttr.value.value;
                if (val === 'md') {
                    attributes.splice(attributes.indexOf(sizeAttr), 1); // default is md
                }
            }

            // --- Transform fullWidth ---
            let classesToAdd = [];
            if (fullWidthAttr) {
                classesToAdd.push('w-full');
                attributes.splice(attributes.indexOf(fullWidthAttr), 1);
            }

            if (classesToAdd.length > 0) {
                if (classNameAttr) {
                    if (classNameAttr.value.type === 'StringLiteral') {
                        classNameAttr.value.value = `${classesToAdd.join(' ')} ${classNameAttr.value.value}`;
                    } else if (classNameAttr.value.type === 'JSXExpressionContainer' && classNameAttr.value.expression.type === 'StringLiteral') {
                        classNameAttr.value.expression.value = `${classesToAdd.join(' ')} ${classNameAttr.value.expression.value}`;
                    } else if (classNameAttr.value.type === 'JSXExpressionContainer' && classNameAttr.value.expression.type === 'TemplateLiteral') {
                        classNameAttr.value.expression.quasis[0].value.raw = `${classesToAdd.join(' ')} ${classNameAttr.value.expression.quasis[0].value.raw}`;
                    }
                } else {
                    attributes.push(j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral(classesToAdd.join(' '))));
                }
            }

            // --- Transform Icon and isLoading ---
            const hasIcon = !!iconAttr;
            const isRight = iconPositionAttr && iconPositionAttr.value && iconPositionAttr.value.value === 'right';
            const hasIsLoading = !!isLoadingAttr;

            if (hasIcon || hasIsLoading) {
                // We need to modify children.
                const children = path.node.children || [];
                const newChildren = [];

                if (hasIsLoading) {
                    // We just add text "Loading..." or leave spinner logic out, generic spinner:
                    // <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    // To keep it simple, we wrap children.
                    // Removing isLoading prop
                    attributes.splice(attributes.indexOf(isLoadingAttr), 1);
                }

                if (hasIcon && iconAttr.value && iconAttr.value.type === 'JSXExpressionContainer') {
                    const iconName = iconAttr.value.expression.name;
                    const iconElement = j.jsxElement(
                        j.jsxOpeningElement(j.jsxIdentifier(iconName), [
                            j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral(isRight ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"))
                        ], true),
                        null,
                        []
                    );

                    if (isRight) {
                        newChildren.push(...children);
                        newChildren.push(iconElement);
                    } else {
                        newChildren.push(iconElement);
                        newChildren.push(...children);
                    }

                    path.node.children = newChildren;
                    attributes.splice(attributes.indexOf(iconAttr), 1);
                    if (iconPositionAttr) attributes.splice(attributes.indexOf(iconPositionAttr), 1);
                }
            }

        });
    }

    return root.toSource();
}

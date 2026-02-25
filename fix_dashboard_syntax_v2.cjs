const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'DashboardPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Specific line-based fixes for DashboardPage.tsx
// (Using line content matching to be safer than exact line numbers across edits)

for (let i = 0; i < lines.length; i++) {
    // Fix line 2064 (approx)
    if (lines[i].includes('</Badge>') && i > 2000 && i < 2100) {
        // Find if it's the one closing the Reviewed div
        if (lines[i - 1].includes('Reviewed</span>')) {
            lines[i] = lines[i].replace('</Badge>', '</div>');
        }
        // Find if it's the one closing the outer div at ~2068
        if (lines[i - 1].includes(')}') && lines[i].includes('</Badge>') && lines[i + 1].includes('</div>')) {
            lines[i] = lines[i].replace('</Badge>', '</div>');
        }
    }
}

// Fix the dangling </p></div> at ~2071-2072
content = lines.join('\n');
content = content.replace(/<\/Badge>\s*<\/div>\s*<\/p>\s*<\/div>\s*\);\s*\}\)\s*<\/div>/, '</div>\n                                                    </div>\n                                                );\n                                            })}');

// Fix the one at ~2118 if it exists (the closing tag for evaluationScore Badge)
content = content.replace(/<Badge variant=\{report\.evaluationScore > 7 \? "success" : report\.evaluationScore >= 5 \? "warning" : "destructive"\} className="font-bold">\s*\{report\.evaluationScore\.toFixed\(1\)\}\s*<\/div>/g,
    '<Badge variant={report.evaluationScore > 7 ? "success" : report.evaluationScore >= 5 ? "warning" : "destructive"} className="font-bold">\n                                                                {report.evaluationScore.toFixed(1)}\n                                                            </Badge>');

// Fix outer structure dangling brackets/tags
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{ \/\* Bottom Row/g, '</div>\n                        </div>\n                    </div>\n\n    {/* Bottom Row');

fs.writeFileSync(filePath, content);
console.log('Fixed DashboardPage.tsx again');

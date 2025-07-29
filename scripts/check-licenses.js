const checker = require('license-checker');
const fs = require('fs');
const path = require('path');

// Allowed licenses for VS Code extensions (commercial-friendly)
const ALLOWED_LICENSES = [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'CC0-1.0',
    'Unlicense',
    '0BSD',
    'Apache*', // Apache variants
    'BSD*'     // BSD variants
];

// Potentially problematic licenses (copyleft/restrictive)
const PROBLEMATIC_LICENSES = [
    'GPL-2.0',
    'GPL-3.0',
    'AGPL-1.0',
    'AGPL-3.0',
    'LGPL-2.1',
    'LGPL-3.0',
    'UNLICENSED',
    'UNKNOWN'
];

console.log('🔍 Auditing licenses for Fab Inspector VS Code Extension...\n');

checker.init({
    start: process.cwd(),
    production: true // Only check production dependencies
}, (err, packages) => {
    if (err) {
        console.error('Error checking licenses:', err);
        process.exit(1);
    }

    const licenseReport = [];
    const problematicPackages = [];
    const unknownLicenses = [];
    const licenseCounts = {};

    Object.keys(packages).forEach(packageName => {
        const packageInfo = packages[packageName];
        const license = packageInfo.licenses;

        // Count license types
        licenseCounts[license] = (licenseCounts[license] || 0) + 1;

        licenseReport.push({
            package: packageName,
            license: license,
            repository: packageInfo.repository || 'N/A',
            path: packageInfo.path,
            publisher: packageInfo.publisher || 'N/A'
        });

        // Check for problematic licenses
        if (PROBLEMATIC_LICENSES.includes(license)) {
            problematicPackages.push({ package: packageName, license });
        } 
        // Check if license is in allowed list (including wildcards)
        else if (!ALLOWED_LICENSES.some(allowed => {
            if (allowed.endsWith('*')) {
                return license.startsWith(allowed.slice(0, -1));
            }
            return license === allowed;
        })) {
            unknownLicenses.push({ package: packageName, license });
        }
    });

    // Display results
    console.log('📋 License Audit Report');
    console.log('========================');
    console.log(`Total packages: ${Object.keys(packages).length}`);
    console.log(`Unique licenses: ${Object.keys(licenseCounts).length}\n`);

    // Show license breakdown
    console.log('📊 License Distribution:');
    Object.entries(licenseCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([license, count]) => {
            const status = ALLOWED_LICENSES.some(allowed => {
                if (allowed.endsWith('*')) {
                    return license.startsWith(allowed.slice(0, -1));
                }
                return license === allowed;
            }) ? '✅' : (PROBLEMATIC_LICENSES.includes(license) ? '❌' : '⚠️');
            console.log(`  ${status} ${license}: ${count} packages`);
        });

    if (problematicPackages.length > 0) {
        console.log('\n❌ PROBLEMATIC LICENSES FOUND:');
        problematicPackages.forEach(pkg => {
            console.log(`  ⚠️  ${pkg.package}: ${pkg.license}`);
        });
        console.log('\n⚠️  These licenses may have copyleft or restrictive terms that could affect your extension.');
    }

    if (unknownLicenses.length > 0) {
        console.log('\n⚠️  UNKNOWN/UNCOMMON LICENSES:');
        unknownLicenses.forEach(pkg => {
            console.log(`  🔍 ${pkg.package}: ${pkg.license}`);
        });
        console.log('\n📝 Please review these licenses manually to ensure compatibility.');
    }

    if (problematicPackages.length === 0 && unknownLicenses.length === 0) {
        console.log('\n✅ All licenses are compatible with commercial VS Code extensions!');
    }

    // Generate detailed report
    generateDetailedReport(licenseReport, problematicPackages, unknownLicenses, licenseCounts);

    // Exit with error if problematic licenses found
    if (problematicPackages.length > 0) {
        console.log('\n💡 Consider finding alternatives for packages with problematic licenses.');
        process.exit(1);
    }

    console.log('\n🎉 License audit completed successfully!');
});

function generateDetailedReport(licenseReport, problematic, unknown, licenseCounts) {
    let report = '# License Audit Report - Fab Inspector VS Code Extension\n\n';
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Summary
    report += '## Summary\n\n';
    report += `- **Total packages**: ${licenseReport.length}\n`;
    report += `- **Unique licenses**: ${Object.keys(licenseCounts).length}\n`;
    report += `- **Problematic licenses**: ${problematic.length}\n`;
    report += `- **Unknown licenses**: ${unknown.length}\n\n`;

    // License distribution
    report += '## License Distribution\n\n';
    Object.entries(licenseCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([license, count]) => {
            report += `- **${license}**: ${count} packages\n`;
        });
    report += '\n';
    
    if (problematic.length > 0) {
        report += '## ❌ Problematic Licenses\n\n';
        report += 'These packages have licenses that may be incompatible with commercial distribution:\n\n';
        problematic.forEach(pkg => {
            report += `- **${pkg.package}**: ${pkg.license}\n`;
        });
        report += '\n';
    }

    if (unknown.length > 0) {
        report += '## ⚠️ Unknown/Uncommon Licenses\n\n';
        report += 'These packages have licenses that need manual review:\n\n';
        unknown.forEach(pkg => {
            report += `- **${pkg.package}**: ${pkg.license}\n`;
        });
        report += '\n';
    }

    report += '## 📋 All Dependencies\n\n';
    report += '| Package | License | Repository |\n';
    report += '|---------|---------|------------|\n';
    
    licenseReport
        .sort((a, b) => a.package.localeCompare(b.package))
        .forEach(pkg => {
            const repo = pkg.repository && pkg.repository !== 'N/A' && pkg.repository.startsWith('http') 
                ? `[Link](${pkg.repository})` 
                : 'N/A';
            report += `| ${pkg.package} | ${pkg.license} | ${repo} |\n`;
        });

    report += '\n## Recommended Actions\n\n';
    if (problematic.length > 0) {
        report += '1. **Replace problematic dependencies** with MIT/Apache-2.0 alternatives\n';
    }
    if (unknown.length > 0) {
        report += '2. **Review unknown licenses** manually to ensure compatibility\n';
    }
    report += '3. **Keep this report updated** when adding new dependencies\n';
    report += '4. **Run license checks** in CI/CD pipeline\n\n';

    report += '## VS Code Marketplace Compliance\n\n';
    report += 'VS Code extensions should use licenses compatible with commercial distribution. ';
    report += 'The following licenses are generally safe:\n\n';
    report += '- MIT License ✅\n';
    report += '- Apache License 2.0 ✅\n';
    report += '- BSD Licenses (2-Clause, 3-Clause) ✅\n';
    report += '- ISC License ✅\n';
    report += '- CC0-1.0 (Public Domain) ✅\n\n';

    const reportPath = path.join(process.cwd(), 'LICENSE_AUDIT_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Detailed report written to ${reportPath}`);
}

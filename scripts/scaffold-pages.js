/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const pages = [
  'dashboard',
  'reception',
  'members',
  'crm',
  'memberships',
  'finance',
  'attendance',
  'training',
  'fitness',
  'reports',
  'notifications',
  'team',
  'settings',
  'activity'
];

const staffDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)', 'staff');

if (!fs.existsSync(staffDir)) {
  fs.mkdirSync(staffDir, { recursive: true });
}

pages.forEach(p => {
  const dirPath = path.join(staffDir, p);
  const filePath = path.join(dirPath, 'page.tsx');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    const title = p.charAt(0).toUpperCase() + p.slice(1);
    const content = `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ${title}Page() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">${title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>${title} Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This module is currently under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
`;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created ${filePath}`);
  } else {
    console.log(`Skipped ${filePath} (already exists)`);
  }
});

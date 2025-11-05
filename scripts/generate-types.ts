// scripts/generate-types.ts
import { Idl } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

const idlPath = path.join(__dirname, '../src/idls/crash123k.json');
const idl: Idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

const typesDir = path.join(__dirname, '../src/types');
if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true });

const programName = 'crash123k';

// Helper function — NOW DEFINED
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const typeFile = `
// src/types/${programName}.ts
// AUTO-GENERATED — DO NOT EDIT
import { Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export type ${capitalize(programName)} = {
  // Add real types here if needed
  // For now, use 'any' to avoid complexity
  programId: PublicKey;
  idl: Idl;
  // Accounts
  ${idl.accounts
    ?.map(
      (acc) => `account: {\n    ${acc.name}: any;\n  };`
    )
    .join('\n  ') || ''}

  // Instructions
  ${idl.instructions
    ?.map(
      (ix) => `methods: {\n    ${ix.name}(...args: any[]): any;\n  };`
    )
    .join('\n  ') || ''}
};

// Export for Program<YourType>
export default {} as any;
`.trim();

const outputPath = path.join(typesDir, `${programName}.ts`);
fs.writeFileSync(outputPath, typeFile);
console.log(`Generated: ${outputPath}`);
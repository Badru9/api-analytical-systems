require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('RUNNING SEED....');

  const inst = await prisma.institution.upsert({
    where: { code: 'ITG' },
    update: {},
    create: { code: 'ITG', name: 'Institut Teknologi Garut' },
  });

  const roles = [
    { name: 'ADMIN', description: 'System administrator' },
    { name: 'DOSEN', description: 'Lecturer' },
    { name: 'KAPRODI', description: 'Head of Study Program' },
    { name: 'LPPM', description: 'Research & community service office' },
    { name: 'LPM', description: 'Quality assurance office' },
    { name: 'DEKAN', description: 'Dean' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
  }

  const evidenceTypes = [
    { code: 'RPS_FINAL', name: 'RPS Final (tersahkan)', requiredForBkd: true },
    { code: 'RUBRIC', name: 'Rubrik & CPMK/OBE mapping', requiredForBkd: true },
    { code: 'LMS_LOG', name: 'Log/rekam aktivitas LMS', requiredForBkd: true },
    {
      code: 'GRADE_EVIDENCE',
      name: 'Bukti penilaian & umpan balik',
      requiredForBkd: true,
    },
    {
      code: 'PUB_PROOF',
      name: 'Bukti luaran penelitian (submit/accepted)',
      requiredForBkd: true,
    },
    {
      code: 'SERVICE_IMPACT',
      name: 'Bukti dampak pengabdian (baseline–endline)',
      requiredForBkd: true,
    },
  ];

  console.log('SEEDING HALF WAY....');

  for (const t of evidenceTypes) {
    await prisma.evidenceType.upsert({
      where: { code: t.code },
      update: { name: t.name, requiredForBkd: t.requiredForBkd },
      create: t,
    });
  }

  const passwordHash = await bcrypt.hash('Admin#2026', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@itg.ac.id' },
    update: {},
    create: {
      institutionId: inst.id,
      email: 'admin@itg.ac.id',
      fullName: 'System Admin',
      passwordHash,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  }

  console.log('Seed OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

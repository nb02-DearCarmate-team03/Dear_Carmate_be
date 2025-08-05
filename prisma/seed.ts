import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const COMPANY_CODES = [
  { name: '햇살카', code: 'sunshine' },
  { name: '케이카', code: 'kcar' },
  { name: '굿모닝카', code: 'goodmorning' },
  { name: '행복카', code: 'happy' },
  { name: '믿음카', code: 'trust' },
  { name: '신뢰카', code: 'reliable' },
  { name: '우리카', code: 'ourcar' },
  { name: '미래카', code: 'future' },
];

const getRandomPhone = (): string =>
  `010-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;

const generateUsers = async (companyId: number, companyCode: string, count: number) =>
  Promise.all(
    Array.from({ length: count }, async (_, i) => ({
      companyId,
      name: `직원${i + 1}`,
      email: `user${i + 1}@${companyCode}.com`,
      employeeNumber: `EMP-${companyCode.toUpperCase()}-${i + 1}`,
      phoneNumber: getRandomPhone(),
      password: await bcrypt.hash('password', 10),
    })),
  );

async function main() {
  console.log('🌱 Seeding start...');

  await prisma.contractDocument.deleteMany({});
  await prisma.upload.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.alarm.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.car.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.dashboardStat.deleteMany({});
  await prisma.company.deleteMany({});

  const hashedAdminPassword = await bcrypt.hash('admin1234', 10);
  await prisma.user.create({
    data: {
      name: '플랫폼 관리자',
      email: 'admin@dearcarmate.com',
      employeeNumber: 'ADMIN-001',
      phoneNumber: '010-0000-0000',
      password: hashedAdminPassword,
      isAdmin: true,
      company: {
        create: {
          companyName: '운영팀',
          companyCode: 'platform',
        },
      },
    },
  });

  await Promise.all(
    COMPANY_CODES.map(async ({ name, code }) => {
      const company = await prisma.company.create({
        data: {
          companyName: name,
          companyCode: code,
        },
      });

      // 대표 계정
      await prisma.user.create({
        data: {
          companyId: company.id,
          name: `${name} 관리자`,
          email: `admin@${code}.com`,
          employeeNumber: `ADMIN-${code.toUpperCase()}`,
          phoneNumber: getRandomPhone(),
          password: await bcrypt.hash('password', 10),
          isAdmin: false,
        },
      });

      const userCount = Math.floor(Math.random() * 4) + 5; // 5~8명
      const users = await generateUsers(company.id, code, userCount);
      await prisma.user.createMany({ data: users });

      await prisma.company.update({
        where: { id: company.id },
        data: { userCount: userCount + 1 }, // 대표 포함
      });
    }),
  );

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  PrismaClient,
  CarType,
  Gender,
  Region,
  ContractStatus,
  Possession,
  AgeGroup,
} from '@prisma/client';

const prisma = new PrismaClient();

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomItem = <T>(arr: T[]): T | undefined => {
  if (arr.length === 0) return undefined;
  return arr[getRandomInt(0, arr.length - 1)];
};

const getRandomPhone = () => `010-${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`;

let emailCounter = 1;

const getRandomEmail = () => {
  const email = `customer${emailCounter}@test.com`;
  emailCounter += 1;
  return email;
};

// 이름 조합: 성 + 이름
const lastNames = ['김', '이', '김', '윤', '진', '박', '노', '정', '유'];
const firstNames = ['수민', '종진', '슬비', '희원', '성남', '명수', '홍철', '형돈', '재석'];

const getRandomName = () => {
  const lastName = getRandomItem(lastNames);
  const firstName = getRandomItem(firstNames);
  return `${lastName}${firstName}`;
};

const getRandomRegion = (): Region => getRandomItem(Object.values(Region)) as Region;
const getRandomCarType = (): CarType => getRandomItem(Object.values(CarType)) as CarType;
const getRandomGender = (): Gender => getRandomItem(Object.values(Gender)) as Gender;
const getRandomAgeGroup = (): AgeGroup => getRandomItem(Object.values(AgeGroup)) as AgeGroup;

// 제조사 - 차종 매핑
const manufacturerModels: Record<string, string[]> = {
  현대: ['아반떼', '쏘나타', '그랜저', '펠리세이드'],
  기아: ['K3', 'K5', 'K8', '스포티지'],
  쉐보레: ['스파크', '말리부', '트랙스'],
  르노: ['SM3', 'SM5', 'QM6'],
  벤츠: ['C클래스', 'E클래스', 'GLC'],
  BMW: ['3시리즈', '5시리즈', 'X5'],
  아우디: ['A4', 'A6', 'Q5'],
};

async function main() {
  console.log('Generating mock data...');

  const companies = await prisma.company.findMany({
    where: { companyCode: { not: 'platform' } },
    include: { users: true },
  });

  await Promise.all(
    companies.map(async (company) => {
      const companyUsers = company.users.filter((u) => !u.isAdmin);

      // 차량 생성
      const cars = Array.from({ length: getRandomInt(5, 10) }).map(() => {
        const manufacturer = getRandomItem(Object.keys(manufacturerModels))!;
        const model = getRandomItem(manufacturerModels[manufacturer]!)!;

        return {
          companyId: company.id,
          carNumber: `${getRandomInt(10, 99)}가${getRandomInt(1000, 9999)}`,
          manufacturer,
          model,
          type: getRandomCarType(),
          manufacturingYear: getRandomInt(2015, 2023),
          mileage: getRandomInt(10000, 150000),
          price: getRandomInt(5000000, 40000000),
          accidentCount: getRandomInt(0, 3),
          explanation: Math.random() < 0.5 ? '상세 설명 없음' : '경미한 사고 이력 있음',
          accidentDetails: Math.random() < 0.5 ? null : '사고 내용: 운전석 문 교체',
        };
      });

      await prisma.car.createMany({ data: cars });

      // 고객 생성
      const customers = Array.from({ length: getRandomInt(5, 10) }).map(() => {
        const name = getRandomName();
        return {
          companyId: company.id,
          name,
          gender: getRandomGender(),
          phoneNumber: getRandomPhone(),
          region: getRandomRegion(),
          email: getRandomEmail(),
          ageGroup: getRandomAgeGroup(),
          memo: Math.random() < 0.3 ? '단골 고객입니다.' : null,
        };
      });

      await prisma.customer.createMany({ data: customers });

      // 계약 생성
      const carList = await prisma.car.findMany({ where: { companyId: company.id } });
      const customerList = await prisma.customer.findMany({ where: { companyId: company.id } });

      const contracts = await Promise.all(
        Array.from({ length: getRandomInt(3, 5) }).map(async () => {
          const car = getRandomItem(carList);
          const customer = getRandomItem(customerList);
          const user = getRandomItem(companyUsers);

          if (!car || !customer || !user) {
            console.warn('Cannot create contract due to missing car, customer, or user data.');
            return null;
          }

          const contract = await prisma.contract.create({
            data: {
              companyId: company.id,
              carId: car.id,
              customerId: customer.id,
              userId: user.id,
              status: getRandomItem([
                ContractStatus.CAR_INSPECTION,
                ContractStatus.PRICE_NEGOTIATION,
                ContractStatus.CONTRACT_SUCCESSFUL,
                ContractStatus.CONTRACT_DRAFT,
                ContractStatus.CONTRACT_FAILED,
              ])!,
              contractDate: new Date(),
              contractPrice: car.price,
              possession: getRandomItem([
                Possession.PENDING,
                Possession.PROCESSING,
                Possession.COMPLETED,
              ])!,
              contractCompleted: Math.random() < 0.5,
            },
          });

          await prisma.meeting.create({
            data: {
              contractId: contract.id,
              date: new Date(Date.now() + getRandomInt(1, 5) * 24 * 60 * 60 * 1000),
            },
          });

          return contract;
        }),
      );

      const validContracts = contracts.filter((c) => c !== null);

      await prisma.dashboardStat.create({
        data: {
          companyId: company.id,
          statsDate: new Date(),
          monthlySales: validContracts.reduce((sum, c) => sum + Number(c!.contractPrice ?? 0), 0),
          proceedingContracts: validContracts.filter(
            (c) => c!.status !== ContractStatus.CONTRACT_SUCCESSFUL,
          ).length,
          completedContracts: validContracts.filter(
            (c) => c!.status === ContractStatus.CONTRACT_SUCCESSFUL,
          ).length,
          salesByCarType: carList.reduce<Record<string, number>>((acc, car) => {
            const { type } = car;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
        },
      });
    }),
  );

  console.log('Mock data generated!');
}

main()
  .catch((e) => {
    console.error('Error generating mock data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

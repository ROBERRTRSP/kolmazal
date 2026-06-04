import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LOTTERIES = [
  { name: "La Primera Día", drawName: "Día", drawTime: "12:00 PM", closeTime: "11:45 AM" },
  { name: "La Primera Noche", drawName: "Noche", drawTime: "8:00 PM", closeTime: "7:45 PM" },
  { name: "Nacional", drawName: "Noche", drawTime: "9:00 PM", closeTime: "8:45 PM" },
  { name: "Loteka", drawName: "Noche", drawTime: "8:55 PM", closeTime: "8:40 PM" },
  { name: "Leidsa", drawName: "Noche", drawTime: "9:30 PM", closeTime: "9:15 PM" },
  { name: "Quiniela Real", drawName: "Noche", drawTime: "7:30 PM", closeTime: "7:15 PM" },
  { name: "Florida PM", drawName: "Noche", drawTime: "10:00 PM", closeTime: "9:45 PM" },
  { name: "New York PM", drawName: "Noche", drawTime: "11:30 PM", closeTime: "11:15 PM" },
  { name: "Anguila Noche", drawName: "Noche", drawTime: "10:30 PM", closeTime: "10:15 PM" },
];

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  const player = await prisma.user.upsert({
    where: { phone: "8290000000" },
    update: {},
    create: {
      phone: "8290000000",
      pinHash,
      role: "PLAYER",
      playerProfile: { create: { balance: 1250 } },
    },
    include: { playerProfile: true },
  });

  await prisma.user.upsert({
    where: { phone: "8291111111" },
    update: {},
    create: {
      phone: "8291111111",
      pinHash,
      role: "CASHIER",
      cashierProfile: { create: { stationId: "CAJA-01" } },
    },
  });

  await prisma.user.upsert({
    where: { phone: "8292222222" },
    update: {},
    create: {
      phone: "8292222222",
      pinHash,
      role: "ADMIN",
      adminProfile: { create: {} },
    },
  });

  for (const lot of LOTTERIES) {
    await prisma.lottery.upsert({
      where: { name: lot.name },
      update: { drawTime: lot.drawTime, closeTime: lot.closeTime },
      create: {
        name: lot.name,
        drawName: lot.drawName,
        drawTime: lot.drawTime,
        closeTime: lot.closeTime,
        status: "OPEN",
        isActive: true,
      },
    });
  }

  const primeraDia = await prisma.lottery.findUnique({ where: { name: "La Primera Día" } });
  const loteka = await prisma.lottery.findUnique({ where: { name: "Loteka" } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (primeraDia) {
    await prisma.lotteryResult.upsert({
      where: { lotteryId_drawDate: { lotteryId: primeraDia.id, drawDate: today } },
      update: {},
      create: {
        lotteryId: primeraDia.id,
        drawDate: today,
        number1: "23",
        number2: "45",
        number3: "67",
        status: "PENDING_VERIFY",
      },
    });
  }

  if (loteka) {
    await prisma.lotteryResult.upsert({
      where: { lotteryId_drawDate: { lotteryId: loteka.id, drawDate: today } },
      update: {},
      create: {
        lotteryId: loteka.id,
        drawDate: today,
        number1: "10",
        number2: "20",
        number3: "99",
        status: "PENDING_VERIFY",
      },
    });
  }

  await prisma.resultSource.upsert({
    where: { name: "Demo Source" },
    update: {},
    create: { name: "Demo Source", url: "https://demo.kolmazal.local", priority: 1 },
  });

  const defaultSettings = [
    { key: "ODDS_QUINIELA", value: "70" },
    { key: "ODDS_PALE", value: "1000" },
    { key: "ODDS_TRIPLETA", value: "20000" },
    { key: "MIN_BET_AMOUNT", value: "5" },
    { key: "MAX_BET_AMOUNT", value: "5000" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Seed completed:");
  console.log("  Player:", player.phone, "balance:", player.playerProfile?.balance);
  console.log("  Cashier: 8291111111");
  console.log("  Admin: 8292222222");
  console.log("  PIN for all: 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

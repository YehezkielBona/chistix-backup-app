// ============================================================
// Prisma Seed Script (backend/prisma/seed.ts)
// Menyimpan 2 Akun Dummy (Organizer & Customer), Event awal,
// dan Voucher contoh ke database Neon PostgreSQL dengan aman (upsert).
// Cara jalankan: npm run db:seed (di dalam folder backend)
// ============================================================
import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("🌱 Memulai proses seeding database Chistix...");

  // 1. Seed Akun Dummy Organizer & Customer
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@chistix.id" },
    update: { role: "ORGANIZER", emailVerified: true },
    create: {
      id: "org-default-01",
      name: "Soundwave Organizer",
      email: "organizer@chistix.id",
      emailVerified: true,
      role: "ORGANIZER",
      referralCode: "ORGCHISTIX",
      points: 0,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@chistix.id" },
    update: { role: "CUSTOMER", emailVerified: true },
    create: {
      id: "cust-default-01",
      name: "Budi Santoso",
      email: "customer@chistix.id",
      emailVerified: true,
      role: "CUSTOMER",
      referralCode: "BUDI2026",
      points: 150000,
    },
  });

  console.log("✅ Akun Dummy siap:", {
    organizer: `${organizer.email} (Role: ${organizer.role})`,
    customer: `${customer.email} (Role: ${customer.role}, Points: ${customer.points})`,
  });

  // 2. Seed Event Awal (jika di DB belum ada event sama sekali atau upsert berdasarkan ID tetap)
  const seedEvents = [
    {
      id: "11111111-1111-4111-8111-111111111101",
      title: "Night Symphony: Classic Meets Rock",
      category: "MUSIC" as const,
      startDate: new Date("2026-12-19T19:00:00.000Z"),
      endDate: new Date("2026-12-19T23:00:00.000Z"),
      description:
        "Perpaduan megah orkestra klasik dan energi musik rock era 90-an hingga 2000-an yang dipimpin oleh konduktor ternama Indonesia.",
      provinceId: "31",
      provinceName: "DKI Jakarta",
      cityId: "3171",
      cityName: "Kota Jakarta Selatan",
      venueDetail: "Ciputra Artpreneur Theater Jakarta",
      venueMaps: "https://maps.google.com",
      totalQuotaTiket: 390,
      ticketType: "PRESALE" as const,
      vipQuota: 100,
      vipPriceNormal: 300000,
      vipPriceFinal: 250000,
      regularQuota: 190,
      regularPriceNormal: 150000,
      regularPriceFinal: 150000,
      presaleQuota: 100,
      presalePriceNormal: 150000,
      presalePriceFinal: 100000,
      thumbnailImage: "/images/img-event-1-sq.jpg",
      coverImages: ["/images/img-event-1-ls.jpg"],
      eventStatus: "UPCOMING" as const,
      scheduledPublishStart: new Date("2026-10-01T00:00:00.000Z"),
      scheduledPublishEnd: new Date("2026-11-15T23:59:59.000Z"),
      isVip: true,
      isRegular: true,
      isPresale: true,
    },
    {
      id: "11111111-1111-4111-8111-111111111102",
      title: "Resonance Soundfest 2026: Intimate Live Performance",
      category: "MUSIC" as const,
      startDate: new Date("2026-11-15T18:30:00.000Z"),
      endDate: new Date("2026-11-15T22:30:00.000Z"),
      description:
        "Festival musik akustik dan indie pop paling spektakuler tahun ini! Menampilkan musisi nasional papan atas dengan tata panggung kelas dunia.",
      provinceId: "31",
      provinceName: "DKI Jakarta",
      cityId: "3173",
      cityName: "Kota Jakarta Pusat",
      venueDetail: "Istora Senayan Jakarta",
      venueMaps: "https://maps.google.com",
      totalQuotaTiket: 500,
      ticketType: "REGULAR" as const,
      vipQuota: 100,
      vipPriceNormal: 500000,
      vipPriceFinal: 500000,
      regularQuota: 400,
      regularPriceNormal: 200000,
      regularPriceFinal: 200000,
      presaleQuota: 0,
      presalePriceNormal: 0,
      presalePriceFinal: 0,
      thumbnailImage: "/images/img-event-2-sq.jpg",
      coverImages: ["/images/img-event-2-ls.jpg"],
      eventStatus: "UPCOMING" as const,
      isVip: true,
      isRegular: true,
      isPresale: false,
    },
    {
      id: "11111111-1111-4111-8111-111111111103",
      title: "Bandung Creative Tech & AI Summit 2026",
      category: "SEMINAR" as const,
      startDate: new Date("2026-11-28T09:00:00.000Z"),
      endDate: new Date("2026-11-28T17:00:00.000Z"),
      description:
        "Seminar dan talkshow teknologi kreatif terbesar di Jawa Barat membahas pengembangan AI modern, Cloud, dan Fullstack Engineering.",
      provinceId: "32",
      provinceName: "Jawa Barat",
      cityId: "3273",
      cityName: "Kota Bandung",
      venueDetail: "Trans Luxury Convention Center Bandung",
      venueMaps: "https://maps.google.com",
      totalQuotaTiket: 300,
      ticketType: "REGULAR" as const,
      vipQuota: 50,
      vipPriceNormal: 250000,
      vipPriceFinal: 200000,
      regularQuota: 250,
      regularPriceNormal: 100000,
      regularPriceFinal: 100000,
      presaleQuota: 0,
      presalePriceNormal: 0,
      presalePriceFinal: 0,
      thumbnailImage: "/images/img-event-3-sq.jpg",
      coverImages: ["/images/img-event-3-ls.jpg"],
      eventStatus: "DRAFT" as const,
      isVip: true,
      isRegular: true,
      isPresale: false,
    },
  ];

  for (const evt of seedEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {
        title: evt.title,
        provinceId: evt.provinceId,
        provinceName: evt.provinceName,
        cityId: evt.cityId,
        cityName: evt.cityName,
        deletedAt: null,
      },
      create: {
        ...evt,
        organizerId: organizer.id,
      },
    });
  }

  console.log(`✅ ${seedEvents.length} Event contoh berhasil di-seed ke Neon DB.`);

  // 3. Seed Voucher Contoh (EVT01 = diskon 10%, CHISTIX50K = potongan Rp 50.000)
  await prisma.voucher.upsert({
    where: { code: "EVT01" },
    update: { deletedAt: null },
    create: {
      code: "EVT01",
      eventId: seedEvents[0].id,
      discountType: "PERCENTAGE",
      discount: 10,
      validStart: new Date("2026-01-01T00:00:00.000Z"),
      validEnd: new Date("2027-01-01T00:00:00.000Z"),
      maxUsage: 100,
      usedCount: 0,
    },
  });

  await prisma.voucher.upsert({
    where: { code: "CHISTIX50K" },
    update: { deletedAt: null },
    create: {
      code: "CHISTIX50K",
      eventId: seedEvents[1].id,
      discountType: "FIXED",
      discount: 50000,
      validStart: new Date("2026-01-01T00:00:00.000Z"),
      validEnd: new Date("2027-01-01T00:00:00.000Z"),
      maxUsage: 50,
      usedCount: 0,
    },
  });

  console.log("✅ Voucher contoh siap: EVT01 (10%) & CHISTIX50K (Rp 50.000).");
  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

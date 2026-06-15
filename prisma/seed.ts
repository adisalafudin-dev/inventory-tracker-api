// prisma/seed.ts
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('🌱 Menjalankan database seed...\n');

  // Cek apakah admin sudah ada — hindari duplikat
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@adicom.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin sudah ada, seed dilewati.');
    return;
  }

  const passwordHash = await argon2.hash('Admin@123456');

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@adicom.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin berhasil dibuat:');
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Password : Admin@123456`);
  console.log(`   Role     : ${admin.role}`);
  console.log('\n⚠️  Segera ganti password setelah login pertama!\n');

  // Seed platform default juga sekalian
  await prisma.platform.createMany({
    data: [
      { name: 'Tokopedia' },
      { name: 'Shopee' },
      { name: 'TikTok Shop' },
      { name: 'Direct' },
    ],
    skipDuplicates: true,
  });

  console.log(
    '✅ Platform default berhasil dibuat (Tokopedia, Shopee, TikTok Shop, Direct)',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

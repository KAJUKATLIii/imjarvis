import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Pack 1',
    slug: 'pack-1',
    ramGb: 16,
    vcpuCores: 4,
    storageGb: 100,
    bandwidth: 'Unlimited',
    priceMonthly: 10000,
    currency: 'INR',
    sortOrder: 1,
  },
  {
    name: 'Pack 2',
    slug: 'pack-2',
    ramGb: 32,
    vcpuCores: 8,
    storageGb: 200,
    bandwidth: 'Unlimited',
    priceMonthly: 15000,
    currency: 'INR',
    sortOrder: 2,
  },
  {
    name: 'Pack 3',
    slug: 'pack-3',
    ramGb: 64,
    vcpuCores: 16,
    storageGb: 300,
    bandwidth: 'Unlimited',
    priceMonthly: 20000,
    currency: 'INR',
    sortOrder: 3,
  },
];

const operatingSystems = [
  {
    name: 'Ubuntu 22.04 LTS',
    slug: 'ubuntu-22-04',
    category: 'linux',
    sortOrder: 1,
  },
  {
    name: 'Ubuntu 24.04 LTS',
    slug: 'ubuntu-24-04',
    category: 'linux',
    sortOrder: 2,
  },
  {
    name: 'Debian 12 Bookworm',
    slug: 'debian-12',
    category: 'linux',
    sortOrder: 3,
  },
  {
    name: 'AlmaLinux 9',
    slug: 'almalinux-9',
    category: 'linux',
    sortOrder: 4,
  },
  {
    name: 'Windows Server 2022 Datacenter',
    slug: 'windows-server-2022',
    category: 'windows',
    sortOrder: 5,
  },
  {
    name: 'Windows Server 2019 Standard',
    slug: 'windows-server-2019',
    category: 'windows',
    sortOrder: 6,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert Plans
  for (const plan of plans) {
    await prisma.hostingPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ Plan: ${plan.name} (${plan.ramGb}GB RAM, ${plan.vcpuCores} vCPU)`);
  }

  // Upsert Operating Systems
  for (const os of operatingSystems) {
    await prisma.operatingSystem.upsert({
      where: { slug: os.slug },
      update: os,
      create: os,
    });
    console.log(`  ✓ OS: ${os.name} [${os.category}]`);
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

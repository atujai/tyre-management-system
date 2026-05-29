import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tyremanager.com' },
    update: {},
    create: {
      email: 'admin@tyremanager.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  })

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@tyremanager.com' },
    update: {},
    create: {
      email: 'staff@tyremanager.com',
      password: staffPassword,
      name: 'Staff Member',
      role: 'STAFF',
    },
  })

  console.log('✅ Users created:', { admin: admin.email, staff: staff.email })

  // Create locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'l1' },
      update: {},
      create: {
        id: 'l1',
        name: 'Kanpur Godown',
        type: 'GODOWN',
        address: 'Plot 14, Panki Industrial Area, Kanpur',
        contact: 'Mr. Sharma - 9838475621',
      },
    }),
    prisma.location.upsert({
      where: { id: 'l2' },
      update: {},
      create: {
        id: 'l2',
        name: 'Delhi Godown',
        type: 'GODOWN',
        address: 'Sector 63, Noida, Delhi NCR',
        contact: 'Mr. Verma - 9910234567',
      },
    }),
    prisma.location.upsert({
      where: { id: 'l3' },
      update: {},
      create: {
        id: 'l3',
        name: 'Kanpur Retreader',
        type: 'RETREADER',
        address: '13/2 GT Road, Kanpur',
        contact: 'Mr. Gupta - 9415012345',
      },
    }),
    prisma.location.upsert({
      where: { id: 'l4' },
      update: {},
      create: {
        id: 'l4',
        name: 'Lucknow Retreader',
        type: 'RETREADER',
        address: 'Faizabad Road, Lucknow',
        contact: 'Mr. Singh - 9452019876',
      },
    }),
  ])

  console.log('✅ Locations created:', locations.length)

  // Create vehicles
  const truck = await prisma.vehicle.upsert({
    where: { id: 'v1' },
    update: {},
    create: {
      id: 'v1',
      reg: 'TRK-001',
      type: 'Truck',
      model: 'Volvo FH 500',
      stepneySlots: 3,
      axles: {
        create: [
          { tyreCount: 2, steering: true, drive: false, sortOrder: 0 },
          { tyreCount: 4, steering: false, drive: true, sortOrder: 1 },
          { tyreCount: 4, steering: false, drive: false, sortOrder: 2 },
        ],
      },
    },
  })

  const goldhofer = await prisma.vehicle.upsert({
    where: { id: 'v2' },
    update: {},
    create: {
      id: 'v2',
      reg: 'GOLD-001',
      type: 'Goldhofer',
      model: 'Faktor 5',
      stepneySlots: 4,
      axles: {
        create: [
          { tyreCount: 8, steering: false, drive: false, line: 1, sortOrder: 0 },
          { tyreCount: 8, steering: false, drive: false, line: 1, sortOrder: 1 },
          { tyreCount: 8, steering: false, drive: false, line: 2, sortOrder: 2 },
          { tyreCount: 8, steering: false, drive: false, line: 2, sortOrder: 3 },
          { tyreCount: 8, steering: false, drive: false, line: 3, sortOrder: 4 },
          { tyreCount: 8, steering: false, drive: false, line: 3, sortOrder: 5 },
        ],
      },
    },
  })

  console.log('✅ Vehicles created:', { truck: truck.reg, goldhofer: goldhofer.reg })

  // Create sample tyres
  const brands = ['Michelin', 'Bridgestone', 'CEAT']
  const sizes = ['295/80R22.5', '11.00R20', '315/80R22.5']

  for (let i = 0; i < 10; i++) {
    const status = i < 6 ? 'MOUNTED' : 'INVENTORY'
    const vehicleId = i < 6 ? (i < 2 ? 'v1' : 'v2') : null
    const locationId = i >= 6 ? (i < 8 ? 'l1' : 'l2') : null

    await prisma.tyre.upsert({
      where: { id: `t${i + 1}` },
      update: {},
      create: {
        id: `t${i + 1}`,
        serial: `SN-2024-${200 + i}`,
        brand: brands[i % 3],
        size: sizes[i % 3],
        pattern: 'Highway',
        purchaseDate: new Date(`2024-01-${10 + i}`),
        initialTread: 20,
        currentTread: 18 - Math.floor(i * 0.4),
        status,
        vehicleId,
        locationId,
        cost: 28000 + i * 1000,
      },
    })
  }

  console.log('✅ Sample tyres created')

  // Mount tyres to positions
  const truckAxles = await prisma.axle.findMany({
    where: { vehicleId: 'v1' },
    orderBy: { sortOrder: 'asc' },
  })

  await prisma.tyre.update({
    where: { id: 't1' },
    data: {
      vehicleId: 'v1',
      axleId: truckAxles[0].id,
      position: 'L',
      mountingDate: new Date('2024-02-01'),
    },
  })

  await prisma.tyre.update({
    where: { id: 't2' },
    data: {
      vehicleId: 'v1',
      axleId: truckAxles[0].id,
      position: 'R',
      mountingDate: new Date('2024-02-01'),
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('Login credentials:')
  console.log('  Admin: admin@tyremanager.com / admin123')
  console.log('  Staff: staff@tyremanager.com / staff123')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

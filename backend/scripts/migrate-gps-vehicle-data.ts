const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Migrating GPS vehicle data...');

  const devices = await prisma.gPSDevice.findMany({
    include: { vehicle: true }
  });

  for (const device of devices) {
    if (device.vehicle && !device.currentVehicleRegNumber) {
      await prisma.gPSDevice.update({
        where: { id: device.id },
        data: {
          currentVehicleRegNumber: device.vehicle.registrationNumber,
          currentVehicleMake: device.vehicle.make,
          currentVehicleModel: device.vehicle.model,
          currentVehicleYear: device.vehicle.year,
          assignedAt: new Date(),
        }
      });
      console.log(`✅ ${device.deviceId} → ${device.vehicle.registrationNumber}`);
    }
  }

  console.log('🎉 Migration complete!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
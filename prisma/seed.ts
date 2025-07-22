import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a sample building
  const building = await prisma.building.upsert({
    where: { id: "sample-building-1" },
    update: {},
    create: {
      id: "sample-building-1",
      name: "Sunset Towers",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      floors: 10,
      unitsPerFloor: 8,
    },
  });

  console.log("Created building:", building);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
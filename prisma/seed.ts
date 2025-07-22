import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a sample building
  const building = await prisma.building.upsert({
    where: { id: "sample-building-1" },
    update: {
      name: "10 Ocean Blvd",
      address: "10 Ocean Boulevard",
    },
    create: {
      id: "sample-building-1",
      name: "10 Ocean Blvd",
      address: "10 Ocean Boulevard",
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
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Test users configuration
const TEST_USERS = [
  {
    email: 'tenant1@test.com',
    firstName: 'Test',
    lastName: 'Tenant One',
    password: 'TestPassword123!',
    unit: '1A',
  },
  {
    email: 'tenant2@test.com',
    firstName: 'Test',
    lastName: 'Tenant Two',
    password: 'TestPassword123!',
    unit: '1B',
  },
  {
    email: 'admin@test.com',
    firstName: 'Test',
    lastName: 'Admin',
    password: 'TestPassword123!',
    unit: '2A',
    permissions: ['VIEW_ALL_ISSUES', 'MANAGE_ISSUES'],
  },
  {
    email: 'maintenance@test.com',
    firstName: 'Test',
    lastName: 'Maintenance',
    password: 'TestPassword123!',
    unit: null, // No unit assigned
    permissions: ['MANAGE_ISSUES'],
  },
];

async function createTestUsers() {
  console.log('🚀 Creating test users...');
  
  // Get or create test building
  let building = await prisma.building.findFirst({
    where: { name: 'Test Building' },
  });
  
  if (!building) {
    building = await prisma.building.create({
      data: {
        name: 'Test Building',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
      },
    });
    console.log('✅ Created test building');
    
    // Create units for the building
    const units = [];
    for (let floor = 1; floor <= 10; floor++) {
      for (let line of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        units.push({
          buildingId: building.id,
          unitNumber: `${floor}${line}`,
          floor,
          line,
        });
      }
    }
    
    await prisma.unit.createMany({ data: units });
    console.log('✅ Created 80 units');
  }
  
  // Get admin user for granting permissions
  const adminUser = await prisma.user.findFirst({
    where: { email: 'mike.edelman@gmail.com' },
  });
  
  if (!adminUser) {
    console.error('❌ Admin user mike.edelman@gmail.com not found. Please sign in first.');
    return;
  }
  
  // Create each test user
  for (const testUser of TEST_USERS) {
    try {
      // Check if user already exists in Clerk
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [testUser.email],
      });
      
      let clerkUser;
      
      if (existingUsers.length > 0) {
        clerkUser = existingUsers[0];
        console.log(`⚠️  User ${testUser.email} already exists in Clerk`);
      } else {
        // Create user in Clerk
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [testUser.email],
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          skipPasswordRequirement: false,
        });
        console.log(`✅ Created ${testUser.email} in Clerk`);
      }
      
      // Check if user exists in our database
      let dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });
      
      if (!dbUser) {
        // Create user in database
        dbUser = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
          },
        });
        console.log(`✅ Created ${testUser.email} in database`);
      }
      
      // Assign unit if specified
      if (testUser.unit) {
        const unit = await prisma.unit.findFirst({
          where: {
            buildingId: building.id,
            unitNumber: testUser.unit,
          },
        });
        
        if (unit) {
          // Check if already has tenancy
          const existingTenancy = await prisma.tenancy.findFirst({
            where: {
              userId: dbUser.id,
              unitId: unit.id,
              isCurrent: true,
            },
          });
          
          if (!existingTenancy) {
            await prisma.tenancy.create({
              data: {
                userId: dbUser.id,
                unitId: unit.id,
                startDate: new Date(),
                isCurrent: true,
              },
            });
            console.log(`✅ Assigned ${testUser.email} to unit ${testUser.unit}`);
          }
        }
      }
      
      // Grant permissions if specified
      if (testUser.permissions && testUser.permissions.length > 0) {
        for (const permission of testUser.permissions) {
          const existingPermission = await prisma.adminPermission.findUnique({
            where: {
              userId_buildingId_permission: {
                userId: dbUser.id,
                buildingId: building.id,
                permission,
              },
            },
          });
          
          if (!existingPermission) {
            await prisma.adminPermission.create({
              data: {
                userId: dbUser.id,
                buildingId: building.id,
                permission,
                grantedBy: adminUser.id,
              },
            });
            console.log(`✅ Granted ${permission} to ${testUser.email}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${testUser.email}:`, error);
    }
  }
  
  console.log('\n📝 Test User Credentials:');
  console.log('------------------------');
  TEST_USERS.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Unit: ${user.unit || 'None'}`);
    console.log(`Permissions: ${user.permissions?.join(', ') || 'None'}`);
    console.log('------------------------');
  });
}

// Script to delete test users
async function deleteTestUsers() {
  console.log('🗑️  Deleting test users...');
  
  for (const testUser of TEST_USERS) {
    try {
      // Find user in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      
      if (dbUser) {
        // Delete related data
        await prisma.tenancy.deleteMany({ where: { userId: dbUser.id } });
        await prisma.issue.deleteMany({ where: { reporterId: dbUser.id } });
        await prisma.communication.deleteMany({ where: { userId: dbUser.id } });
        await prisma.adminPermission.deleteMany({ where: { userId: dbUser.id } });
        await prisma.user.delete({ where: { id: dbUser.id } });
        
        // Delete from Clerk
        try {
          await clerkClient.users.deleteUser(dbUser.clerkId);
          console.log(`✅ Deleted ${testUser.email}`);
        } catch (error) {
          console.log(`⚠️  Could not delete ${testUser.email} from Clerk (may already be deleted)`);
        }
      }
    } catch (error) {
      console.error(`❌ Error deleting ${testUser.email}:`, error);
    }
  }
}

// Main script
async function main() {
  const command = process.argv[2];
  
  if (command === 'create') {
    await createTestUsers();
  } else if (command === 'delete') {
    await deleteTestUsers();
  } else {
    console.log('Usage:');
    console.log('  pnpm test-users create  # Create test users');
    console.log('  pnpm test-users delete  # Delete test users');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
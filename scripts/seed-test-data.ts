import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Test data configuration
const TEST_BUILDING = {
  name: 'Test Building',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
};

const TEST_USERS_DATA = [
  {
    email: 'tenant1@test.com',
    clerkId: '', // Will be filled from Clerk
    firstName: 'Test',
    lastName: 'Tenant One',
    unit: '1A',
    issues: [
      {
        title: 'Leaky Faucet in Kitchen',
        description: 'The kitchen faucet has been dripping for the past week. It\'s getting worse.',
        category: 'PLUMBING',
        severity: 'MEDIUM',
        location: 'kitchen',
        isPublic: true,
      },
      {
        title: 'Private: Noisy Neighbors',
        description: 'Neighbors in 1B are very loud late at night. This is affecting my sleep.',
        category: 'NOISE',
        severity: 'HIGH',
        location: 'other',
        isPublic: false,
      },
    ],
  },
  {
    email: 'tenant2@test.com',
    clerkId: '',
    firstName: 'Test',
    lastName: 'Tenant Two',
    unit: '1B',
    issues: [
      {
        title: 'Broken Window Lock',
        description: 'The window lock in the bedroom is broken. This is a security concern.',
        category: 'SAFETY',
        severity: 'HIGH',
        location: 'bedroom',
        isPublic: true,
      },
    ],
  },
  {
    email: 'admin@test.com',
    clerkId: '',
    firstName: 'Test',
    lastName: 'Admin',
    unit: '2A',
    permissions: ['VIEW_ALL_ISSUES', 'MANAGE_ISSUES', 'VIEW_ALL_TENANTS', 'MANAGE_TENANTS'],
    issues: [],
  },
  {
    email: 'maintenance@test.com',
    clerkId: '',
    firstName: 'Test',
    lastName: 'Maintenance',
    unit: null,
    permissions: ['VIEW_ALL_ISSUES', 'MANAGE_ISSUES'],
    issues: [],
  },
];

async function getClerkUsers() {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is required');
  }
  
  console.log('🔍 Fetching users from Clerk...');
  
  const clerkUsers = new Map();
  
  for (const userData of TEST_USERS_DATA) {
    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(userData.email)}`,
        {
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          },
        }
      );
      
      if (response.ok) {
        const users = await response.json();
        if (users.length > 0) {
          clerkUsers.set(userData.email, users[0].id);
          console.log(`✅ Found ${userData.email} in Clerk (ID: ${users[0].id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching ${userData.email} from Clerk:`, error);
    }
  }
  
  return clerkUsers;
}

async function seedTestData() {
  console.log('🌱 Starting test data seed...\n');
  
  try {
    // Get Clerk user IDs
    const clerkUsers = await getClerkUsers();
    
    if (clerkUsers.size === 0) {
      console.error('❌ No test users found in Clerk. Run "pnpm test-users:create" first.');
      return;
    }
    
    // Get or create building
    let building = await prisma.building.findFirst({
      where: { name: TEST_BUILDING.name },
    });
    
    if (!building) {
      console.log('🏢 Creating test building...');
      building = await prisma.building.create({
        data: TEST_BUILDING,
      });
      
      // Create all units
      const units = [];
      for (let floor = 1; floor <= 10; floor++) {
        for (const line of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
          units.push({
            buildingId: building.id,
            unitNumber: `${floor}${line}`,
            floor,
            line,
          });
        }
      }
      
      await prisma.unit.createMany({ data: units });
      console.log('✅ Created building with 80 units');
    }
    
    // Get admin user for granting permissions
    const adminUser = await prisma.user.findFirst({
      where: { email: 'mike.edelman@gmail.com' },
    });
    
    if (!adminUser) {
      console.error('❌ Admin user mike.edelman@gmail.com not found. Please sign in first.');
      return;
    }
    
    // Process each test user
    for (const userData of TEST_USERS_DATA) {
      const clerkId = clerkUsers.get(userData.email);
      if (!clerkId) {
        console.log(`⚠️  Skipping ${userData.email} - not found in Clerk`);
        continue;
      }
      
      console.log(`\n👤 Processing ${userData.email}...`);
      
      // Create or update user in database
      let user = await prisma.user.findUnique({
        where: { clerkId },
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        });
        console.log('  ✅ Created user in database');
      } else {
        console.log('  ℹ️  User already exists in database');
      }
      
      // Assign unit if specified
      if (userData.unit) {
        const unit = await prisma.unit.findFirst({
          where: {
            buildingId: building.id,
            unitNumber: userData.unit,
          },
        });
        
        if (unit) {
          const existingTenancy = await prisma.tenancy.findFirst({
            where: {
              userId: user.id,
              isCurrent: true,
            },
          });
          
          if (!existingTenancy) {
            await prisma.tenancy.create({
              data: {
                userId: user.id,
                unitId: unit.id,
                startDate: new Date(),
                isCurrent: true,
              },
            });
            console.log(`  ✅ Assigned to unit ${userData.unit}`);
            
            // Also create building role for tenant
            await prisma.buildingRole.upsert({
              where: {
                userId_buildingId_role: {
                  userId: user.id,
                  buildingId: building.id,
                  role: 'TENANT',
                },
              },
              update: {},
              create: {
                userId: user.id,
                buildingId: building.id,
                role: 'TENANT',
              },
            });
          } else {
            console.log(`  ℹ️  Already assigned to unit ${existingTenancy.unit?.unitNumber}`);
          }
        }
      }
      
      // Grant permissions
      if (userData.permissions && userData.permissions.length > 0) {
        for (const permission of userData.permissions) {
          const existingPermission = await prisma.adminPermission.findUnique({
            where: {
              userId_buildingId_permission: {
                userId: user.id,
                buildingId: building.id,
                permission,
              },
            },
          });
          
          if (!existingPermission) {
            await prisma.adminPermission.create({
              data: {
                userId: user.id,
                buildingId: building.id,
                permission,
                grantedBy: adminUser.id,
              },
            });
            console.log(`  ✅ Granted permission: ${permission}`);
            
            // Log the permission grant
            await prisma.permissionAuditLog.create({
              data: {
                userId: user.id,
                buildingId: building.id,
                permission,
                action: 'granted',
                performedBy: adminUser.id,
              },
            });
          }
        }
      }
      
      // Create test issues
      if (userData.issues && userData.issues.length > 0 && userData.unit) {
        const unit = await prisma.unit.findFirst({
          where: {
            buildingId: building.id,
            unitNumber: userData.unit,
          },
        });
        
        if (unit) {
          for (const issueData of userData.issues) {
            const existingIssue = await prisma.issue.findFirst({
              where: {
                title: issueData.title,
                reporterId: user.id,
              },
            });
            
            if (!existingIssue) {
              await prisma.issue.create({
                data: {
                  ...issueData,
                  reporterId: user.id,
                  unitId: unit.id,
                  buildingId: building.id,
                  status: 'OPEN',
                },
              });
              console.log(`  ✅ Created issue: ${issueData.title}`);
            }
          }
        }
      }
    }
    
    console.log('\n✨ Test data seeding complete!\n');
    console.log('📝 Summary:');
    console.log('- Building: Test Building');
    console.log('- Users: 4 test users with various permissions');
    console.log('- Issues: Sample issues (public and private)');
    console.log('\n🎯 You can now sign in as any test user to test permissions!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanTestData() {
  console.log('🧹 Cleaning test data...\n');
  
  try {
    // Find test building
    const building = await prisma.building.findFirst({
      where: { name: TEST_BUILDING.name },
    });
    
    if (!building) {
      console.log('ℹ️  No test building found');
      return;
    }
    
    // Delete all related data
    console.log('🗑️  Deleting test data...');
    
    // Delete issues
    const deletedIssues = await prisma.issue.deleteMany({
      where: { buildingId: building.id },
    });
    console.log(`  ✅ Deleted ${deletedIssues.count} issues`);
    
    // Delete permissions
    const deletedPermissions = await prisma.adminPermission.deleteMany({
      where: { buildingId: building.id },
    });
    console.log(`  ✅ Deleted ${deletedPermissions.count} permissions`);
    
    // Delete permission audit logs
    const deletedAuditLogs = await prisma.permissionAuditLog.deleteMany({
      where: { buildingId: building.id },
    });
    console.log(`  ✅ Deleted ${deletedAuditLogs.count} audit logs`);
    
    // Delete tenancies
    const deletedTenancies = await prisma.tenancy.deleteMany({
      where: {
        unit: {
          buildingId: building.id,
        },
      },
    });
    console.log(`  ✅ Deleted ${deletedTenancies.count} tenancies`);
    
    // Delete building roles
    const deletedRoles = await prisma.buildingRole.deleteMany({
      where: { buildingId: building.id },
    });
    console.log(`  ✅ Deleted ${deletedRoles.count} building roles`);
    
    // Delete units
    const deletedUnits = await prisma.unit.deleteMany({
      where: { buildingId: building.id },
    });
    console.log(`  ✅ Deleted ${deletedUnits.count} units`);
    
    // Delete building
    await prisma.building.delete({
      where: { id: building.id },
    });
    console.log('  ✅ Deleted test building');
    
    // Note: We don't delete users as they're managed by Clerk
    
    console.log('\n✨ Test data cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedTestData();
    break;
  case 'clean':
    cleanTestData();
    break;
  default:
    console.log('Usage:');
    console.log('  pnpm test-data:seed   # Seed test data (onboard users, create issues)');
    console.log('  pnpm test-data:clean  # Remove test data');
    console.log('');
    console.log('Prerequisites:');
    console.log('1. Run "pnpm test-users:create" first to create users in Clerk');
    console.log('2. Make sure mike.edelman@gmail.com has signed in at least once');
}
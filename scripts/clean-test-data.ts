import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Test data configuration
const TEST_RUN_ID = process.env.TEST_RUN_ID || '';
const emailSuffix = TEST_RUN_ID ? `-${TEST_RUN_ID}` : '';

const TEST_USER_EMAILS = [
  `tenant1${emailSuffix}@test.com`,
  `tenant2${emailSuffix}@test.com`,
  `admin${emailSuffix}@test.com`,
  `maintenance${emailSuffix}@test.com`,
];

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning test data...');
    if (TEST_RUN_ID) {
      console.log(`   Run ID: ${TEST_RUN_ID}`);
    }

    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: TEST_USER_EMAILS,
        },
      },
    });

    if (testUsers.length === 0) {
      console.log('ℹ️  No test users found');
      return;
    }

    console.log(`📋 Found ${testUsers.length} test users`);

    // Clean up in order to respect foreign key constraints
    
    // 1. Delete communications
    const communications = await prisma.communication.deleteMany({
      where: {
        reporterId: {
          in: testUsers.map(u => u.id),
        },
      },
    });
    if (communications.count > 0) {
      console.log(`✅ Deleted ${communications.count} communications`);
    }

    // 2. Delete issues
    const issues = await prisma.issue.deleteMany({
      where: {
        reporterId: {
          in: testUsers.map(u => u.id),
        },
      },
    });
    if (issues.count > 0) {
      console.log(`✅ Deleted ${issues.count} issues`);
    }

    // 3. Delete admin permissions
    const permissions = await prisma.adminPermission.deleteMany({
      where: {
        OR: [
          { userId: { in: testUsers.map(u => u.clerkId) } },
          { grantedBy: { in: testUsers.map(u => u.clerkId) } },
        ],
      },
    });
    if (permissions.count > 0) {
      console.log(`✅ Deleted ${permissions.count} admin permissions`);
    }

    // 4. Delete permission audit logs
    const auditLogs = await prisma.permissionAuditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: testUsers.map(u => u.clerkId) } },
          { performedBy: { in: testUsers.map(u => u.clerkId) } },
        ],
      },
    });
    if (auditLogs.count > 0) {
      console.log(`✅ Deleted ${auditLogs.count} audit logs`);
    }

    // 5. Delete building roles
    const buildingRoles = await prisma.buildingRole.deleteMany({
      where: {
        userId: {
          in: testUsers.map(u => u.id),
        },
      },
    });
    if (buildingRoles.count > 0) {
      console.log(`✅ Deleted ${buildingRoles.count} building roles`);
    }

    // 6. Delete tenancies
    const tenancies = await prisma.tenancy.deleteMany({
      where: {
        userId: {
          in: testUsers.map(u => u.id),
        },
      },
    });
    if (tenancies.count > 0) {
      console.log(`✅ Deleted ${tenancies.count} tenancies`);
    }

    // 7. Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: testUsers.map(u => u.id),
        },
      },
    });
    console.log(`✅ Deleted ${deletedUsers.count} test users`);

    // 8. Delete test building if using TEST_RUN_ID
    if (TEST_RUN_ID) {
      const building = await prisma.building.deleteMany({
        where: {
          name: `Test Building ${TEST_RUN_ID}`,
        },
      });
      if (building.count > 0) {
        console.log(`✅ Deleted test building`);
      }
    }

    console.log('✅ Test data cleanup complete!');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
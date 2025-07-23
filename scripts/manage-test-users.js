// Simple script to manage test users using Clerk's Backend API
// Run with: node scripts/manage-test-users.js create
// or: node scripts/manage-test-users.js delete

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1';

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY environment variable is required');
  console.error('Run: export CLERK_SECRET_KEY=your_secret_key');
  process.exit(1);
}

// Test users configuration
const TEST_USERS = [
  {
    email: 'tenant1@test.com',
    firstName: 'Test',
    lastName: 'Tenant One',
    password: 'TestPassword123!',
  },
  {
    email: 'tenant2@test.com',
    firstName: 'Test',
    lastName: 'Tenant Two',
    password: 'TestPassword123!',
  },
  {
    email: 'admin@test.com',
    firstName: 'Test',
    lastName: 'Admin',
    password: 'TestPassword123!',
  },
  {
    email: 'maintenance@test.com',
    firstName: 'Test',
    lastName: 'Maintenance',
    password: 'TestPassword123!',
  },
];

// Helper function to make Clerk API requests
async function clerkAPI(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${CLERK_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Clerk API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const users = await clerkAPI('GET', `/users?email_address=${encodeURIComponent(email)}`);
    return users[0] || null;
  } catch (error) {
    return null;
  }
}

// Create test users
async function createTestUsers() {
  console.log('🚀 Creating test users in Clerk...\n');
  
  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(user.email);
      
      if (existingUser) {
        console.log(`⚠️  ${user.email} already exists (ID: ${existingUser.id})`);
        continue;
      }
      
      // Create new user
      const newUser = await clerkAPI('POST', '/users', {
        email_address: [user.email],
        password: user.password,
        first_name: user.firstName,
        last_name: user.lastName,
        skip_password_requirement: false,
        skip_password_checks: true,
      });
      
      console.log(`✅ Created ${user.email} (ID: ${newUser.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }
  
  console.log('\n📝 Test User Credentials:');
  console.log('------------------------');
  TEST_USERS.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log('------------------------');
  });
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Sign in as each test user');
  console.log('2. Complete onboarding (request a unit)');
  console.log('3. Sign in as mike.edelman@gmail.com');
  console.log('4. Go to /dashboard/admin/units to approve unit requests');
  console.log('5. Go to /dashboard/admin/access to grant permissions');
}

// Delete test users
async function deleteTestUsers() {
  console.log('🗑️  Deleting test users from Clerk...\n');
  
  for (const user of TEST_USERS) {
    try {
      const existingUser = await getUserByEmail(user.email);
      
      if (!existingUser) {
        console.log(`⚠️  ${user.email} not found`);
        continue;
      }
      
      await clerkAPI('DELETE', `/users/${existingUser.id}`);
      console.log(`✅ Deleted ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Error deleting ${user.email}:`, error.message);
    }
  }
}

// List test users
async function listTestUsers() {
  console.log('📋 Test users in Clerk:\n');
  
  for (const user of TEST_USERS) {
    try {
      const existingUser = await getUserByEmail(user.email);
      
      if (existingUser) {
        console.log(`✅ ${user.email}`);
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Created: ${new Date(existingUser.created_at).toLocaleString()}`);
        console.log('');
      } else {
        console.log(`❌ ${user.email} - Not found`);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Error checking ${user.email}:`, error.message);
    }
  }
}

// Main script
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      await createTestUsers();
      break;
    case 'delete':
      await deleteTestUsers();
      break;
    case 'list':
      await listTestUsers();
      break;
    default:
      console.log('Usage:');
      console.log('  node scripts/manage-test-users.js create  # Create test users');
      console.log('  node scripts/manage-test-users.js delete  # Delete test users');
      console.log('  node scripts/manage-test-users.js list    # List test users');
      console.log('');
      console.log('Make sure to set CLERK_SECRET_KEY environment variable first:');
      console.log('  export CLERK_SECRET_KEY=your_secret_key');
  }
}

main().catch(console.error);
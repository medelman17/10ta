#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from '../lib/db';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { DocumentCategory, DocumentVisibility } from '@prisma/client';

interface DocumentToSeed {
  filePath: string;
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  uploadedByEmail?: string; // Optional, defaults to system upload
}

// Documents to seed into the public library
const documentsToSeed: DocumentToSeed[] = [
  {
    filePath: 'assets/library/Atlantic Highlands, NJ, Muni Code Ch 277, Rent Control.pdf',
    title: 'Atlantic Highlands Rent Control Ordinance',
    description: 'Municipal Code Chapter 277 covering rent control regulations and tenant protections in Atlantic Highlands, New Jersey.',
    category: 'LEGAL_NOTICES',
    tags: ['rent-control', 'atlantic-highlands', 'new-jersey', 'ordinance', 'municipal-code'],
  },
  // Additional PDF documents would go here as they're added to assets/library/
  // Example format:
  // {
  //   filePath: 'assets/library/nj-tenant-rights-handbook.pdf',
  //   title: 'New Jersey Tenant Rights Handbook',
  //   description: 'Official state handbook on tenant rights and responsibilities',
  //   category: 'TENANT_RIGHTS',
  //   tags: ['tenant-rights', 'new-jersey', 'state-handbook', 'legal-guide'],
  // },
];

// Sample documents we can create as placeholders (these would be actual files in a real scenario)
const sampleDocuments: Array<{
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  content: string; // Text content for generated PDFs
}> = [
  {
    title: 'New Jersey Tenant Rights Guide',
    description: 'Comprehensive guide to tenant rights and landlord responsibilities under New Jersey state law.',
    category: 'TENANT_RIGHTS',
    tags: ['tenant-rights', 'new-jersey', 'landlord-responsibilities', 'housing-law'],
    content: `NEW JERSEY TENANT RIGHTS GUIDE

Overview:
New Jersey provides strong protections for tenants. This guide covers your key rights and responsibilities.

Key Tenant Rights:
1. Right to a habitable dwelling
2. Protection from discriminatory practices
3. Right to privacy and peaceful enjoyment
4. Protection from retaliatory eviction
5. Right to organize tenant associations

Landlord Responsibilities:
- Maintain property in safe, habitable condition
- Make necessary repairs promptly
- Provide adequate heat and hot water
- Respect tenant privacy (24-hour notice for entry)
- Follow proper legal procedures for evictions

Security Deposits:
- Maximum of 1.5 months' rent
- Must be returned within 30 days of lease termination
- Landlord must provide itemized list of deductions

For More Information:
Contact your local tenant rights organization or legal aid society.

This is a simplified guide. Consult with legal professionals for specific situations.`
  },
  {
    title: 'How to Document Housing Issues',
    description: 'Step-by-step guide for properly documenting housing problems to strengthen tenant cases.',
    category: 'MAINTENANCE_GUIDES',
    tags: ['documentation', 'evidence', 'housing-issues', 'tenant-advocacy'],
    content: `HOW TO DOCUMENT HOUSING ISSUES

Proper documentation is crucial for resolving housing problems and protecting your rights as a tenant.

Documentation Checklist:
□ Take photos with timestamps
□ Keep written records of all communications
□ Save receipts and invoices
□ Document dates, times, and witnesses
□ Maintain copies of all correspondence

Photography Tips:
- Use good lighting
- Include reference objects for scale
- Take wide shots and close-ups
- Capture before and after conditions
- Enable timestamp on your camera/phone

Written Records:
- Date and time of incidents
- Description of problems
- Names of people involved
- Actions taken
- Follow-up required

Communication Log:
- Save all emails and text messages
- Record phone call details
- Keep copies of letters sent/received
- Note response times
- Document any promises made

Why Documentation Matters:
- Strengthens legal cases
- Demonstrates good faith efforts
- Provides evidence for repairs needed
- Protects against retaliation
- Supports building-wide advocacy

Remember: Consistent, detailed documentation is your best protection as a tenant.`
  },
  {
    title: 'Sample Repair Request Letter',
    description: 'Professional template for requesting repairs from landlords with proper legal language.',
    category: 'LEGAL_FORMS',
    tags: ['repair-request', 'template', 'landlord-communication', 'legal-language'],
    content: `SAMPLE REPAIR REQUEST LETTER

[Your Name]
[Your Address]
[Unit Number]
[City, State, ZIP]
[Phone Number]
[Email]

[Date]

[Landlord/Property Manager Name]
[Landlord Address]
[City, State, ZIP]

Re: Urgent Repair Request - [Your Address], Unit [Unit Number]

Dear [Landlord/Property Manager Name],

I am writing to formally request immediate repairs to address the following issues in my rental unit:

[Describe the problem(s) in detail, including:]
- Specific location of the issue
- When the problem first occurred
- How it affects habitability
- Any safety concerns
- Previous communications about this issue

Examples:
• Kitchen faucet has been leaking for two weeks, causing water damage to cabinet
• Bathroom exhaust fan is not working, causing excessive moisture and potential mold
• Bedroom window does not close properly, creating security and weather concerns

These conditions affect the habitability of the unit and may violate local housing codes. Under [state] law, landlords are required to maintain rental properties in safe and habitable condition.

I request that these repairs be completed within [reasonable timeframe, typically 30 days for non-emergency repairs, 24-48 hours for emergency repairs] from the date of this letter.

Please contact me at [phone number] or [email] to schedule access for repairs or to discuss this matter further.

I have documented these issues with photographs and am keeping detailed records of all communications regarding these repairs.

Thank you for your prompt attention to these matters.

Sincerely,

[Your Signature]
[Your Printed Name]
[Date]

---
Delivery Method: [Hand delivered / Certified mail / Email with read receipt]
Copy retained for records: [Date]`
  },
  {
    title: 'Emergency Contact Information Template',
    description: 'Important emergency contacts for tenants including building management, utilities, and city services.',
    category: 'EMERGENCY_INFO',
    tags: ['emergency', 'contacts', 'safety', 'building-information'],
    content: `EMERGENCY CONTACT INFORMATION

EMERGENCY SERVICES:
Police/Fire/Medical Emergency: 911
Non-Emergency Police: [Local number]
Poison Control: 1-800-222-1222

BUILDING MANAGEMENT:
Property Manager: [Name] - [Phone]
After-Hours Emergency: [Phone]
Maintenance Office: [Phone]
Security Office: [Phone]

UTILITIES:
Electric Company: [Name] - [Phone]
Gas Company: [Name] - [Phone]
Water Department: [Phone]
Internet/Cable: [Provider] - [Phone]

BUILDING SERVICES:
Elevator Emergency: [Phone]
Plumber (Emergency): [Phone]
Electrician (Emergency): [Phone]
Locksmith (24/7): [Phone]

TENANT RESOURCES:
Tenant Association: [Contact]
Legal Aid Society: [Phone]
Housing Court: [Address/Phone]
Fair Housing Office: [Phone]

CITY SERVICES:
311 (Non-emergency city services)
Building Inspector: [Phone]
Health Department: [Phone]
Fire Department (Non-emergency): [Phone]

IMPORTANT NOTES:
- Keep this list accessible at all times
- Update contact information regularly
- Share with household members
- Post near phone or in visible location`
  },
  {
    title: 'Move-In Inspection Checklist',
    description: 'Comprehensive checklist for documenting unit condition when moving in to protect security deposit.',
    category: 'CHECKLISTS',
    tags: ['move-in', 'inspection', 'checklist', 'security-deposit', 'documentation'],
    content: `MOVE-IN INSPECTION CHECKLIST

Date: _________ Unit: _________ 
Tenant(s): _____________________
Landlord/Agent: ________________

GENERAL CONDITION:
□ Walls (note any holes, cracks, stains)
□ Ceilings (water damage, cracks)
□ Floors (scratches, stains, damage)
□ Windows (cracks, broken locks)
□ Doors (damage, working locks)
□ Light fixtures (all working)
□ Electrical outlets (all functioning)
□ Smoke detectors (present and working)
□ Carbon monoxide detectors

KITCHEN:
□ Refrigerator (clean, working)
□ Stove/Oven (all burners work)
□ Dishwasher (if applicable)
□ Sink (no leaks, drains properly)
□ Cabinets (doors close properly)
□ Countertops (no damage)
□ Garbage disposal (if applicable)

BATHROOM(S):
□ Toilet (flushes properly, no leaks)
□ Sink (drains, no leaks)
□ Tub/Shower (drains, no leaks)
□ Tiles (no cracks or missing grout)
□ Exhaust fan (working)
□ Medicine cabinet
□ Towel bars (secure)

BEDROOM(S):
□ Closet doors
□ Closet rods/shelves
□ Windows/screens
□ Heating/cooling vents
□ Ceiling fan (if applicable)

LIVING AREAS:
□ Fireplace (if applicable)
□ Built-in shelving
□ Carpeting condition
□ Baseboards

EXTERIOR (if applicable):
□ Balcony/Patio
□ Storage area
□ Mailbox
□ Parking space

UTILITIES:
□ Heat (test all rooms)
□ Air conditioning
□ Hot water
□ Water pressure
□ All keys provided

NOTES/EXISTING DAMAGE:
_________________________________
_________________________________
_________________________________

PHOTOS TAKEN: □ Yes □ No
Video walkthrough: □ Yes □ No

Tenant Signature: _________ Date: ___
Landlord Signature: _______ Date: ___

IMPORTANT: Take photos of everything!`
  },
  {
    title: 'Tenant Meeting Agenda Template',
    description: 'Standard template for organizing productive tenant association meetings.',
    category: 'MEETING_AGENDAS',
    tags: ['meeting', 'agenda', 'tenant-association', 'template', 'organization'],
    content: `TENANT ASSOCIATION MEETING AGENDA

Meeting Date: _____________
Meeting Time: _____________
Location: _________________

1. CALL TO ORDER (5 min)
   - Welcome and introductions
   - Review and approve previous meeting minutes
   - Announce recording policy (if applicable)

2. BUILDING UPDATES (15 min)
   - Maintenance and repair updates
   - Recent incidents or concerns
   - Management communications
   - New tenant welcome

3. COMMITTEE REPORTS (20 min)
   - Maintenance Committee
   - Safety & Security Committee
   - Social Committee
   - Communications Committee
   - Other committees as established

4. OLD BUSINESS (15 min)
   - Follow-up on action items from last meeting
   - Update on ongoing issues/campaigns
   - Status of submitted repair requests
   - Legal proceedings updates (if any)

5. NEW BUSINESS (20 min)
   - New issues raised by tenants
   - Proposed actions or campaigns
   - Upcoming building inspections
   - Policy changes or notifications

6. FINANCIAL REPORT (5 min)
   - Current association funds
   - Recent expenses
   - Upcoming needs

7. OPEN FORUM (10 min)
   - Tenant concerns not on agenda
   - Suggestions for improvement
   - Community announcements

8. ACTION ITEMS REVIEW (5 min)
   - Summarize decisions made
   - Assign responsibilities
   - Set deadlines

9. NEXT MEETING
   - Date, time, and location
   - Agenda items to consider

10. ADJOURNMENT

MEETING GUIDELINES:
- Respect all speakers
- One person speaks at a time
- Stay on topic
- 2-minute limit for individual comments
- Focus on solutions, not blame

Notes: ______________________`
  },
  {
    title: 'Fair Housing Rights Overview',
    description: 'Summary of federal fair housing protections against discrimination in rental housing.',
    category: 'TENANT_RIGHTS',
    tags: ['fair-housing', 'discrimination', 'tenant-rights', 'federal-law', 'protected-classes'],
    content: `FAIR HOUSING RIGHTS OVERVIEW

The Fair Housing Act protects you from discrimination in housing based on:

PROTECTED CLASSES:
• Race or color
• National origin
• Religion
• Sex (including sexual harassment)
• Familial status (families with children under 18)
• Disability (physical or mental)

Many states and localities add additional protections for:
• Sexual orientation
• Gender identity
• Source of income
• Age
• Marital status
• Military status

ILLEGAL DISCRIMINATION INCLUDES:
• Refusing to rent or sell housing
• Setting different terms, conditions, or privileges
• Providing different housing services or facilities
• Falsely stating housing is unavailable
• Refusing reasonable accommodations for disabilities
• Refusing to allow reasonable modifications
• Threatening, coercing, or intimidating
• Interfering with fair housing rights

EXAMPLES OF DISCRIMINATION:
• "No children allowed"
• "English speakers only"
• Charging higher rent based on race
• Sexual harassment by landlord/staff
• Refusing service animals
• Steering to certain floors/buildings
• Different application requirements

REASONABLE ACCOMMODATIONS:
Landlords must provide reasonable accommodations for tenants with disabilities:
• Assigned parking spaces
• Permission for service/support animals
• Flexible rent payment schedule
• Transfer to accessible unit
• Installation of grab bars (at tenant's expense)

FILING A COMPLAINT:
1. Document all incidents (dates, times, witnesses)
2. File with HUD within one year: 1-800-669-9777
3. File with state/local agencies
4. Consult with attorney for lawsuit (2-year limit)

RETALIATION IS ILLEGAL:
Landlords cannot retaliate against you for:
• Filing a fair housing complaint
• Participating in an investigation
• Exercising your fair housing rights

RESOURCES:
• HUD.gov/fairhousing
• National Fair Housing Alliance: 202-898-1661
• Local fair housing organizations
• Legal aid societies

Remember: You have the right to live free from discrimination!`
  },
  {
    title: 'Building-Wide Petition Template',
    description: 'Template for creating effective petitions for building-wide issues and improvements.',
    category: 'PETITIONS',
    tags: ['petition', 'template', 'organizing', 'tenant-action', 'collective-action'],
    content: `BUILDING-WIDE PETITION TEMPLATE

PETITION FOR: [Clear, specific demand]

TO: [Landlord/Management Company Name]
    [Address]

DATE: _____________

We, the undersigned tenants of [Building Address], hereby petition for the following:

ISSUE/DEMAND:
[Clearly state what you're asking for - be specific and reasonable]

BACKGROUND:
[Explain the problem, how long it's existed, and why it needs attention]
• Point 1: Specific issue with dates/details
• Point 2: Impact on tenants
• Point 3: Previous attempts to address
• Point 4: Legal/safety requirements

REQUESTED ACTION:
We respectfully request that [Landlord/Management] take the following actions:
1. [Specific action with timeline]
2. [Specific action with timeline]
3. [Specific action with timeline]

TIMELINE:
We request a written response within [X] days and completion of requested actions within [X] days/weeks.

TENANT SIGNATURES:
Name (Print) | Unit # | Signature | Date | Contact (Optional)
___________|________|___________|______|__________________
___________|________|___________|______|__________________
___________|________|___________|______|__________________

[Continue signature lines as needed]

Total Signatures: _____ representing _____ % of building units

PETITION ORGANIZERS:
Name: _____________ Unit: _____ Phone: _____________
Name: _____________ Unit: _____ Phone: _____________

DELIVERY:
□ Hand delivered to: _________ Date: _____
□ Sent certified mail: Tracking #: _________ Date: _____
□ Email with read receipt to: _________ Date: _____

Copy provided to:
□ All signing tenants
□ Tenant association files
□ Legal representation
□ Housing authority (if applicable)

TIPS FOR EFFECTIVE PETITIONS:
• Be specific in demands
• Set reasonable timelines
• Get 30%+ of tenants to sign
• Document delivery method
• Follow up regularly
• Consider legal consultation`
  },
  {
    title: 'Rent Receipt Template',
    description: 'Simple template for documenting rent payments when landlord doesn\'t provide receipts.',
    category: 'RENT_RECEIPTS',
    tags: ['rent', 'receipt', 'payment', 'documentation', 'financial-records'],
    content: `RENT RECEIPT TEMPLATE

RECEIPT #: _____________
DATE: _________________

RECEIVED FROM:
Tenant Name: _________________________
Unit Number: _________________________
Building Address: ____________________
____________________________________

PAYMENT INFORMATION:
Amount Received: $___________________
Payment Period: From _______ to _______
Payment Method:
□ Cash
□ Check #: __________
□ Money Order #: __________
□ Bank Transfer
□ Online Payment (Platform: _________)
□ Other: ______________

PAYMENT BREAKDOWN:
Monthly Rent: $__________
Late Fees: $__________
Other Fees: $__________
TOTAL PAID: $__________

Balance Due (if any): $__________

RECEIVED BY:
Name: _______________________________
Title: _____________________________
Signature: _________________________
Date: ______________________________

TENANT ACKNOWLEDGMENT:
I acknowledge making this payment.

Tenant Signature: __________________
Date: ______________________________

IMPORTANT NOTES:
• Always request a receipt for rent payments
• Keep copies of all receipts
• Take photos of cash/money order payments
• Save bank transaction records
• Never pay rent without documentation

FOR CASH PAYMENTS:
• Count money in front of landlord
• Get receipt immediately
• Never leave cash under door
• Consider switching to traceable payment

This receipt serves as proof of payment.
Keep for your records.`
  },
  {
    title: 'Utility Usage Tracking Sheet',
    description: 'Template for monitoring utility usage and costs to identify unusual charges or usage patterns.',
    category: 'UTILITY_BILLS',
    tags: ['utilities', 'tracking', 'bills', 'energy', 'cost-monitoring'],
    content: `UTILITY USAGE TRACKING SHEET

Unit: _______ Tenant: _______________ Year: _______

ELECTRICITY USAGE:
Month | Reading | kWh Used | Amount | Notes
Jan   |         |          |        |
Feb   |         |          |        |
Mar   |         |          |        |
Apr   |         |          |        |
May   |         |          |        |
Jun   |         |          |        |
Jul   |         |          |        |
Aug   |         |          |        |
Sep   |         |          |        |
Oct   |         |          |        |
Nov   |         |          |        |
Dec   |         |          |        |
TOTAL:|         |          |        |

GAS USAGE:
Month | Reading | Therms | Amount | Notes
Jan   |         |        |        |
Feb   |         |        |        |
Mar   |         |        |        |
Apr   |         |        |        |
May   |         |        |        |
Jun   |         |        |        |
Jul   |         |        |        |
Aug   |         |        |        |
Sep   |         |        |        |
Oct   |         |        |        |
Nov   |         |        |        |
Dec   |         |        |        |
TOTAL:|         |        |        |

WATER USAGE:
Month | Reading | Gallons | Amount | Notes
[Similar format for 12 months]

YEAR-OVER-YEAR COMPARISON:
Utility | This Year | Last Year | % Change
Electric|           |           |
Gas     |           |           |
Water   |           |           |
TOTAL   |           |           |

RED FLAGS TO WATCH FOR:
• Sudden usage spikes
• Bills during vacancy
• Charges for unused services
• Common area charges
• Estimated readings for months

ENERGY SAVING TIPS:
• Report leaky faucets immediately
• Use LED bulbs
• Seal windows/doors
• Adjust thermostat seasonally
• Unplug unused appliances
• Report HVAC issues promptly

DISPUTE PROCESS:
1. Compare to previous months
2. Check for meter reading errors
3. Document with photos
4. Contact utility company
5. File complaint if needed
6. Request meter testing

Notes: _____________________________`
  },
  {
    title: 'Security Deposit Demand Letter',
    description: 'Template letter for requesting return of security deposit after move-out.',
    category: 'LEGAL_FORMS',
    tags: ['security-deposit', 'demand-letter', 'move-out', 'legal', 'template'],
    content: `SECURITY DEPOSIT DEMAND LETTER

[Your Name]
[Your New Address]
[City, State, ZIP]
[Phone Number]
[Email]

[Date]

CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[Landlord Name]
[Landlord Address]
[City, State, ZIP]

Re: Demand for Return of Security Deposit
    Former Address: [Your Previous Rental Address]
    Unit: [Unit Number]
    Move-Out Date: [Date]

Dear [Landlord Name]:

I am writing to request the immediate return of my security deposit in the amount of $_______, which I paid when I moved into the above-referenced rental unit on [move-in date].

I vacated the premises on [move-out date] and left the unit in clean, rentable condition. I have fulfilled all obligations under the lease agreement, including:
• Paying all rent through the end of the tenancy
• Providing proper notice of intent to vacate
• Returning all keys and access devices
• Leaving the unit in the same condition as received, minus normal wear and tear

According to [State] law, you are required to return my security deposit within [number] days of the termination of tenancy, along with an itemized list of any deductions. As of today's date, [number] days have passed since I vacated the premises, and I have not received my deposit or any communication regarding deductions.

FORWARDING ADDRESS:
Please send my security deposit to:
[Your New Address]
[City, State, ZIP]

DEMAND:
I demand the immediate return of my full security deposit in the amount of $______. If you believe you are entitled to retain any portion of my deposit, please provide a detailed, itemized list of deductions along with receipts or estimates for any claimed damages or cleaning.

LEGAL NOTICE:
Please be advised that under [State] law, failure to return a security deposit in bad faith may result in penalties of [describe state penalties, often 2-3x the deposit amount]. If I do not receive my deposit or a satisfactory explanation within [number] days of this letter, I will pursue all available legal remedies, including:
• Filing a claim in small claims court
• Seeking statutory penalties
• Recovering attorney's fees and court costs

DOCUMENTATION:
For your reference, I have retained the following documentation:
• Move-in inspection report
• Photos/video of unit condition at move-out
• Copies of all rent payments
• Copy of the lease agreement
• All correspondence regarding the tenancy

I trust this matter can be resolved promptly without the need for legal action. Please contact me if you have any questions or need additional information.

Sincerely,

[Your Signature]
[Your Printed Name]
[Date]

Enclosures:
□ Copy of lease agreement
□ Proof of security deposit payment
□ Move-out inspection form
□ Photos of unit condition

cc: [State Housing Authority]
    [Local Tenant Rights Organization]
    File

CERTIFIED MAIL #: ___________________`
  }
];

async function getSystemUser() {
  // Try to find an admin user to attribute uploads to
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@10oceantenants.org' },
        { email: 'mike.edelman@gmail.com' },
        { 
          buildingRoles: {
            some: {
              role: 'BUILDING_ADMIN'
            }
          }
        }
      ]
    }
  });

  return adminUser;
}

async function getOrCreateBuilding() {
  // Get the building for the association
  let building = await prisma.building.findFirst({
    where: {
      name: { contains: 'Ocean' }
    }
  });

  if (!building) {
    console.log('Creating default building...');
    building = await prisma.building.create({
      data: {
        name: '10 Ocean Avenue',
        address: '10 Ocean Avenue, Brooklyn, NY 11235',
        totalUnits: 80
      }
    });
  }

  return building;
}

async function uploadFile(filePath: string, title: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
  
  // Upload to Vercel Blob
  const blob = await put(`public-library/${Date.now()}-${fileName}`, fileBuffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: fileType
  });

  return blob.url;
}

async function createTextDocument(title: string, content: string): Promise<string> {
  // Create a simple text file and upload it
  // Note: In production, you might want to convert these to PDFs using a library like:
  // - jsPDF (client-side PDF generation)
  // - puppeteer (server-side PDF generation from HTML)
  // - react-pdf (React-based PDF generation)
  
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
  
  // Format the content with proper spacing and structure
  const formattedContent = content
    .split('\n')
    .map(line => line.trim())
    .join('\n');
  
  const blob = await put(`public-library/${Date.now()}-${fileName}`, formattedContent, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'text/plain'
  });

  return blob.url;
}

async function seedDocuments() {
  console.log('🌱 Starting public document seeding...');

  const systemUser = await getSystemUser();
  const building = await getOrCreateBuilding();

  if (!systemUser) {
    console.log('❌ No admin user found. Please create an admin user first.');
    return;
  }

  console.log(`📁 Using building: ${building.name}`);
  console.log(`👤 Uploading as: ${systemUser.email}`);

  // Seed actual files from assets/library
  for (const doc of documentsToSeed) {
    try {
      console.log(`📤 Uploading: ${doc.title}`);
      
      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          title: doc.title,
          isActive: true
        }
      });

      if (existingDoc) {
        console.log(`⏭️  Document already exists: ${doc.title}`);
        continue;
      }

      const fileUrl = await uploadFile(doc.filePath, doc.title);
      const fileStat = fs.statSync(doc.filePath);
      const fileName = path.basename(doc.filePath);

      await prisma.document.create({
        data: {
          title: doc.title,
          description: doc.description,
          category: doc.category,
          visibility: 'PUBLIC' as DocumentVisibility,
          tags: doc.tags,
          buildingId: building.id,
          uploadedBy: systemUser.id,
          fileUrl,
          fileName,
          fileType: 'application/pdf',
          fileSize: fileStat.size,
          isActive: true
        }
      });

      console.log(`✅ Uploaded: ${doc.title}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${doc.title}:`, error);
    }
  }

  // Seed sample text documents
  for (const doc of sampleDocuments) {
    try {
      console.log(`📝 Creating: ${doc.title}`);
      
      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          title: doc.title,
          isActive: true
        }
      });

      if (existingDoc) {
        console.log(`⏭️  Document already exists: ${doc.title}`);
        continue;
      }

      const fileUrl = await createTextDocument(doc.title, doc.content);

      await prisma.document.create({
        data: {
          title: doc.title,
          description: doc.description,
          category: doc.category,
          visibility: 'PUBLIC' as DocumentVisibility,
          tags: doc.tags,
          buildingId: building.id,
          uploadedBy: systemUser.id,
          fileUrl,
          fileName: `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`,
          fileType: 'text/plain',
          fileSize: Buffer.byteLength(doc.content, 'utf8'),
          isActive: true
        }
      });

      console.log(`✅ Created: ${doc.title}`);
    } catch (error) {
      console.error(`❌ Failed to create ${doc.title}:`, error);
    }
  }

  console.log('🎉 Public document seeding completed!');
}

async function main() {
  try {
    await seedDocuments();
  } catch (error) {
    console.error('❌ Error seeding documents:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { seedDocuments };
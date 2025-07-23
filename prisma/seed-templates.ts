import { PrismaClient, TemplateCategory } from '@prisma/client';

const prisma = new PrismaClient();

const communicationTemplates = [
  // MAINTENANCE templates
  {
    name: "Maintenance Request Follow-up",
    category: TemplateCategory.MAINTENANCE,
    description: "Follow up on unresolved maintenance issues",
    subject: "Follow-up: Outstanding Maintenance Request for Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

I am writing to follow up on my maintenance request submitted on {REQUEST_DATE} regarding {ISSUE_DESCRIPTION} in Unit {UNIT_NUMBER}.

As of today's date ({DATE}), this issue remains unresolved. This matter requires immediate attention as it affects the habitability of my residence and may violate local housing codes.

Please provide:
1. A specific timeline for completion of repairs
2. The name and contact information of the contractor assigned
3. Confirmation that all necessary permits have been obtained

I am available for access to the unit during reasonable hours with 24-hour notice. Please contact me at {TENANT_PHONE} or {TENANT_EMAIL} to schedule the repair.

I look forward to your prompt response and resolution of this matter.

Sincerely,
{TENANT_NAME}
Unit {UNIT_NUMBER}
{DATE}`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{REQUEST_DATE}", "{ISSUE_DESCRIPTION}", "{DATE}", "{TENANT_PHONE}", "{TENANT_EMAIL}", "{TENANT_NAME}"],
    isBuiltIn: true
  },
  
  {
    name: "Emergency Maintenance Request",
    category: TemplateCategory.MAINTENANCE,
    description: "For urgent maintenance issues affecting habitability",
    subject: "URGENT: Emergency Maintenance Required - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

This is to notify you of an emergency maintenance situation in Unit {UNIT_NUMBER} that requires immediate attention.

EMERGENCY ISSUE: {ISSUE_DESCRIPTION}

This situation poses an immediate threat to health, safety, or property and must be addressed within 24 hours as required by law.

I have taken the following immediate steps:
{IMMEDIATE_ACTIONS}

Please contact me immediately at {TENANT_PHONE} to arrange emergency repairs. If I do not hear from you within 4 hours, I may need to contact local housing authorities and/or hire emergency contractors with costs deducted from rent as permitted by law.

This notice is being sent on {DATE} at {TIME}.

Urgently,
{TENANT_NAME}
Unit {UNIT_NUMBER}`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{ISSUE_DESCRIPTION}", "{IMMEDIATE_ACTIONS}", "{TENANT_PHONE}", "{DATE}", "{TIME}", "{TENANT_NAME}"],
    isBuiltIn: true
  },

  // RENT templates  
  {
    name: "Rent Increase Response",
    category: TemplateCategory.RENT,
    description: "Formal response to rent increase notices",
    subject: "Response to Rent Increase Notice - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

I received your notice dated {NOTICE_DATE} regarding a rent increase for Unit {UNIT_NUMBER} from {CURRENT_RENT} to {NEW_RENT}, effective {EFFECTIVE_DATE}.

I am requesting the following information as required by law:
1. Documentation showing this increase complies with local rent stabilization laws
2. Itemized list of improvements or increased costs justifying this increase
3. Confirmation that proper legal notice period has been provided
4. Verification that the unit is not subject to rent control restrictions

{ADDITIONAL_CONCERNS}

Please provide this documentation within 10 business days. I reserve all rights under applicable tenant protection laws.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}
{DATE}`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{NOTICE_DATE}", "{CURRENT_RENT}", "{NEW_RENT}", "{EFFECTIVE_DATE}", "{ADDITIONAL_CONCERNS}", "{TENANT_NAME}", "{DATE}"],
    isBuiltIn: true
  },

  // LEGAL templates
  {
    name: "Habitability Complaint",
    category: TemplateCategory.LEGAL,
    description: "Formal notice of habitability violations",
    subject: "Notice of Habitability Violations - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

This letter serves as formal notice of conditions in Unit {UNIT_NUMBER} that violate the warranty of habitability and local housing codes.

VIOLATIONS IDENTIFIED:
{VIOLATION_LIST}

These conditions have existed since {START_DATE} and materially affect the habitability of the premises. You are legally required to remedy these violations within a reasonable time, not to exceed 30 days for non-emergency issues.

I am documenting these conditions with photographs and maintaining records of all communications. Failure to address these violations may result in:
- Rent withholding as permitted by law
- Filing complaints with local housing authorities
- Legal action for breach of warranty of habitability
- Termination of lease due to constructive eviction

Please confirm in writing your plan to remedy these violations, including specific timelines for completion.

This notice is served on {DATE}.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{VIOLATION_LIST}", "{START_DATE}", "{DATE}", "{TENANT_NAME}"],
    isBuiltIn: true
  },

  // NOISE templates
  {
    name: "Noise Complaint Escalation",
    category: TemplateCategory.NOISE,
    description: "Escalation of ongoing noise issues",
    subject: "Escalation: Ongoing Noise Disturbances - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

I am writing to escalate my ongoing concerns regarding excessive noise from {NOISE_SOURCE} that is substantially interfering with my quiet enjoyment of Unit {UNIT_NUMBER}.

PREVIOUS COMMUNICATIONS:
{PREVIOUS_ATTEMPTS}

CURRENT SITUATION:
- Noise occurs: {FREQUENCY_PATTERN}
- Decibel levels exceed reasonable limits
- Sleep and daily activities are significantly disrupted
- Other tenants have also complained

Despite previous communications, this issue persists. As my landlord, you have a duty to ensure all tenants can enjoy their premises without unreasonable interference.

REQUESTED ACTIONS:
1. Immediate intervention with the noise-generating tenant/source
2. Enforcement of lease quiet hours provisions  
3. Written confirmation of steps being taken
4. Timeline for resolution

If this matter is not resolved within 14 days, I will file complaints with appropriate authorities and may seek legal remedies including rent reduction or lease termination.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}
{DATE}`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{NOISE_SOURCE}", "{PREVIOUS_ATTEMPTS}", "{FREQUENCY_PATTERN}", "{TENANT_NAME}", "{DATE}"],
    isBuiltIn: true
  },

  // SECURITY templates
  {
    name: "Security Concern Report",
    category: TemplateCategory.SECURITY,
    description: "Report security issues affecting tenant safety",
    subject: "Security Concerns Requiring Immediate Attention - {BUILDING_ADDRESS}",
    content: `Dear {LANDLORD_NAME},

I am writing to report serious security concerns at {BUILDING_ADDRESS} that require immediate attention to ensure tenant safety.

SECURITY ISSUES IDENTIFIED:
{SECURITY_ISSUES}

These conditions create substantial safety risks for all residents and may violate local housing and safety codes. As the property owner, you have a legal duty to maintain reasonable security measures.

REQUESTED IMMEDIATE ACTIONS:
1. Repair/replacement of all broken security devices
2. Installation of adequate lighting in common areas
3. Securing all building entry points
4. Regular security patrols if appropriate

I am documenting these conditions and will notify local authorities if necessary. Tenant safety cannot be compromised.

Please respond within 48 hours with your plan to address these security concerns.

Urgently,
{TENANT_NAME}
Unit {UNIT_NUMBER}
{DATE}`,
    placeholders: ["{LANDLORD_NAME}", "{BUILDING_ADDRESS}", "{SECURITY_ISSUES}", "{TENANT_NAME}", "{UNIT_NUMBER}", "{DATE}"],
    isBuiltIn: true
  },

  // FOLLOW_UP templates
  {
    name: "General Follow-up",
    category: TemplateCategory.FOLLOW_UP,
    description: "General follow-up for previous communications",
    subject: "Follow-up: {ORIGINAL_SUBJECT} - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

I am following up on my previous communication sent on {ORIGINAL_DATE} regarding {ISSUE_SUMMARY}.

As of today ({DATE}), I have not received a response or seen resolution of this matter. This issue continues to affect {IMPACT_DESCRIPTION}.

For your reference, my original request was:
{ORIGINAL_REQUEST}

I respectfully request:
1. Acknowledgment of receipt of this follow-up
2. Status update on progress toward resolution
3. Revised timeline if original deadlines cannot be met
4. Direct contact information for the person handling this matter

Please respond within 5 business days. Continued delays may necessitate involvement of appropriate authorities or legal counsel.

Thank you for your prompt attention to this matter.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}`,
    placeholders: ["{LANDLORD_NAME}", "{ORIGINAL_SUBJECT}", "{UNIT_NUMBER}", "{ORIGINAL_DATE}", "{ISSUE_SUMMARY}", "{DATE}", "{IMPACT_DESCRIPTION}", "{ORIGINAL_REQUEST}", "{TENANT_NAME}"],
    isBuiltIn: true
  },

  // ESCALATION templates
  {
    name: "Final Notice Before Legal Action",
    category: TemplateCategory.ESCALATION,
    description: "Final warning before pursuing legal remedies",
    subject: "FINAL NOTICE: Unresolved Issues - Unit {UNIT_NUMBER}",
    content: `Dear {LANDLORD_NAME},

This serves as FINAL NOTICE regarding unresolved issues affecting Unit {UNIT_NUMBER} that have been previously communicated without adequate response or resolution.

CHRONOLOGY OF COMMUNICATIONS:
{COMMUNICATION_HISTORY}

OUTSTANDING ISSUES:
{UNRESOLVED_ISSUES}

Despite multiple attempts to resolve these matters cooperatively, you have failed to fulfill your legal obligations as a landlord. These ongoing violations of the lease agreement and housing laws have caused significant hardship.

FINAL DEMAND:
You have 14 days from receipt of this notice to fully resolve all outstanding issues. Failure to do so will result in:

- Filing complaints with local housing authorities
- Initiation of legal proceedings for breach of lease
- Pursuit of monetary damages and attorney's fees
- Possible rent withholding as permitted by law
- Consideration of lease termination due to constructive eviction

This notice represents my final attempt to resolve these matters without legal intervention. I strongly encourage immediate action to avoid unnecessary legal proceedings.

This notice is served on {DATE}.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}

CC: [Tenant Rights Organization/Attorney]`,
    placeholders: ["{LANDLORD_NAME}", "{UNIT_NUMBER}", "{COMMUNICATION_HISTORY}", "{UNRESOLVED_ISSUES}", "{DATE}", "{TENANT_NAME}"],
    isBuiltIn: true
  },

  // GENERAL templates
  {
    name: "Request for Building Inspection",
    category: TemplateCategory.GENERAL,
    description: "Request official inspection of building conditions",
    subject: "Request for Official Building Inspection - {BUILDING_ADDRESS}",
    content: `Dear {LANDLORD_NAME},

I am requesting that you arrange for an official inspection of {BUILDING_ADDRESS} by appropriate municipal authorities to verify compliance with housing codes and safety regulations.

CONCERNS PROMPTING THIS REQUEST:
{INSPECTION_REASONS}

This inspection is necessary to ensure all tenants are living in safe, code-compliant conditions as required by law. Please coordinate with the appropriate departments including:
- Building Department
- Fire Department  
- Health Department
- Housing Authority

Please provide me with:
1. Confirmation that you will request the inspection
2. Scheduled inspection dates once arranged
3. Copies of any inspection reports or violations issued
4. Timeline for addressing any violations found

If you do not arrange for this inspection within 30 days, I will contact the authorities directly to request an inspection.

Thank you for your cooperation in ensuring our building meets all safety and habitability standards.

Respectfully,
{TENANT_NAME}
Unit {UNIT_NUMBER}
{DATE}`,
    placeholders: ["{LANDLORD_NAME}", "{BUILDING_ADDRESS}", "{INSPECTION_REASONS}", "{TENANT_NAME}", "{UNIT_NUMBER}", "{DATE}"],
    isBuiltIn: true
  }
];

export async function seedCommunicationTemplates() {
  console.log('Seeding communication templates...');
  
  // Delete existing built-in templates first
  await prisma.communicationTemplate.deleteMany({
    where: { isBuiltIn: true }
  });
  
  // Create new templates
  for (const template of communicationTemplates) {
    await prisma.communicationTemplate.create({
      data: template,
    });
  }
  
  console.log(`Created ${communicationTemplates.length} communication templates`);
}

// Run this if called directly
if (require.main === module) {
  seedCommunicationTemplates()
    .then(() => {
      console.log('Template seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding templates:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
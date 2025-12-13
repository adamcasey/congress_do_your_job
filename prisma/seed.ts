/**
 * Database Seed Script
 *
 * Populates the database with sample data for development and testing.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.petitionSignature.deleteMany();
  await prisma.petition.deleteMany();
  await prisma.digestEdition.deleteMany();
  await prisma.scorecard.deleteMany();
  await prisma.user.deleteMany();
  await prisma.electedOfficial.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // Seed Elected Officials (Colorado focus)
  console.log('👔 Creating elected officials...');

  // U.S. Senators (Colorado)
  const senator1 = await prisma.electedOfficial.create({
    data: {
      firstName: 'Michael',
      lastName: 'Bennet',
      fullName: 'Michael Bennet',
      office: 'U.S. Senator',
      level: 'federal',
      jurisdiction: 'United States',
      chamber: 'senate',
      party: 'Democratic',
      bioguideId: 'B001267',
      contactEmail: 'senator_bennet@bennet.senate.gov',
      website: 'https://www.bennet.senate.gov',
      socialMedia: {
        twitter: '@SenBennetCO',
        facebook: 'SenatorBennet',
      },
      offices: [
        {
          type: 'capitol',
          address: '261 Russell Senate Office Building',
          city: 'Washington',
          state: 'DC',
          zipCode: '20510',
          phone: '202-224-5852',
        },
      ],
      termStart: new Date('2023-01-03'),
      termEnd: new Date('2029-01-03'),
      isCurrentOfficial: true,
      currentScore: 72.5,
      lastScoreUpdate: new Date(),
    },
  });

  const senator2 = await prisma.electedOfficial.create({
    data: {
      firstName: 'John',
      lastName: 'Hickenlooper',
      fullName: 'John Hickenlooper',
      office: 'U.S. Senator',
      level: 'federal',
      jurisdiction: 'United States',
      chamber: 'senate',
      party: 'Democratic',
      bioguideId: 'H001079',
      contactEmail: 'john_hickenlooper@hickenlooper.senate.gov',
      website: 'https://www.hickenlooper.senate.gov',
      socialMedia: {
        twitter: '@SenatorHick',
        facebook: 'SenatorHickenlooper',
      },
      offices: [
        {
          type: 'capitol',
          address: 'B40C Dirksen Senate Office Building',
          city: 'Washington',
          state: 'DC',
          zipCode: '20510',
          phone: '202-224-5941',
        },
      ],
      termStart: new Date('2023-01-03'),
      termEnd: new Date('2027-01-03'),
      isCurrentOfficial: true,
      currentScore: 68.3,
      lastScoreUpdate: new Date(),
    },
  });

  // U.S. House Representatives (Sample districts)
  const representative1 = await prisma.electedOfficial.create({
    data: {
      firstName: 'Diana',
      lastName: 'DeGette',
      fullName: 'Diana DeGette',
      office: 'U.S. Representative District 1',
      level: 'federal',
      jurisdiction: 'Colorado',
      district: '1',
      chamber: 'house',
      party: 'Democratic',
      bioguideId: 'D000197',
      contactEmail: 'diana.degette@mail.house.gov',
      website: 'https://degette.house.gov',
      offices: [
        {
          type: 'capitol',
          address: '2111 Rayburn House Office Building',
          city: 'Washington',
          state: 'DC',
          zipCode: '20515',
          phone: '202-225-4431',
        },
      ],
      termStart: new Date('2023-01-03'),
      termEnd: new Date('2025-01-03'),
      isCurrentOfficial: true,
      currentScore: 75.8,
      lastScoreUpdate: new Date(),
    },
  });

  const representative2 = await prisma.electedOfficial.create({
    data: {
      firstName: 'Joe',
      lastName: 'Neguse',
      fullName: 'Joe Neguse',
      office: 'U.S. Representative District 2',
      level: 'federal',
      jurisdiction: 'Colorado',
      district: '2',
      chamber: 'house',
      party: 'Democratic',
      bioguideId: 'N000191',
      contactEmail: 'joe.neguse@mail.house.gov',
      website: 'https://neguse.house.gov',
      offices: [
        {
          type: 'capitol',
          address: '1419 Longworth House Office Building',
          city: 'Washington',
          state: 'DC',
          zipCode: '20515',
          phone: '202-225-2161',
        },
      ],
      termStart: new Date('2023-01-03'),
      termEnd: new Date('2025-01-03'),
      isCurrentOfficial: true,
      currentScore: 81.2,
      lastScoreUpdate: new Date(),
    },
  });

  console.log(`✅ Created ${4} federal elected officials\n`);

  // Create scorecards for each official
  console.log('📊 Creating scorecard records...');

  const officials = [senator1, senator2, representative1, representative2];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const official of officials) {
    await prisma.scorecard.create({
      data: {
        officialId: official.id,
        periodType: 'weekly',
        periodStart: oneWeekAgo,
        periodEnd: now,
        totalScore: official.currentScore || 70,
        methodology: 'v1.0',
        components: [
          {
            category: 'bipartisanship',
            score: 75,
            weight: 0.3,
            details: { billsCosponsored: 8, crossPartyCollaboration: 5 },
          },
          {
            category: 'attendance',
            score: 95,
            weight: 0.2,
            details: { votesAttended: 38, votesMissed: 2 },
          },
          {
            category: 'productivity',
            score: 65,
            weight: 0.25,
            details: { billsSponsored: 3, billsAdvanced: 1 },
          },
          {
            category: 'civility',
            score: 80,
            weight: 0.15,
            details: { personalAttacks: 0, constructiveDebates: 4 },
          },
          {
            category: 'transparency',
            score: 70,
            weight: 0.1,
            details: { stockTradesReported: 0, financialDisclosures: 'on-time' },
          },
        ],
      },
    });
  }

  console.log(`✅ Created scorecards for ${officials.length} officials\n`);

  // Create a sample user
  console.log('👤 Creating sample user...');

  const sampleUser = await prisma.user.create({
    data: {
      clerkId: 'user_sample_dev_123',
      email: 'demo@congressdoyourjob.com',
      firstName: 'Demo',
      lastName: 'User',
      address: '1234 Capitol St',
      city: 'Denver',
      state: 'Colorado',
      zipCode: '80202',
      congressionalDistrict: '1',
      membershipTier: 'basic',
      membershipStatus: 'active',
      emailDigest: true,
      emailReminders: true,
      representatives: [
        {
          officialId: senator1.id,
          name: senator1.fullName,
          office: senator1.office,
          level: senator1.level,
          party: senator1.party,
          contactEmail: senator1.contactEmail,
          addedAt: new Date(),
        },
        {
          officialId: senator2.id,
          name: senator2.fullName,
          office: senator2.office,
          level: senator2.level,
          party: senator2.party,
          contactEmail: senator2.contactEmail,
          addedAt: new Date(),
        },
        {
          officialId: representative1.id,
          name: representative1.fullName,
          office: representative1.office,
          level: representative1.level,
          party: representative1.party,
          contactEmail: representative1.contactEmail,
          addedAt: new Date(),
        },
      ],
    },
  });

  console.log(`✅ Created sample user: ${sampleUser.email}\n`);

  // Create sample petitions
  console.log('📝 Creating sample petitions...');

  const petition1 = await prisma.petition.create({
    data: {
      title: 'Pass a Budget on Time',
      slug: 'pass-budget-on-time',
      description:
        'Congress has a legal obligation to pass 12 appropriations bills by October 1st. In the past 25 years, this has only happened 4 times. Demand your representatives do their job and pass a budget on time.',
      category: 'budget',
      letterTemplate: `Dear [REPRESENTATIVE_NAME],

I am writing as your constituent to urge you to pass all appropriations bills by the October 1st deadline.

Continuing resolutions and last-minute omnibus bills are not good governance. They prevent proper oversight, waste taxpayer money, and undermine public trust.

Please work across party lines to fulfill your constitutional duty and pass a budget on time.

Respectfully,
[YOUR_NAME]`,
      targetLevel: 'federal',
      targetOffice: 'all',
      status: 'active',
      goal: 10000,
      signatureCount: 0,
    },
  });

  const petition2 = await prisma.petition.create({
    data: {
      title: 'Stop Trading on Inside Information',
      slug: 'stop-congressional-stock-trading',
      description:
        'Members of Congress have access to non-public information that affects markets. Support legislation that bans individual stock trading by members of Congress and their immediate families.',
      category: 'transparency',
      letterTemplate: `Dear [REPRESENTATIVE_NAME],

I am writing to urge you to support legislation that prohibits members of Congress from trading individual stocks while in office.

The appearance of conflicts of interest undermines public trust in government. Whether or not trading is done with improper intent, it creates the perception of corruption.

Please cosponsor and vote for bills that ban congressional stock trading.

Thank you,
[YOUR_NAME]`,
      targetLevel: 'federal',
      targetOffice: 'all',
      status: 'active',
      goal: 25000,
      signatureCount: 0,
    },
  });

  console.log(`✅ Created ${2} sample petitions\n`);

  console.log('✨ Database seeding complete!\n');
  console.log('📈 Summary:');
  console.log(`   - Elected Officials: ${officials.length}`);
  console.log(`   - Scorecards: ${officials.length}`);
  console.log(`   - Users: 1`);
  console.log(`   - Petitions: 2`);
  console.log('\n🎉 Ready to go! Run `npm run db:studio` to view your data.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

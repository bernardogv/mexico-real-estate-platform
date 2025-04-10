const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create an admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+52 123 456 7890',
        role: 'ADMIN',
        language: 'SPANISH'
      }
    });
    console.log('Admin user created:', admin);

    // Create a regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: userPassword,
        firstName: 'Regular',
        lastName: 'User',
        phone: '+52 098 765 4321',
        role: 'USER',
        language: 'ENGLISH'
      }
    });
    console.log('Regular user created:', user);

    // Create a real estate agent
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agent = await prisma.user.create({
      data: {
        email: 'agent@example.com',
        passwordHash: agentPassword,
        firstName: 'Agent',
        lastName: 'Realtor',
        phone: '+52 555 555 5555',
        role: 'AGENT',
        language: 'SPANISH'
      }
    });
    console.log('Agent user created:', agent);

    // Create a sample property
    const property = await prisma.property.create({
      data: {
        title: 'Casa Moderna en Condesa',
        titleEn: 'Modern House in Condesa',
        description: 'Hermosa casa moderna con jardín en el corazón de la Condesa. Cerca de restaurantes y parques.',
        descriptionEn: 'Beautiful modern house with garden in the heart of Condesa. Close to restaurants and parks.',
        price: 5000000,
        currency: 'MXN',
        type: 'HOUSE',
        status: 'ACTIVE',
        bedrooms: 3,
        bathrooms: 2,
        buildingSize: 180,
        landSize: 250,
        constructionYear: 2018,
        verified: true,
        ownerId: agent.id,
        address: {
          create: {
            street: 'Calle Ozuluama',
            streetNumber: '12',
            neighborhood: 'Condesa',
            postalCode: '06140',
            city: 'Ciudad de México',
            state: 'MEXICO_CITY',
            latitude: 19.4137,
            longitude: -99.1726
          }
        },
        features: {
          create: [
            {
              name: 'Jardín',
              nameEn: 'Garden'
            },
            {
              name: 'Estacionamiento',
              nameEn: 'Parking'
            },
            {
              name: 'Seguridad 24/7',
              nameEn: '24/7 Security'
            }
          ]
        },
        media: {
          create: [
            {
              type: 'IMAGE',
              url: 'https://example.com/house1.jpg',
              isMain: true
            },
            {
              type: 'IMAGE',
              url: 'https://example.com/house2.jpg',
              isMain: false
            },
            {
              type: 'FLOOR_PLAN',
              url: 'https://example.com/floorplan.jpg',
              isMain: false
            }
          ]
        }
      }
    });
    console.log('Sample property created:', property.id);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

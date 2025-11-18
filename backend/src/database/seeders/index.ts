import { AppDataSource } from '../../config/data-source';
import { StylePreset, StyleCategory } from '../../entities/StylePreset.entity';
import { CreditPackage } from '../../entities/CreditPackage.entity';

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('🌱 Starting database seeding...');

    // Seed Style Presets
    const stylePresetRepository = AppDataSource.getRepository(StylePreset);

    const stylePresets = [
      // African Luxury Styles
      {
        slug: 'african-contemporary',
        name: 'African Contemporary',
        category: StyleCategory.AFRICAN,
        description: 'Earth tones, natural materials, geometric patterns',
        keywords: 'African contemporary interior, earth tones, natural materials, geometric patterns, wooden accents, indoor plants, neutral palette, cultural artifacts, woven textiles',
        is_premium: false,
        is_active: true,
        popularity: 95,
      },
      {
        slug: 'afro-minimalist',
        name: 'Afro-Minimalist',
        category: StyleCategory.AFRICAN,
        description: 'Clean lines, African art, neutral colors',
        keywords: 'Afro-minimalist, clean lines, African art, neutral colors, natural textures, minimal furniture, cultural artifacts, understated elegance',
        is_premium: false,
        is_active: true,
        popularity: 88,
      },
      {
        slug: 'nigerian-luxury',
        name: 'Nigerian Luxury',
        category: StyleCategory.LUXURY,
        description: 'Marble floors, chandeliers, rich fabrics, gold accents',
        keywords: 'Nigerian luxury interior, marble floors, chandeliers, rich fabrics, gold accents, plush furniture, opulent, high ceilings, premium finishes',
        is_premium: true,
        is_active: true,
        popularity: 92,
      },
      {
        slug: 'modern-lagos',
        name: 'Modern Lagos',
        category: StyleCategory.MODERN,
        description: 'Bright colors, contemporary furniture, urban style',
        keywords: 'Modern Lagos apartment, bright colors, contemporary furniture, urban style, artistic, vibrant, metropolitan, creative spaces',
        is_premium: false,
        is_active: true,
        popularity: 85,
      },
      {
        slug: 'abuja-elite',
        name: 'Abuja Elite',
        category: StyleCategory.LUXURY,
        description: 'Presidential elegance, sophisticated finishes',
        keywords: 'Abuja luxury home, presidential, elegant, sophisticated, high ceilings, crown molding, premium finishes, executive style',
        is_premium: true,
        is_active: true,
        popularity: 90,
      },

      // International Styles
      {
        slug: 'modern-scandinavian',
        name: 'Modern Scandinavian',
        category: StyleCategory.MODERN,
        description: 'Light colors, functional design, cozy atmosphere',
        keywords: 'Scandinavian interior, light wood, white walls, minimalist, functional, cozy, hygge, natural light',
        is_premium: false,
        is_active: true,
        popularity: 82,
      },
      {
        slug: 'industrial-loft',
        name: 'Industrial Loft',
        category: StyleCategory.MODERN,
        description: 'Exposed brick, metal fixtures, raw materials',
        keywords: 'Industrial loft, exposed brick, metal fixtures, raw materials, open space, urban, contemporary',
        is_premium: false,
        is_active: true,
        popularity: 78,
      },
      {
        slug: 'contemporary-luxury',
        name: 'Contemporary Luxury',
        category: StyleCategory.LUXURY,
        description: 'Sleek lines, premium materials, sophisticated',
        keywords: 'Contemporary luxury, sleek lines, premium materials, sophisticated, modern elegance, designer furniture',
        is_premium: true,
        is_active: true,
        popularity: 87,
      },
      {
        slug: 'boho-chic',
        name: 'Boho Chic',
        category: StyleCategory.ECLECTIC,
        description: 'Eclectic mix, patterns, textures, relaxed vibe',
        keywords: 'Bohemian interior, eclectic, patterns, textures, plants, relaxed, artistic, colorful',
        is_premium: false,
        is_active: true,
        popularity: 75,
      },
      {
        slug: 'mid-century-modern',
        name: 'Mid-Century Modern',
        category: StyleCategory.RETRO,
        description: 'Retro furniture, clean lines, organic shapes',
        keywords: 'Mid-century modern, retro furniture, clean lines, organic shapes, wood tones, vintage',
        is_premium: false,
        is_active: true,
        popularity: 80,
      },
    ];

    for (const preset of stylePresets) {
      const existing = await stylePresetRepository.findOne({ where: { slug: preset.slug } });
      if (!existing) {
        await stylePresetRepository.save(preset);
        console.log(`✅ Created style preset: ${preset.name}`);
      } else {
        console.log(`⏭️  Style preset already exists: ${preset.name}`);
      }
    }

    // Seed Credit Packages
    const creditPackageRepository = AppDataSource.getRepository(CreditPackage);

    const creditPackages = [
      {
        name: 'Starter Pack',
        description: '10 credits for trying out the platform',
        credits_amount: 10,
        price: 1000,
        currency: 'NGN',
        bonus_credits: 0,
        is_active: true,
        sort_order: 1,
      },
      {
        name: 'Popular Pack',
        description: '30 credits with 5 bonus credits',
        credits_amount: 30,
        price: 2500,
        currency: 'NGN',
        bonus_credits: 5,
        is_active: true,
        sort_order: 2,
      },
      {
        name: 'Professional Pack',
        description: '100 credits with 20 bonus credits',
        credits_amount: 100,
        price: 8000,
        currency: 'NGN',
        bonus_credits: 20,
        is_active: true,
        sort_order: 3,
      },
    ];

    for (const pack of creditPackages) {
      const existing = await creditPackageRepository.findOne({ where: { name: pack.name } });
      if (!existing) {
        await creditPackageRepository.save(pack);
        console.log(`✅ Created credit package: ${pack.name}`);
      } else {
        console.log(`⏭️  Credit package already exists: ${pack.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

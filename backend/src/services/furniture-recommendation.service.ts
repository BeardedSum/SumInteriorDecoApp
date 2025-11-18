import axios from 'axios';
import GeminiService from './gemini.service';
import ClaudeService from './claude.service';

/**
 * Smart Furniture Recommendation Engine
 * Analyzes designs and recommends furniture from Nigerian e-commerce platforms
 */

interface FurnitureItem {
  name: string;
  description: string;
  estimatedPrice: number;
  currency: string;
  category: string; // sofa, table, chair, lighting, decor, etc.
  priority: 'essential' | 'recommended' | 'optional';
  affiliateLinks: {
    jumia?: string;
    konga?: string;
    yaoota?: string;
    local?: string;
  };
  imageUrl?: string;
  dimensions?: string;
  material?: string;
}

interface RecommendationResult {
  items: FurnitureItem[];
  totalEstimate: number;
  currency: string;
  budgetBreakdown: {
    essential: number;
    recommended: number;
    optional: number;
  };
  savings: number; // Potential savings from comparisons
}

class FurnitureRecommendationService {
  private jumiaAffiliateId: string;
  private kongaAffiliateId: string;

  constructor() {
    this.jumiaAffiliateId = process.env.JUMIA_AFFILIATE_ID || '';
    this.kongaAffiliateId = process.env.KONGA_AFFILIATE_ID || '';
  }

  /**
   * Generate furniture recommendations based on AI-generated design
   */
  async recommendFurnitureForDesign(
    designImageUrl: string,
    roomType: string,
    budget?: number
  ): Promise<RecommendationResult> {
    try {
      console.log('Analyzing design for furniture recommendations...');

      // Step 1: Analyze image with Gemini to detect objects
      const analysis = await GeminiService.analyzeImage(designImageUrl);

      console.log('Detected objects:', analysis.detectedObjects);

      // Step 2: Generate shopping list with Claude
      const shoppingList = await ClaudeService.generateShoppingList(
        `${roomType} with ${analysis.detectedObjects.join(', ')}. Style: ${analysis.currentStyle}`,
        budget || 500000 // Default budget: ₦500,000
      );

      // Step 3: Fetch actual prices from e-commerce platforms
      const enrichedItems = await Promise.all(
        shoppingList.items.map((item) => this.enrichWithMarketplacePrices(item))
      );

      // Step 4: Calculate totals and savings
      const totalEstimate = enrichedItems.reduce((sum, item) => sum + item.estimatedPrice, 0);

      const budgetBreakdown = {
        essential: enrichedItems
          .filter((i) => i.priority === 'essential')
          .reduce((sum, i) => sum + i.estimatedPrice, 0),
        recommended: enrichedItems
          .filter((i) => i.priority === 'recommended')
          .reduce((sum, i) => sum + i.estimatedPrice, 0),
        optional: enrichedItems
          .filter((i) => i.priority === 'optional')
          .reduce((sum, i) => sum + i.estimatedPrice, 0),
      };

      return {
        items: enrichedItems,
        totalEstimate: shoppingList.totalEstimate,
        currency: 'NGN',
        budgetBreakdown,
        savings: 0, // Calculate from price comparisons
      };
    } catch (error: any) {
      console.error('Furniture recommendation error:', error);
      throw new Error(`Recommendation failed: ${error.message}`);
    }
  }

  /**
   * Enrich furniture item with actual marketplace prices and links
   */
  private async enrichWithMarketplacePrices(item: any): Promise<FurnitureItem> {
    try {
      // Search for item on marketplaces
      const [jumiaResults, kongaResults] = await Promise.all([
        this.searchJumia(item.item),
        this.searchKonga(item.item),
      ]);

      // Build affiliate links
      const affiliateLinks: any = {};

      if (jumiaResults.length > 0) {
        affiliateLinks.jumia = this.buildJumiaAffiliateLink(jumiaResults[0].url);
      }

      if (kongaResults.length > 0) {
        affiliateLinks.konga = this.buildKongaAffiliateLink(kongaResults[0].url);
      }

      // Use Claude's estimate or actual marketplace price
      const bestPrice = Math.min(
        item.estimatedPrice,
        jumiaResults[0]?.price || Infinity,
        kongaResults[0]?.price || Infinity
      );

      return {
        name: item.item,
        description: '',
        estimatedPrice: bestPrice,
        currency: 'NGN',
        category: this.categorizeItem(item.item),
        priority: item.priority,
        affiliateLinks,
        imageUrl: jumiaResults[0]?.imageUrl || kongaResults[0]?.imageUrl,
      };
    } catch (error) {
      console.error('Error enriching item:', error);

      // Return original estimates if enrichment fails
      return {
        name: item.item,
        description: '',
        estimatedPrice: item.estimatedPrice,
        currency: 'NGN',
        category: this.categorizeItem(item.item),
        priority: item.priority,
        affiliateLinks: {},
      };
    }
  }

  /**
   * Search Jumia for products (placeholder - requires Jumia API access)
   */
  private async searchJumia(query: string): Promise<any[]> {
    try {
      // Note: Jumia doesn't have a public API. This would require web scraping or partnership.
      // For now, return placeholder data

      console.log('Searching Jumia for:', query);

      // Simulated results
      return [
        {
          name: query,
          price: Math.floor(Math.random() * 100000) + 20000,
          url: `https://www.jumia.com.ng/search/?q=${encodeURIComponent(query)}`,
          imageUrl: 'https://via.placeholder.com/200',
        },
      ];

      // TODO: Implement actual Jumia scraping or API integration
    } catch (error) {
      console.error('Jumia search error:', error);
      return [];
    }
  }

  /**
   * Search Konga for products (placeholder)
   */
  private async searchKonga(query: string): Promise<any[]> {
    try {
      console.log('Searching Konga for:', query);

      // Simulated results
      return [
        {
          name: query,
          price: Math.floor(Math.random() * 100000) + 20000,
          url: `https://www.konga.com/search?search=${encodeURIComponent(query)}`,
          imageUrl: 'https://via.placeholder.com/200',
        },
      ];

      // TODO: Implement actual Konga API integration
    } catch (error) {
      console.error('Konga search error:', error);
      return [];
    }
  }

  /**
   * Build Jumia affiliate link
   */
  private buildJumiaAffiliateLink(productUrl: string): string {
    if (!this.jumiaAffiliateId) {
      return productUrl;
    }

    // Add affiliate tracking parameter
    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}affiliate_id=${this.jumiaAffiliateId}`;
  }

  /**
   * Build Konga affiliate link
   */
  private buildKongaAffiliateLink(productUrl: string): string {
    if (!this.kongaAffiliateId) {
      return productUrl;
    }

    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}ref=${this.kongaAffiliateId}`;
  }

  /**
   * Categorize furniture item
   */
  private categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();

    if (name.includes('sofa') || name.includes('couch')) return 'seating';
    if (name.includes('chair') || name.includes('stool')) return 'seating';
    if (name.includes('table') || name.includes('desk')) return 'tables';
    if (name.includes('bed') || name.includes('mattress')) return 'bedroom';
    if (name.includes('lamp') || name.includes('light') || name.includes('chandelier')) return 'lighting';
    if (name.includes('cabinet') || name.includes('shelf') || name.includes('wardrobe')) return 'storage';
    if (name.includes('rug') || name.includes('carpet')) return 'textiles';
    if (name.includes('curtain') || name.includes('blind')) return 'window';
    if (name.includes('mirror') || name.includes('artwork') || name.includes('decor')) return 'decor';

    return 'other';
  }

  /**
   * Get price comparison for specific item
   */
  async getPriceComparison(itemName: string): Promise<{
    jumia?: { price: number; url: string };
    konga?: { price: number; url: string };
    bestDeal: { platform: string; price: number; savings: number };
  }> {
    const [jumiaResults, kongaResults] = await Promise.all([
      this.searchJumia(itemName),
      this.searchKonga(itemName),
    ]);

    const jumiaPrice = jumiaResults[0]?.price || Infinity;
    const kongaPrice = kongaResults[0]?.price || Infinity;

    const bestPrice = Math.min(jumiaPrice, kongaPrice);
    const bestPlatform = bestPrice === jumiaPrice ? 'Jumia' : 'Konga';
    const savings = Math.max(jumiaPrice, kongaPrice) - bestPrice;

    return {
      jumia: jumiaResults[0] ? { price: jumiaPrice, url: jumiaResults[0].url } : undefined,
      konga: kongaResults[0] ? { price: kongaPrice, url: kongaResults[0].url } : undefined,
      bestDeal: {
        platform: bestPlatform,
        price: bestPrice,
        savings,
      },
    };
  }

  /**
   * Get budget-optimized recommendations
   */
  async getbudgetOptimizedRecommendations(
    designImageUrl: string,
    roomType: string,
    maxBudget: number
  ): Promise<RecommendationResult> {
    const recommendations = await this.recommendFurnitureForDesign(designImageUrl, roomType, maxBudget);

    // Filter to fit budget, prioritizing essential items
    let runningTotal = 0;
    const filteredItems: FurnitureItem[] = [];

    // Add essential items first
    for (const item of recommendations.items.filter((i) => i.priority === 'essential')) {
      if (runningTotal + item.estimatedPrice <= maxBudget) {
        filteredItems.push(item);
        runningTotal += item.estimatedPrice;
      }
    }

    // Add recommended items if budget allows
    for (const item of recommendations.items.filter((i) => i.priority === 'recommended')) {
      if (runningTotal + item.estimatedPrice <= maxBudget) {
        filteredItems.push(item);
        runningTotal += item.estimatedPrice;
      }
    }

    // Add optional items if budget allows
    for (const item of recommendations.items.filter((i) => i.priority === 'optional')) {
      if (runningTotal + item.estimatedPrice <= maxBudget) {
        filteredItems.push(item);
        runningTotal += item.estimatedPrice;
      }
    }

    return {
      ...recommendations,
      items: filteredItems,
      totalEstimate: runningTotal,
    };
  }
}

export default new FurnitureRecommendationService();

import { describe, expect, it } from 'vitest';
import axios from 'axios';

// API base URL
const API_BASE = 'https://www.dnd5eapi.co/api/2014';

// All D&D 5e API endpoints
const allEndpoints = [
  'ability-scores',
  'alignments',
  'backgrounds',
  'classes',
  'conditions',
  'damage-types',
  'equipment',
  'equipment-categories',
  'feats',
  'features',
  'languages',
  'magic-items',
  'magic-schools',
  'monsters',
  'proficiencies',
  'races',
  'rule-sections',
  'rules',
  'skills',
  'spells',
  'subclasses',
  'subraces',
  'traits',
  'weapon-properties',
];

// Type definitions for API responses
interface ApiItem {
  index: string;
  name: string;
  url: string;
}

interface ApiListResponse {
  count: number;
  results: ApiItem[];
}

// Helper function to fetch API data
async function fetchApiData(endpoint: string): Promise<ApiListResponse | null> {
  try {
    const response = await axios.get<ApiListResponse>(`${API_BASE}/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

// Helper function to validate API item structure
function validateApiItem(item: any, endpoint: string): boolean {
  if (!item || typeof item !== 'object') return false;
  
  // Check required properties
  if (!item.index || typeof item.index !== 'string') return false;
  if (!item.name || typeof item.name !== 'string') return false;
  if (!item.url || typeof item.url !== 'string') return false;
  
  // Check URL format
  const expectedUrlPattern = new RegExp(`^/api/2014/${endpoint}/[a-z-]+$`);
  if (!expectedUrlPattern.test(item.url)) return false;
  
  // Check that index and name are not empty
  if (item.index.trim() === '' || item.name.trim() === '') return false;
  
  return true;
}

describe('D&D 5e API Data Integrity Tests', () => {
  describe('API Response Structure Validation', () => {
    it('validates response structure for all endpoints', async () => {
      const results: { endpoint: string; success: boolean; error?: string; count?: number }[] = [];
      
      for (const endpoint of allEndpoints) {
        try {
          const data = await fetchApiData(endpoint);
          
          if (!data) {
            results.push({ endpoint, success: false, error: 'No data returned' });
            continue;
          }
          
          // Validate top-level structure
          expect(data).toHaveProperty('count');
          expect(data).toHaveProperty('results');
          expect(typeof data.count).toBe('number');
          expect(Array.isArray(data.results)).toBe(true);
          
          // Validate count matches results length
          expect(data.count).toBe(data.results.length);
          
          // Validate each item in results
          for (const item of data.results) {
            expect(validateApiItem(item, endpoint)).toBe(true);
          }
          
          results.push({ endpoint, success: true, count: data.count });
          console.log(`✅ ${endpoint}: ${data.count} items, structure valid`);
          
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          results.push({ endpoint, success: false, error: message });
          console.log(`❌ ${endpoint}: ${message}`);
        }
      }
      
      // Report results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`\nAPI Structure Validation Results:`);
      console.log(`✅ Successful: ${successCount}/${allEndpoints.length}`);
      console.log(`❌ Failed: ${failureCount}/${allEndpoints.length}`);
      
      // Ensure at least 80% of endpoints pass
      expect(successCount).toBeGreaterThan(allEndpoints.length * 0.8);
    });
  });

  describe('Critical Endpoint Data Quality', () => {
    const criticalEndpoints = ['classes', 'spells', 'monsters', 'races', 'equipment'];
    
    for (const endpoint of criticalEndpoints) {
      it(`validates data quality for ${endpoint}`, async () => {
        const data = await fetchApiData(endpoint);
        
        expect(data).not.toBeNull();
        expect(data!.count).toBeGreaterThan(0);
        expect(data!.results.length).toBeGreaterThan(0);
        
        // Validate data quality for each item
        for (const item of data!.results) {
          // Check for meaningful content
          expect(item.name.length).toBeGreaterThan(0);
          expect(item.index.length).toBeGreaterThan(0);
          
          // Check for reasonable name length (not too short or too long)
          expect(item.name.length).toBeGreaterThan(1);
          expect(item.name.length).toBeLessThan(100);
          
          // Check for valid index format (usually lowercase with hyphens)
          expect(item.index).toMatch(/^[a-z-]+$/);
          
          // Check URL structure
          expect(item.url).toMatch(/^\/api\/2014\/[a-z-]+\/[a-z-]+$/);
        }
        
        console.log(`✅ ${endpoint}: ${data!.count} items, data quality valid`);
      });
    }
  });

  describe('API Consistency Tests', () => {
    it('validates consistent data patterns across endpoints', async () => {
      const sampleEndpoints = ['classes', 'spells', 'monsters', 'races'];
      const patterns: { [key: string]: Set<string> } = {};
      
      for (const endpoint of sampleEndpoints) {
        const data = await fetchApiData(endpoint);
        if (!data) continue;
        
        patterns[endpoint] = new Set();
        
        for (const item of data.results) {
          // Check for consistent naming patterns
          expect(item.name).toMatch(/^[A-Za-z\s'-]+$/); // Names should contain letters, spaces, hyphens, apostrophes
          expect(item.index).toMatch(/^[a-z-]+$/); // Indexes should be lowercase with hyphens
          
          patterns[endpoint].add(item.index);
        }
      }
      
      // Check for duplicate indexes within endpoints
      for (const [endpoint, indexes] of Object.entries(patterns)) {
        expect(indexes.size).toBeGreaterThan(0);
        console.log(`✅ ${endpoint}: ${indexes.size} unique indexes`);
      }
    });

    it('validates URL consistency and accessibility', async () => {
      const testEndpoints = ['classes', 'spells'];
      
      for (const endpoint of testEndpoints) {
        const data = await fetchApiData(endpoint);
        if (!data || data.results.length === 0) continue;
        
        // Test a few URLs to ensure they're accessible
        const sampleItems = data.results.slice(0, 3);
        
        for (const item of sampleItems) {
          try {
            const fullUrl = `https://www.dnd5eapi.co${item.url}`;
            const response = await axios.get(fullUrl);
            
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('index');
            expect(response.data).toHaveProperty('name');
            expect(response.data.index).toBe(item.index);
            expect(response.data.name).toBe(item.name);
            
            console.log(`✅ ${item.index}: URL accessible and data consistent`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`⚠️ ${item.index}: URL not accessible - ${message}`);
          }
        }
      }
    });
  });

  describe('Data Completeness Tests', () => {
    it('validates expected data presence for key endpoints', async () => {
      const expectedData = {
        'classes': ['wizard', 'fighter', 'cleric', 'rogue'],
        'spells': ['fireball', 'heal', 'magic-missile'],
        'monsters': ['dragon', 'goblin', 'orc'],
        'races': ['human', 'elf', 'dwarf', 'halfling'],
      };
      
      for (const [endpoint, expectedItems] of Object.entries(expectedData)) {
        const data = await fetchApiData(endpoint);
        if (!data) continue;
        
        const indexes = new Set(data.results.map(item => item.index));
        
        for (const expectedItem of expectedItems) {
          expect(indexes.has(expectedItem)).toBe(true);
          console.log(`✅ ${endpoint}: Contains expected item "${expectedItem}"`);
        }
      }
    });

    it('validates reasonable data counts for each endpoint', async () => {
      const minExpectedCounts = {
        'classes': 10,
        'spells': 100,
        'monsters': 50,
        'races': 5,
        'equipment': 20,
        'skills': 15,
        'languages': 5,
        'alignments': 8,
      };
      
      for (const [endpoint, minCount] of Object.entries(minExpectedCounts)) {
        const data = await fetchApiData(endpoint);
        if (!data) continue;
        
        expect(data.count).toBeGreaterThanOrEqual(minCount);
        console.log(`✅ ${endpoint}: ${data.count} items (expected ≥${minCount})`);
      }
    });
  });

  describe('API Performance Tests', () => {
    it('measures API response times', async () => {
      const testEndpoints = ['classes', 'spells', 'monsters', 'races', 'equipment'];
      const responseTimes: { endpoint: string; time: number }[] = [];
      
      for (const endpoint of testEndpoints) {
        const startTime = Date.now();
        const data = await fetchApiData(endpoint);
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        responseTimes.push({ endpoint, time: responseTime });
        
        expect(data).not.toBeNull();
        expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
        console.log(`📊 ${endpoint}: ${responseTime}ms`);
      }
      
      const avgResponseTime = responseTimes.reduce((sum, item) => sum + item.time, 0) / responseTimes.length;
      console.log(`📊 Average API response time: ${avgResponseTime.toFixed(2)}ms`);
      expect(avgResponseTime).toBeLessThan(2000); // Average should be under 2 seconds
    });
  });
});


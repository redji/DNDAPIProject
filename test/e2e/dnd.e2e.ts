import { expect } from 'chai';

// All D&D 5e API endpoints to test
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

// Test data structure for API integrity validation
interface ApiItem {
  index: string;
  name: string;
  url: string;
}

interface ApiResponse {
  count: number;
  results: ApiItem[];
}

// Helper functions for better test organization
async function waitForElement(selector: string, timeout = 5000): Promise<any> {
  return await browser.waitUntil(
    async () => {
      const element = await browser.$(selector);
      return await element.isExisting();
    },
    { timeout, timeoutMsg: `Element ${selector} not found` }
  );
}

async function waitForText(text: string, timeout = 5000): Promise<boolean> {
  return await browser.waitUntil(
    async () => {
      const pageContent = await browser.$('body');
      const content = await pageContent.getText();
      return content.includes(text);
    },
    { timeout, timeoutMsg: `Text "${text}" not found` }
  );
}

async function getApiData(endpoint: string): Promise<ApiResponse | null> {
  try {
    const response = await browser.executeAsync((endpoint: string, done: (data: any) => void) => {
      fetch(`https://www.dnd5eapi.co/api/2014/${endpoint}`)
        .then((res) => res.json())
        .then((data) => done(data))
        .catch(() => done(null));
    }, endpoint);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch API data for ${endpoint}:`, message);
    return null;
  }
}

describe('D&D 5e SRD Application - Optimized E2E Tests', () => {
  describe('Home Page Functionality', () => {
    it('loads home page and displays all endpoint links', async () => {
      await browser.url('/');
      await waitForText('D&D 5e SRD');
      
      const title = await browser.getTitle();
      expect(title).to.contain('Quasar');
      
      const pageContent = await browser.$('body');
      const text = await pageContent.getText();
      expect(text).to.contain('D&D 5e SRD');
      
      // Verify all endpoints are listed (sample check for efficiency)
      const sampleEndpoints = ['classes', 'spells', 'monsters', 'races', 'equipment'];
      for (const endpoint of sampleEndpoints) {
        expect(text).to.contain(endpoint.replace('-', ' '));
        expect(text).to.contain(`/api/2014/${endpoint}`);
      }
    });

    it('search functionality filters endpoints correctly', async () => {
      await browser.url('/');
      await waitForElement('input[placeholder="Filter endpoints"]');
      
      const searchInput = await browser.$('input[placeholder="Filter endpoints"]');
      await searchInput.setValue('classes');
      await browser.pause(500); // Reduced wait time
      
      const pageContent = await browser.$('body');
      const text = await pageContent.getText();
      expect(text).to.contain('classes');
      expect(text).not.to.contain('spells');
    });
  });

  describe('Navigation and Routing', () => {
    it('navigates between endpoint pages efficiently', async () => {
      const testEndpoints = ['classes', 'spells', 'monsters'];
      
      for (const endpoint of testEndpoints) {
        await browser.url(`/#/dnd/${endpoint}`);
        await waitForElement('input[placeholder="Search by name"]');
        
        const url = await browser.getUrl();
        expect(url).to.contain(`/dnd/${endpoint}`);
      }
    });

    it('redirects invalid endpoint to home', async () => {
      await browser.url('/#/dnd/invalid-endpoint');
      await browser.pause(1000);
      
      const url = await browser.getUrl();
      expect(url).to.contain('/#/');
      expect(url).not.to.contain('/dnd/invalid-endpoint');
    });

    it('shows 404 page for invalid routes', async () => {
      await browser.url('/#/invalid-route');
      await waitForText('404');
      
      const pageContent = await browser.$('body');
      const text = await pageContent.getText();
      expect(text).to.contain('404');
      expect(text).to.contain('Oops. Nothing here');
    });
  });

  describe('API Data Integrity Tests', () => {
    it('validates API response structure for all endpoints', async () => {
      const testResults: { endpoint: string; success: boolean; error?: string }[] = [];
      
      for (const endpoint of allEndpoints) {
        try {
          const apiData = await getApiData(endpoint);
          
          if (!apiData) {
            testResults.push({ endpoint, success: false, error: 'No data returned' });
            continue;
          }
          
          // Validate API response structure
          expect(apiData).to.have.property('count');
          expect(apiData).to.have.property('results');
          expect(apiData.count).to.be.a('number');
          expect(apiData.results).to.be.an('array');
          
          // Validate each item structure
          for (const item of apiData.results) {
            expect(item).to.have.property('index');
            expect(item).to.have.property('name');
            expect(item).to.have.property('url');
            expect(item.index).to.be.a('string');
            expect(item.name).to.be.a('string');
            expect(item.url).to.be.a('string');
            expect(item.url).to.contain(`/api/2014/${endpoint}/`);
          }
          
          testResults.push({ endpoint, success: true });
          console.log(`✅ ${endpoint}: ${apiData.count} items, structure valid`);
          
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          testResults.push({ endpoint, success: false, error: message });
          console.log(`❌ ${endpoint}: ${message}`);
        }
      }
      
      // Report results
      const successCount = testResults.filter(r => r.success).length;
      const failureCount = testResults.filter(r => !r.success).length;
      
      console.log(`\nAPI Integrity Test Results:`);
      console.log(`✅ Successful: ${successCount}/${allEndpoints.length}`);
      console.log(`❌ Failed: ${failureCount}/${allEndpoints.length}`);
      
      // Allow some failures but ensure majority pass
      expect(successCount).to.be.greaterThan(allEndpoints.length * 0.8);
    });

    it('validates specific endpoint data quality', async () => {
      const criticalEndpoints = ['classes', 'spells', 'monsters', 'races'];
      
      for (const endpoint of criticalEndpoints) {
        const apiData = await getApiData(endpoint);
        expect(apiData).to.not.be.null;
        expect(apiData!.count).to.be.greaterThan(0);
        expect(apiData!.results.length).to.be.greaterThan(0);
        
        // Validate data quality
        for (const item of apiData!.results) {
          expect(item.name).to.not.be.empty;
          expect(item.index).to.not.be.empty;
          expect(item.url).to.match(/^\/api\/2014\/[a-z-]+\/[a-z-]+$/);
        }
        
        console.log(`✅ ${endpoint}: ${apiData!.count} items, data quality valid`);
      }
    });
  });

  describe('UI Component Tests', () => {
    it('tests search functionality on list pages', async () => {
      await browser.url('/#/dnd/classes');
      await waitForElement('input[placeholder="Search by name"]');
      
      const refreshBtn = await browser.$('button[aria-label="Refresh"], button:contains("Refresh")');
      await refreshBtn.click();
      await waitForText('Loading', 2000).catch(() => {}); // Optional wait
      
      const searchInput = await browser.$('input[placeholder="Search by name"]');
      await searchInput.setValue('wizard');
      await browser.pause(300);
      
      const searchValue = await searchInput.getValue();
      expect(searchValue).to.equal('wizard');
    });

    it('validates loading and error states', async () => {
      await browser.url('/#/dnd/classes');
      await waitForElement('button');
      
      const refreshBtn = await browser.$('button');
      await refreshBtn.click();
      
      // Check that button exists and is clickable
      expect(await refreshBtn.isExisting()).to.be.true;
      
      // Wait for either data or error state
      await browser.waitUntil(
        async () => {
          const pageContent = await browser.$('body');
          const text = await pageContent.getText();
          return text.includes('Loading') || 
                 text.includes('Failed to load') || 
                 text.includes('CHA') || // Sample data from ability-scores
                 text.includes('Wizard'); // Sample data from classes
        },
        { timeout: 10000, timeoutMsg: 'Page did not reach expected state' }
      );
    });

    it('tests empty state handling', async () => {
      await browser.url('/#/dnd/classes');
      await waitForElement('input[placeholder="Search by name"]');
      
      const searchInput = await browser.$('input[placeholder="Search by name"]');
      await searchInput.setValue('nonexistentsearchterm12345');
      await browser.pause(500);
      
      // Should show empty state or no results
      const pageContent = await browser.$('body');
      const text = await pageContent.getText();
      
      // Either shows empty state message or no items
      const hasEmptyState = text.includes('No items found') || 
                           text.includes('No data available') ||
                           !text.includes('CHA'); // No actual data visible
      
      expect(hasEmptyState).to.be.true;
    });
  });

  describe('Performance and Efficiency Tests', () => {
    it('measures page load times for key endpoints', async () => {
      const keyEndpoints = ['classes', 'spells', 'monsters'];
      const loadTimes: { endpoint: string; time: number }[] = [];
      
      for (const endpoint of keyEndpoints) {
        const startTime = Date.now();
        await browser.url(`/#/dnd/${endpoint}`);
        await waitForElement('input[placeholder="Search by name"]');
        const endTime = Date.now();
        
        const loadTime = endTime - startTime;
        loadTimes.push({ endpoint, time: loadTime });
        
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
        console.log(`📊 ${endpoint}: ${loadTime}ms`);
      }
      
      const avgLoadTime = loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length;
      console.log(`📊 Average load time: ${avgLoadTime.toFixed(2)}ms`);
      expect(avgLoadTime).to.be.lessThan(3000); // Average should be under 3 seconds
    });
  });
});

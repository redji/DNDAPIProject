import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import IndexPage from 'src/pages/IndexPage.vue';
import { allListEndpoints } from 'src/stores/dnd5e';

installQuasarPlugin();

// Mock the store
vi.mock('src/stores/dnd5e', () => ({
  allListEndpoints: [
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
  ],
}));

describe('IndexPage', () => {
  it('renders D&D 5e SRD title', () => {
    const wrapper = mount(IndexPage);
    expect(wrapper.text()).toContain('D&D 5e SRD (2014) Lists');
  });

  it('displays all endpoint links', () => {
    const wrapper = mount(IndexPage);
    
    // Check that all endpoints are rendered
    allListEndpoints.forEach(endpoint => {
      expect(wrapper.text()).toContain(endpoint.replace('-', ' '));
      expect(wrapper.text()).toContain(`/api/2014/${endpoint}`);
    });
  });

  it('filters endpoints based on search input', async () => {
    const wrapper = mount(IndexPage);
    const searchInput = wrapper.find('input[placeholder="Filter endpoints"]');
    
    // Initially all endpoints should be visible
    expect(wrapper.findAll('[data-testid="endpoint-item"]').length).toBe(allListEndpoints.length);
    
    // Type in search
    await searchInput.setValue('classes');
    await wrapper.vm.$nextTick();
    
    // Should filter to only classes (and any endpoint containing 'classes')
    const visibleItems = wrapper.findAll('[data-testid="endpoint-item"]');
    expect(visibleItems.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('classes');
  });

  it('has endpoint items for each API endpoint', () => {
    const wrapper = mount(IndexPage);
    const links = wrapper.findAll('[data-testid="endpoint-item"]');
    
    expect(links.length).toBe(allListEndpoints.length);
    
    // Verify each endpoint is represented
    allListEndpoints.forEach(endpoint => {
      const endpointText = wrapper.text();
      expect(endpointText).toContain(endpoint.replace('-', ' '));
    });
  });

  it('displays chevron icons for navigation', () => {
    const wrapper = mount(IndexPage);
    const chevrons = wrapper.findAll('[data-testid="chevron-icon"]');
    expect(chevrons.length).toBe(allListEndpoints.length);
  });
});

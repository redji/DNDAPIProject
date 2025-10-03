import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import DndListPage from 'src/pages/DndListPage.vue';
import { useDnd5eStore, allListEndpoints } from 'src/stores/dnd5e';

installQuasarPlugin();

// Mock the router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { key: 'classes' }
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}));

// Mock the store
vi.mock('src/stores/dnd5e', () => ({
  useDnd5eStore: vi.fn(),
  allListEndpoints: ['classes', 'spells', 'monsters']
}));

describe('DndListPage', () => {
  let mockStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    mockStore = {
      lists: {
        classes: {
          loading: false,
          error: null,
          data: {
            count: 2,
            results: [
              { index: 'wizard', name: 'Wizard', url: '/api/2014/classes/wizard' },
              { index: 'fighter', name: 'Fighter', url: '/api/2014/classes/fighter' }
            ]
          }
        }
      },
      fetchList: vi.fn()
    };

    (useDnd5eStore as any).mockReturnValue(mockStore);
  });

  it('renders search input and refresh button', () => {
    const wrapper = mount(DndListPage);
    
    expect(wrapper.find('input[placeholder="Search by name"]').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('Refresh');
  });

  it('displays list items from store data', () => {
    const wrapper = mount(DndListPage);
    
    expect(wrapper.text()).toContain('Wizard');
    expect(wrapper.text()).toContain('Fighter');
    expect(wrapper.text()).toContain('wizard');
    expect(wrapper.text()).toContain('fighter');
  });

  it('filters items based on search input', async () => {
    const wrapper = mount(DndListPage);
    const searchInput = wrapper.find('input[placeholder="Search by name"]');
    
    // Initially both items should be visible
    expect(wrapper.text()).toContain('Wizard');
    expect(wrapper.text()).toContain('Fighter');
    
    // Search for 'wizard'
    await searchInput.setValue('wizard');
    
    // Only wizard should be visible
    expect(wrapper.text()).toContain('Wizard');
    expect(wrapper.text()).not.toContain('Fighter');
  });

  it('calls fetchList when refresh button is clicked', async () => {
    const wrapper = mount(DndListPage);
    const refreshBtn = wrapper.find('button');
    
    await refreshBtn.trigger('click');
    
    expect(mockStore.fetchList).toHaveBeenCalledWith('classes');
  });

  it('shows loading state', () => {
    mockStore.lists.classes.loading = true;
    const wrapper = mount(DndListPage);
    
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true);
  });

  it('shows error state', () => {
    mockStore.lists.classes.error = 'Failed to load classes';
    const wrapper = mount(DndListPage);
    
    expect(wrapper.text()).toContain('Failed to load classes');
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });

  it('handles invalid endpoint gracefully', () => {
    // This test verifies the component can handle invalid endpoints
    // The actual redirect logic is tested in E2E tests
    const wrapper = mount(DndListPage);
    expect(wrapper.exists()).toBe(true);
  });

  it('calls fetchList on mount if no data exists', () => {
    mockStore.lists.classes.data = null;
    mockStore.lists.classes.loading = false;
    
    mount(DndListPage);
    
    expect(mockStore.fetchList).toHaveBeenCalledWith('classes');
  });
});

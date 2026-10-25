import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { validateWell } from '../../../shared/utils/validate-well';
import DoDont from './DoDont.vue';
import WellPreview from './WellPreview.vue';

const renderer = vi.hoisted(() => ({ WellRenderer: vi.fn() }));
vi.mock('@welldot/render', () => ({
  WellRenderer: renderer.WellRenderer,
  INTERACTIVE_RENDER_CONFIG: {},
  applyRenderLocale: (config: object, locale: string) => ({
    ...config,
    locale,
  }),
}));

// Nuxt UI components are auto-imported in the app; here they render their slots only
const passthrough = (name: string) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup:
      (_, { slots }) =>
      () =>
        h('div', { 'data-stub': name }, [
          slots.header?.(),
          slots.default?.(),
          slots.content?.(),
          slots.description?.(),
        ]),
  });

const stubs = {
  UIcon: defineComponent({
    props: { name: String },
    setup: props => () => h('span', { 'data-icon': props.name }),
  }),
  UCard: passthrough('UCard'),
  UCollapsible: passthrough('UCollapsible'),
  UButton: passthrough('UButton'),
  USkeleton: passthrough('USkeleton'),
  UAlert: defineComponent({
    props: { title: String, description: String },
    setup:
      (props, { slots }) =>
      () =>
        h('div', { 'data-stub': 'UAlert' }, [
          props.title,
          slots.description?.() ?? props.description,
        ]),
  }),
  ProsePre: passthrough('ProsePre'),
};

describe('DoDont', () => {
  it('renders both slots under "Do" and "Don\'t" with a check and a cross', () => {
    const wrapper = mount(DoDont, {
      global: { stubs },
      slots: {
        do: () => h('p', 'Use metres for depth.'),
        dont: () => h('p', 'Mix feet and metres.'),
      },
    });

    const columns = wrapper.findAll('[data-do-dont]');
    expect(columns).toHaveLength(2);

    const [doCol, dontCol] = columns;
    expect(doCol!.text()).toContain('Do');
    expect(doCol!.text()).toContain('Use metres for depth.');
    expect(doCol!.find('[data-icon="i-lucide-check"]').exists()).toBe(true);

    expect(dontCol!.text()).toContain("Don't");
    expect(dontCol!.text()).toContain('Mix feet and metres.');
    expect(dontCol!.find('[data-icon="i-lucide-x"]').exists()).toBe(true);
  });
});

describe('WellPreview', () => {
  beforeEach(() => {
    renderer.WellRenderer.mockClear();
  });

  it('lists the validation errors of an invalid snippet and does not render', async () => {
    const source = JSON.stringify({
      version: '2.0',
      name: 'Partial',
      bore_hole: [{ from: 0, to: 'deep', diameter: 10 }],
    });
    const result = validateWell(source);
    expect(result.valid).toBe(false);
    if (result.valid) return;

    // The slot holds the fence as MDC renders it: a ProsePre whose <pre> holds the code text
    const Fence = defineComponent({
      props: { code: String, language: String },
      setup: props => () => h('div', [h('pre', props.code)]),
    });
    const wrapper = mount(WellPreview, {
      global: { stubs },
      slots: { default: () => h(Fence, { code: source, language: 'well' }) },
    });
    await flushPromises();

    const errors = wrapper.find('[data-well-errors]');
    expect(errors.exists()).toBe(true);
    for (const error of result.errors) {
      expect(errors.text()).toContain(error.path || '(root)');
      expect(errors.text()).toContain(error.message);
    }
    expect(renderer.WellRenderer).not.toHaveBeenCalled();
  });

  it('shows an "Unknown example" message for an unknown example id', async () => {
    const wrapper = mount(WellPreview, {
      global: { stubs },
      props: { example: 'does-not-exist' },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Unknown example');
    expect(wrapper.text()).toContain('does-not-exist');
    expect(renderer.WellRenderer).not.toHaveBeenCalled();
  });

  it('shows the renderer error instead of crashing when drawing fails', async () => {
    renderer.WellRenderer.mockImplementationOnce(function () {
      throw new Error('boom in prepareSvg');
    });
    const wrapper = mount(WellPreview, {
      global: { stubs },
      props: { example: 'irece-ba-carste-bambui' },
      attachTo: document.body,
    });
    // The example file and @welldot/render are both loaded with dynamic imports
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('The profile could not be drawn'),
    );

    expect(renderer.WellRenderer).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-well-errors]').exists()).toBe(false);
    expect(wrapper.text()).toContain('The profile could not be drawn');
    expect(wrapper.text()).toContain('boom in prepareSvg');
    wrapper.unmount();
  });

  // A WellRenderer stand-in whose draw() runs `onDraw` with the constructor options
  type Options = { onError?: (_error: Error) => void; locale?: string };
  function fakeRenderer(onDraw: (_options: Options, _call: number) => void) {
    let calls = 0;
    return function (
      this: Record<string, unknown>,
      _svgs: unknown,
      options: Options,
    ) {
      const call = ++calls;
      this.prepareSvg = async () => {};
      this.draw = () => onDraw(options, call);
    };
  }

  it('shows an error that draw() reports through onError, and draws in English', async () => {
    renderer.WellRenderer.mockImplementation(
      fakeRenderer(options => options.onError?.(new Error('lithology failed'))),
    );
    const wrapper = mount(WellPreview, {
      global: { stubs },
      props: { example: 'irece-ba-carste-bambui' },
      attachTo: document.body,
    });
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('The profile could not be drawn'),
    );

    expect(wrapper.text()).toContain('lithology failed');
    expect(renderer.WellRenderer.mock.calls[0]![1]).toMatchObject({
      locale: 'en',
      renderConfig: { locale: 'en' }, // labels resolved with applyRenderLocale
    });
    wrapper.unmount();
    renderer.WellRenderer.mockReset();
  });

  it('clears the renderer error after a later successful redraw', async () => {
    renderer.WellRenderer.mockImplementation(
      fakeRenderer((options, call) => {
        if (call === 1) options.onError?.(new Error('first draw failed'));
      }),
    );
    const wrapper = mount(WellPreview, {
      global: { stubs },
      props: { example: 'irece-ba-carste-bambui' },
      attachTo: document.body,
    });
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('first draw failed'),
    );

    // A theme change redraws the profile
    document.documentElement.classList.add('dark-mode');
    try {
      await vi.waitFor(() => {
        expect(renderer.WellRenderer).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).not.toContain('could not be drawn');
      });
    } finally {
      document.documentElement.classList.remove('dark-mode');
      wrapper.unmount();
      renderer.WellRenderer.mockReset();
    }
  });
});

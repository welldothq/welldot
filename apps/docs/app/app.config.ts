// Welldot look for the Nuxt UI shell: glass header, mono uppercase labels, compact density.
// Classes merge into Nuxt UI's defaults (tailwind-merge), so only the differences are listed.
const label = 'font-mono text-[11px] font-medium uppercase tracking-wider';
// Shared by every callout color. The border reset lives here, not in the `base` slot, because
// Nuxt UI's color variants add `border` after the slot classes and would win the merge.
const calloutVariant =
  'border-0 border-s-2 text-default dark:text-default [&_code]:text-highlighted dark:[&_code]:text-highlighted';

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      success: 'success',
      info: 'info',
      warning: 'warning',
      error: 'error',
      neutral: 'surface',
    },
    header: {
      slots: {
        root: 'bg-default/80 backdrop-blur-md backdrop-saturate-150',
        title: 'items-center gap-2 text-base tracking-tight',
        body: 'p-4 sm:p-6',
      },
    },
    // Landing (content/en/index.md): welldot.org's serif display type and mono kickers
    pageHero: {
      slots: {
        container: 'py-12 sm:py-16 lg:py-20 gap-10 lg:gap-14',
        headline: 'mb-5',
        title:
          'font-serif font-medium text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-balance [&>p]:my-0 [&>p]:leading-[inherit]',
        description:
          'text-base sm:text-lg/7 text-muted max-w-xl [&>p]:my-0 [&>p]:leading-[inherit]',
        links: 'mt-8 [&>p]:flex [&>p]:flex-wrap [&>p]:gap-3 [&>p]:my-0',
      },
    },
    pageSection: {
      slots: {
        container: 'py-14 sm:py-20 lg:py-20 gap-8 sm:gap-10',
        headline: `${label} text-primary mb-3`,
        title:
          'font-serif font-medium text-3xl sm:text-4xl tracking-tight text-balance',
        links: '[&>p]:flex [&>p]:flex-wrap [&>p]:gap-3 [&>p]:my-0',
        description:
          'text-base sm:text-lg/7 text-muted [&>p]:my-0 [&>p]:leading-[inherit]',
      },
    },
    pageCard: {
      slots: {
        title: 'font-serif text-lg font-medium tracking-tight',
        description: 'text-sm/6 [&>p]:my-0 [&>p]:leading-[inherit]',
      },
    },
    pageAside: {
      slots: { root: 'lg:pe-4' },
    },
    pageHeader: {
      slots: {
        root: 'py-6 sm:py-8',
        headline: `${label} mb-3`,
        title: 'text-2xl sm:text-3xl tracking-tight text-balance',
        description: 'text-base',
      },
    },
    contentNavigation: {
      slots: {
        // The trigger also gets the `link` classes (not merged), hence the forced size
        trigger: 'font-mono text-xs! uppercase tracking-wider',
        link: 'text-[13px] py-1',
        listWithChildren: 'ms-2.5',
      },
    },
    contentToc: {
      slots: {
        trigger: `${label} text-dimmed`,
        link: 'text-[13px]',
      },
    },
    contentSurround: {
      slots: {
        root: 'gap-4',
        link: 'px-5 py-5 rounded-lg hover:border-primary/40',
        linkLeading: 'p-1 mb-3 rounded-md',
        linkLeadingIcon: 'size-4',
        linkTitle: 'text-sm',
      },
    },
    prose: {
      // Long field paths (`permits[].conditions[].category`) must wrap at 375 px
      code: { base: 'max-w-full wrap-anywhere' },
      // Callouts (::note, ::tip, ::warning, ::caution) as on welldot.org: a colored rule on the
      // start edge, a faint tint and body text in the normal text color. Nuxt UI tints the text
      // and sets a `dark:` text color, so both are reset (not a design divergence).
      callout: {
        slots: {
          base: 'rounded-md rounded-s-none py-3 ps-4 pe-4 text-sm/6',
          icon: 'size-4 me-2',
        },
        variants: {
          // Literal class strings: Tailwind only generates classes it finds in the source
          color: {
            primary: { base: `border-primary bg-primary/6 ${calloutVariant}` },
            success: { base: `border-success bg-success/6 ${calloutVariant}` },
            info: { base: `border-info bg-info/6 ${calloutVariant}` },
            warning: { base: `border-warning bg-warning/6 ${calloutVariant}` },
            error: { base: `border-error bg-error/6 ${calloutVariant}` },
          },
        },
      },
      pre: {
        slots: {
          root: 'my-6',
          header: 'border-default bg-muted rounded-t-lg px-3 py-2',
          filename: 'font-mono text-xs text-muted',
          base: 'text-[13px]/6 border-default bg-muted rounded-lg',
        },
      },
      codeGroup: {
        slots: {
          root: 'my-6',
          list: 'border-default bg-muted rounded-t-lg gap-0.5 p-1',
          indicator:
            'inset-y-1 bg-default rounded-md shadow-none ring ring-default',
          trigger:
            'font-mono text-xs text-muted data-[state=active]:text-highlighted px-2.5 py-1 hover:bg-transparent hover:text-highlighted',
        },
      },
    },
  },
});

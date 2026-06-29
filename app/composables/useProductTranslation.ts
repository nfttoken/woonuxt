import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import type { AiCommerceProductLike } from '../utils/aiCommerce';
import { localizeProduct } from '../utils/aiCommerce';

export function useProductTranslation(product: MaybeRefOrGetter<AiCommerceProductLike | null | undefined>) {
  const { locale } = useI18n();

  return computed(() => {
    const resolved = toValue(product);

    if (!resolved) {
      return {
        locale: 'en',
        dir: 'ltr' as const,
        title: '',
        description: '',
        seo: {
          title: '',
          description: '',
          slug: null,
          keywords: [],
        },
        translations: {},
        metrics: {},
      };
    }

    return localizeProduct(resolved, locale.value);
  });
}

export type AiCommerceTranslation = {
  title?: string | null;
  description?: string | null;
  features?: string[];
  faq?: Array<Record<string, string>>;
};

export type AiCommerceSeo = {
  seo_title?: string | null;
  seo_description?: string | null;
  slug?: string | null;
  keywords?: string[];
};

export type AiCommerceMetaEnvelope = {
  translations: Record<string, AiCommerceTranslation>;
  seo: Record<string, AiCommerceSeo>;
  metrics: Record<string, unknown>;
};

export type AiCommerceMetaEntry = {
  key?: string | null;
  value?: unknown;
};

export type AiCommerceProductLike = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  metaData?: AiCommerceMetaEntry[] | null;
};

export type LocalizedProductPayload = {
  slug: string;
  sku: string;
  productType: string;
  price?: string | null;
  regularPrice?: string | null;
  stockQuantity?: number | null;
  locale: string;
  dir: 'ltr' | 'rtl';
  title: string;
  description: string;
  seo: {
    title: string;
    description: string;
    slug?: string | null;
    keywords: string[];
  };
  translations: Record<string, AiCommerceTranslation>;
  metrics: Record<string, unknown>;
};

const LOCALE_ALIASES: Record<string, string> = {
  ar: 'ar',
  ar_ae: 'ar',
  ar_sa: 'ar',
  en: 'en',
  en_gb: 'en',
  en_us: 'en',
  es: 'es',
  es_es: 'es',
  zh: 'zh',
  zh_cn: 'zh',
  zh_hans: 'zh',
  zh_hant: 'zh',
  zh_tw: 'zh',
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return {};
    }
  }

  return value;
}

export function normalizeLocaleCode(localeInput?: string | null): string {
  const raw = (localeInput || 'en').split(',')[0]?.trim().replace(/-/g, '_').toLowerCase() || 'en';
  return LOCALE_ALIASES[raw] || LOCALE_ALIASES[raw.split('_')[0] || ''] || 'en';
}

export function extractAiCommerceMeta(product?: AiCommerceProductLike | null): AiCommerceMetaEnvelope {
  const metaEntries = Array.isArray(product?.metaData) ? product.metaData : [];

  const readMeta = (metaKey: string): Record<string, unknown> => {
    const entry = metaEntries.find((item) => item?.key === metaKey);
    return asRecord(parseMaybeJson(entry?.value));
  };

  return {
    translations: readMeta('_translations') as Record<string, AiCommerceTranslation>,
    seo: readMeta('_seo') as Record<string, AiCommerceSeo>,
    metrics: readMeta('_metrics'),
  };
}

export function localizeProduct(product: AiCommerceProductLike, localeInput?: string | null): LocalizedProductPayload {
  const locale = normalizeLocaleCode(localeInput);
  const meta = extractAiCommerceMeta(product);
  const fallbackTranslation = meta.translations.en || {};
  const fallbackSeo = meta.seo.en || {};
  const translation = meta.translations[locale] || fallbackTranslation;
  const seo = meta.seo[locale] || fallbackSeo;
  const fallbackDescription = product.shortDescription || product.description || '';

  return {
    slug: product.slug || '',
    sku: '',
    productType: '',
    locale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    title: translation.title || product.name || '',
    description: translation.description || fallbackDescription,
    seo: {
      title: seo.seo_title || translation.title || product.name || '',
      description: seo.seo_description || translation.description || fallbackDescription,
      slug: seo.slug || product.slug || null,
      keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
    },
    translations: meta.translations,
    metrics: meta.metrics,
  };
}

import { defineEventHandler, getHeader, getQuery, getRouterParam, createError } from 'h3';
import type { LocalizedProductPayload } from '../../../app/utils/aiCommerce';
import { localizeProduct } from '../../../app/utils/aiCommerce';

const PRODUCT_QUERY = `
  query ProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      __typename
      ... on SimpleProduct {
        slug
        sku
        price
        regularPrice
        stockQuantity
        name
        description
        shortDescription
        aiCommerceMeta {
          translations
          seo
          metrics
        }
        metaData {
          key
          value
        }
      }
    }
  }
`;

type GraphqlProductResponse = {
  __typename?: string;
  slug?: string | null;
  sku?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  stockQuantity?: number | null;
  name?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  metaData?: Array<{ key?: string | null; value?: unknown }> | null;
};

type GraphqlEnvelope = {
  data?: {
    product?: GraphqlProductResponse | null;
  };
  errors?: Array<{ message?: string }>;
};

export default defineEventHandler(async (event): Promise<LocalizedProductPayload> => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing product slug.',
    });
  }

  const localeInput =
    (getQuery(event).locale as string | undefined) ||
    getHeader(event, 'x-locale') ||
    getHeader(event, 'accept-language') ||
    'en';

  const config = useRuntimeConfig(event);
  const gqlConfig = config.public?.['graphql-client']?.clients?.default;
  const gqlHost = gqlConfig?.host || process.env.GQL_HOST;

  if (!gqlHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing GraphQL host configuration.',
    });
  }

  const response = await $fetch<GraphqlEnvelope>(gqlHost, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(gqlConfig?.headers?.Origin ? { Origin: gqlConfig.headers.Origin } : {}),
    },
    body: {
      query: PRODUCT_QUERY,
      variables: { slug },
    },
  });

  if (response.errors?.length) {
    throw createError({
      statusCode: 502,
      statusMessage: response.errors[0]?.message || 'GraphQL query failed.',
    });
  }

  const product = response.data?.product;

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: `Product "${slug}" not found.`,
    });
  }

  const localized = localizeProduct(
    {
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      metaData: product.metaData,
    },
    localeInput,
  );

  return {
    ...localized,
    slug: product.slug || slug,
    sku: product.sku || '',
    productType: product.__typename || 'SimpleProduct',
    price: product.price,
    regularPrice: product.regularPrice,
    stockQuantity: product.stockQuantity,
  };
});

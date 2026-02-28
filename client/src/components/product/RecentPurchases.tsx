import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFilteredProducts } from '../../hooks/useProducts';
import { generateFakePurchases } from '../../utils/socialProofData';
import { convertImageUrl } from '../../utils/imageUtils';

/** Resolve the primary image URL for a product object */
const getProductImageUrl = (product: any): string => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img: any) => img.isPrimary) || product.images[0];
    if (primary?.url) return convertImageUrl(primary.url, 'medium');
  }
  return '/api/placeholder/200/200';
};

/** Card width in pixels (fixed) so we can calculate animation distance */
const CARD_WIDTH = 370;
const CARD_GAP = 16;
const SCROLL_SPEED = 70; // px per second

/** Total cards per batch — with-replacement so repeats are natural */
const POOL_SIZE = 18;

/** Re-randomize every 40 s so the carousel feels like a live feed */
const REFRESH_MS = 40_000;

/**
 * Build a weighted pool where newer products appear more often,
 * and products matching the current product type get a 50% boost.
 *
 * Recency tiers (by createdAt rank, newest first):
 *   Top 25%  → weight 4  (very likely)
 *   Next 25% → weight 2  (somewhat likely)
 *   Bottom 50% → weight 1 (baseline)
 *
 * Product-type affinity:
 *   Same productType as the one being viewed → 1.5× multiplier
 *
 * Then pick POOL_SIZE items with replacement from the weighted pool.
 */
const buildEntries = (products: any[], currentProductTypeId?: string) => {
  if (products.length === 0) return [];

  // Sort newest first; fall back to _id order if no createdAt
  const sorted = [...products].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  // Build weighted pool
  const n = sorted.length;
  const weightedPool: any[] = [];
  sorted.forEach((p, i) => {
    const ratio = i / n;
    let weight = ratio < 0.25 ? 4 : ratio < 0.5 ? 2 : 1;

    // 50% boost for products sharing the same product type
    if (currentProductTypeId && p.productType) {
      const pTypeId = typeof p.productType === 'string' ? p.productType : p.productType._id;
      if (pTypeId === currentProductTypeId) {
        weight = Math.ceil(weight * 1.5);
      }
    }

    for (let w = 0; w < weight; w++) weightedPool.push(p);
  });

  const fakeBuyers = generateFakePurchases(POOL_SIZE);
  return fakeBuyers.map((buyer) => ({
    product: weightedPool[Math.floor(Math.random() * weightedPool.length)],
    ...buyer,
  }));
};

/** Fetch the 50 newest products so the carousel has fresh items to pick from */
const CAROUSEL_FILTERS = { sortBy: 'newest' as const, sortOrder: 'desc' as const, limit: 50 };

interface RecentPurchasesProps {
  currentProductTypeId?: string;
}

const RecentPurchases: React.FC<RecentPurchasesProps> = ({ currentProductTypeId }) => {
  const { data: rawResponse } = useFilteredProducts(CAROUSEL_FILTERS);
  // useFilteredProducts may return { products: [...] } or a plain array
  const productsData = Array.isArray(rawResponse)
    ? rawResponse
    : (rawResponse as any)?.products ?? rawResponse;
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const [entries, setEntries] = useState<ReturnType<typeof buildEntries>>([]);

  useEffect(() => {
    const products: any[] = productsData ?? [];
    if (products.length === 0) return;

    setEntries(buildEntries(products, currentProductTypeId));

    const timer = setInterval(() => {
      setEntries(buildEntries(products, currentProductTypeId));
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [productsData, currentProductTypeId]);

  // Duplicate entries for seamless infinite loop
  const loopedEntries = [...entries, ...entries];

  // Calculate animation duration based on content width
  const totalWidth = entries.length * (CARD_WIDTH + CARD_GAP);
  const duration = totalWidth / SCROLL_SPEED;

  if (entries.length === 0) return null;

  return (
    <section className="mt-14 mb-6">
      {/* Heading */}
      <h2
        className="text-2xl md:text-3xl font-semibold text-center mb-8 tracking-wide uppercase"
        style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading, inherit)' }}
      >
        Recent Purchases
      </h2>

      {/* Marquee wrapper */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex"
          style={{
            gap: `${CARD_GAP}px`,
            animation: `recentPurchasesScroll ${duration}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {loopedEntries.map((entry, idx) => (
            <PurchaseCard
              key={`${entry.product._id}-${idx}`}
              product={entry.product}
              buyerName={entry.buyerName}
              city={entry.city}
              timeAgoLabel={entry.timeAgoLabel}
            />
          ))}
        </div>
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes recentPurchasesScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${totalWidth}px); }
        }
      `}</style>
    </section>
  );
};

/* ────────────────────────────── Card ────────────────────────────── */

interface PurchaseCardProps {
  product: any;
  buyerName: string;
  city: string;
  timeAgoLabel: string;
}

const PurchaseCard: React.FC<PurchaseCardProps> = React.memo(
  ({ product, buyerName, city, timeAgoLabel }) => {
    const slug = product._id;
    const imageUrl = getProductImageUrl(product);
    const productName =
      product.name.length > 32
        ? product.name.slice(0, 32) + '...'
        : product.name;

    return (
      <div
        className="flex-shrink-0"
        style={{ width: `${CARD_WIDTH}px` }}
      >
        <div
          className="flex rounded-lg overflow-hidden h-full"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {/* Image container — neutral bg so all product images look clean */}
          <Link
            to={`/product/${slug}`}
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 120,
              height: 130,
              backgroundColor: '#f5f5f5',
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="max-w-full max-h-full object-contain p-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/200/200';
              }}
            />
          </Link>

          {/* Info section */}
          <div className="flex flex-col justify-center flex-1 py-3 px-4 min-w-0 gap-0.5">
            {/* Time + VIEW row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: 'var(--color-text)', opacity: 0.45 }}
              >
                {timeAgoLabel}
              </span>
              <Link
                to={`/product/${slug}`}
                className="text-[11px] font-bold uppercase tracking-widest shrink-0 hover:underline"
                style={{ color: 'var(--color-text)', opacity: 0.55 }}
              >
                View
              </Link>
            </div>

            {/* Product name */}
            <h3
              className="text-[13px] font-bold leading-tight mb-1 truncate"
              style={{ color: 'var(--color-text)' }}
              title={product.name}
            >
              {productName}
            </h3>

            {/* Buyer info */}
            <p className="text-[11px] leading-snug" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              Purchased by :
            </p>
            <p className="text-[12px] font-semibold leading-snug" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
              {buyerName} in {city}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

PurchaseCard.displayName = 'PurchaseCard';

export default RecentPurchases;

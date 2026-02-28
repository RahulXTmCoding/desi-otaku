import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { shuffle, generateFakePurchases } from '../../utils/socialProofData';
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
const CARD_WIDTH = 370; // px including gap
const CARD_GAP = 16;    // px gap between cards
const SCROLL_SPEED = 70; // pixels per second — faster scroll

const RecentPurchases: React.FC = () => {
  const { data: productsData } = useProducts();
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Build entries once per product-list change
  const entries = useMemo(() => {
    const products: any[] = productsData ?? [];
    if (products.length === 0) return [];

    const pool = shuffle(products);
    const count = Math.min(pool.length, 12);
    const fakeBuyers = generateFakePurchases(count);

    return pool.slice(0, count).map((product: any, i: number) => ({
      product,
      ...fakeBuyers[i],
    }));
  }, [productsData]);

  // Duplicate entries for seamless infinite loop
  const loopedEntries = useMemo(() => [...entries, ...entries], [entries]);

  // Calculate animation duration based on content width
  const totalWidth = entries.length * (CARD_WIDTH + CARD_GAP);
  const duration = totalWidth / SCROLL_SPEED; // seconds

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

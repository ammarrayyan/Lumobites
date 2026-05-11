import { NextRequest, NextResponse } from 'next/server';
import { fetchProductByBarcode, isEnglishProduct } from '@/lib/openpetfoodfacts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  try {
    const product = await fetchProductByBarcode(barcode);
    if (!product) {
      return NextResponse.json({ error: 'Product not found — try searching by name instead' }, { status: 404 });
    }

    if (!isEnglishProduct(product.product_name)) {
      return NextResponse.json({ error: 'Product not available in the US — try scanning a different product' }, { status: 400 });
    }

    // Check for recalls by brand and product name
    let hasRecall = false;
    let recallReason = '';

    try {
      const searchTerms = `${product.brand} ${product.product_name}`.replace(/[^\w\s]/g, ' ');
      const fdaRes = await fetch(`https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(product.brand)}"&limit=10`);
      
      if (fdaRes.ok) {
        const fdaData = await fdaRes.json();
        if (fdaData.results && fdaData.results.length > 0) {
          // Simple check: if any recent recall mentions the brand and looks like pet food
          const match = fdaData.results.find((r: any) => {
            const desc = (r.product_description || '').toLowerCase();
            return desc.includes(product.brand.toLowerCase()) && 
                   (desc.includes('dog') || desc.includes('cat') || desc.includes('pet') || desc.includes('animal'));
          });
          
          if (match) {
            hasRecall = true;
            recallReason = match.reason_for_recall;
          }
        }
      }
    } catch (e) {
      console.error('FDA check error:', e);
    }

    return NextResponse.json({
      product,
      hasRecall,
      recallReason
    });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json({ error: 'Failed to lookup product' }, { status: 500 });
  }
}

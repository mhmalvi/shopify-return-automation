import { type NextRequest, NextResponse } from "next/server"
import { createShopifyService } from "@/lib/shopify-service"
import { dataService } from "@/lib/data-service"

export async function POST(request: NextRequest) {
  try {
    const { merchant_domain, order_number, customer_email } = await request.json()

    if (!merchant_domain || !order_number || !customer_email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // --------------------------------------------------------------------
    // DEMO SHORT-CIRCUIT
    // --------------------------------------------------------------------
    if (merchant_domain === "demo-store" || merchant_domain === "demo-store.myshopify.com") {
      return NextResponse.json({
        order: {
          id: "demo-order-id",
          order_number: "12345",
          email: "customer@example.com",
          total_price: "89.97",
          line_items: [
            {
              id: "item_1",
              product_id: "prod_123",
              variant_id: "var_123_m_blue",
              title: "Premium Cotton T-Shirt",
              variant_title: "Size M / Blue",
              quantity: 1,
              price: "29.99",
            },
            {
              id: "item_2",
              product_id: "prod_456",
              variant_id: "var_456_32_dark",
              title: "Denim Jeans",
              variant_title: "Size 32 / Dark Wash",
              quantity: 1,
              price: "59.99",
            },
          ],
        },
      })
    }

    // Get merchant data
    const merchant = await dataService.getMerchantByDomain(merchant_domain)
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    // Create Shopify service instance
    const shopifyService = createShopifyService(merchant.shop_domain, merchant.access_token)

    // Look up order
    const order = await shopifyService.findOrderByNumber(order_number, customer_email)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

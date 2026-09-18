# Skill: Vowvel Commerce Assistant

Handle quotes, coupon validations, and checkout initialization for Vowvel bespoke invitations.

## Usage

Use this skill when calculating invitation licensing fees, applying influencer promo codes, and processing agentic checkout orders.

## Pricing

- Base license: ₹2,499 INR domestic (amount charged in India), or $40 USD internationally via PayPal. Design is free; pay once to publish, host, and collect RSVPs.

## Actions

- **Calculate Quote**: `GET /api/orders/quote?couponCode=<code>`
- **Validate Coupon**: `POST /api/coupons/validate`
- **Initiate Order**: `POST /api/orders/checkout`

## Project Overview

This project was created to practice core Shopify theme development skills by building a complete
Product Detail Page (PDP) using the Skeleton theme as a clean starting point.
The implementation demonstrates how product data, metafields, variants, and theme settings
can be connected to the UI in a scalable and accessible way.

## Contents

- [How to Run the Project](#how-to-run-the-project)
- [Implemented Features](#what-has-been-implemented)
- [Metafields & Metaobjects](#metafields--metaobjects-used)
- [Beyond Requirements](#beyond-basic-requirements)

## How to Run the Project

### 1. Prerequisites

Ensure you have the following installed:

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) (latest version)
- Node.js and npm (for dependency management)
- A Shopify store or development store to test with

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/ivanna-pt/shopify-final-pdp-task.git

# Authenticate with your Shopify store
shopify auth logout  # if needed
shopify auth login   # follow the prompts to authenticate
```

### 3. Starting Development

```bash
# Start the development server
shopify theme dev
```

## What Has Been Implemented

This final PDP (Product Details Page) task includes the following features:

### Core Product Display

- **Custom product detail page template** with enhanced functionality and responsive layout
- **Dynamic product information display** featuring title, price, and description
- **Product image gallery** with thumbnail navigation and interactive main image
- **Responsive design** optimized for mobile, tablet, and desktop devices

### Product Variants & Selection

- **Variant selector** with visual options for color, size, and other attributes
- **Dynamic variant switching** with automatic price and inventory updates
- **Quantity selector** with min/max validation based on inventory rules
- **Real-time inventory tracking** showing stock availability

### Cart & Form Handling

- **Add to cart functionality**: Shopify native {% form 'product' %} usage
- **Cart count bubble** for visual feedback on cart items
- **Error handling** with user-friendly error messages
- **Disabled submit** state during processing
- **Variant availability handling**

### User Experience Enhancements

- Scroll-based product gallery behavior
- Variant-dependent image switching
- Product badges (sale / new / etc.)
- Icon + text feature blocks
- Accordion sections for extended product info
- Swiper-based carousels with proper lifecycle handling
- Responsive images with srcset and lazy loading

### Accessibility (a11y)

- Semantic HTML structure (section, nav, button, fieldset, legend)
- Keyboard-navigable controls
- ARIA attributes where appropriate: `aria-live` for form feedback, `aria-expanded` / `aria-controls` for accordions, `aria-busy` during form submission
- Proper focus handling for interactive elements
- Meaningful alt text for all product imagery

### Technical Implementation

- **Custom Web Components** for PDP logic separation (ProductInfo, VariantSelector, ProductForm, etc.)
- **Metafield and Metaobjects** for extended product data
- **CSS variables** for theming and customization
- **Tailwind CSS** for utility-first styling
- **Section schema** for merchant customization via Shopify admin
- **Swiper.js**: gallery and thumbnail navigation, safe initialization and teardown

## Metafields & Metaobjects Used

This theme utilizes the following metafields for enhanced product functionality:

### Product Information

- **`custom.product_details`** (List of entries - Metaobject reference: Product detail item ) – Detailed product information displayed in accordion
- **`custom.shipping_benefits`** (List of entries - Metaobject reference: Icon text item) – Shipping and delivery benefits to display with icons

### Product Reviews & Ratings

- **`custom.reviews`** (List of entries - Metaobject reference: Review item) – Customer reviews with ratings and reviewer information
  - Contains review text, star rating, and reviewer details (Metaobject Person profile) (name, city, image)

### Beyond Basic Requirements

- **Scroll-aware product gallery behavior**
- **Product Stock Indicator**
- **Variant-based gallery image switching**

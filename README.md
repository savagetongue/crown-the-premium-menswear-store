# CROWN – The Premium Menswear Store

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/savagetongue/crown-the-premium-menswear-store)

A sophisticated, production-grade Point of Sale (POS) and store management system designed for a premium menswear boutique. It provides a visually stunning and intuitive interface for managing inventory, processing sales, generating professional PDF invoices, and automatically delivering them to customers via WhatsApp and SMS.

CROWN is built to be a complete, all-in-one solution for modern retail management, featuring a powerful analytics dashboard to track sales trends, identify best-selling products, and manage stock levels effectively with low-stock and dead-stock alerts.

## Key Features

-   **Inventory Management**: Add, edit, and delete products and categories. Track stock quantities, locations, and receive low-stock/dead-stock alerts.
-   **Streamlined Billing System**: A modern POS interface to quickly add items to a cart, apply item-level or final bill discounts, and calculate totals with tax.
-   **Automated PDF Invoice Generation**: Automatically generate clean, professional A4 invoices with store branding, customer details, itemized lists, and a QR code.
-   **WhatsApp & SMS Delivery**: Instantly send invoice links to customers' phones via WhatsApp, with an SMS fallback for reliability.
-   **Powerful Reports & Analytics**: A comprehensive dashboard with daily, weekly, and monthly sales trends, category-wise sales charts, and lists of top-selling or slow-moving items.
-   **Admin & Staff Controls**: Manage store settings, invoice templates, and staff member access permissions.

## Technology Stack

-   **Frontend**: React, React Router, Vite, Zustand
-   **Backend**: Cloudflare Workers, Hono
-   **Storage**: Cloudflare Durable Objects
-   **UI/Styling**: Tailwind CSS, shadcn/ui, Framer Motion, Lucide React
-   **PDF Generation**: jsPDF, jspdf-autotable
-   **Data Visualization**: Recharts
-   **Tooling**: TypeScript, Bun

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/) installed on your machine.
-   A [Cloudflare account](https://dash.cloudflare.com/sign-up).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd crown-pos-system
    ```

2.  **Install dependencies:**
    This project uses Bun as the package manager.
    ```bash
    bun install
    ```

### Running Locally

To start the development server, which includes both the Vite frontend and the Hono backend worker, run:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

The project is organized into three main directories:

-   `src/`: Contains the frontend React application, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the backend Cloudflare Worker code, built with Hono. This is where API routes and business logic reside.
-   `shared/`: Contains TypeScript types and interfaces that are shared between the frontend and the backend to ensure type safety.

## Development

The application is built with a client-server architecture.

-   **Frontend**: The UI is built with React and `shadcn/ui` components. Global state management is handled by Zustand. API calls are made to the `/api/*` endpoints.
-   **Backend**: The API is a Hono application running on a Cloudflare Worker. All application state (products, invoices, etc.) is persisted in a single global Durable Object, ensuring data consistency.

To add new API endpoints, modify the files in the `worker/` directory, following the existing entity-based patterns.

## Deployment

This project is designed for seamless deployment to the Cloudflare network.

1.  **Build the project:**
    This command bundles both the frontend application and the worker code for production.
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare:**
    Make sure you are logged into your Cloudflare account via the Wrangler CLI. Then, run the deploy command:
    ```bash
    bun run deploy
    ```

Alternatively, you can deploy directly from your GitHub repository using the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/savagetongue/crown-the-premium-menswear-store)

## License

This project is licensed under the MIT License.
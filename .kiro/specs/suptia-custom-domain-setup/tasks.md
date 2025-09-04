# Implementation Plan

- [x] 1. Update environment variables and application configuration
  - Update NEXT_PUBLIC_SITE_URL to https://suptia.com in all environment files
  - Modify sitemap.ts to use the correct base URL
  - Update SEO configuration files with new canonical URLs
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Configure Vercel project for custom domain
  - Add suptia.com as custom domain in Vercel project settings
  - Configure SSL certificate for the custom domain
  - Set up www.suptia.com redirect to suptia.com
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement redirect configuration for legacy URLs
  - Update vercel.json with redirect rules for old domain
  - Configure 301 redirects from suptia-kiro.vercel.app to suptia.com
  - Test redirect functionality for all major pages
  - _Requirements: 1.4, 5.1, 5.2, 5.3_

- [x] 4. Update health check API for domain verification
  - Modify health check endpoint to return domain information
  - Add SSL certificate validation to health check
  - Include DNS resolution status in health response
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Create domain verification and testing scripts
  - Write script to verify DNS resolution and SSL certificate
  - Create automated test for redirect functionality
  - Implement performance testing for custom domain
  - _Requirements: 4.4, 3.1, 3.2, 3.3_

- [x] 6. Update robots.txt and sitemap for SEO
  - Modify robots.txt to reference correct sitemap URL
  - Ensure sitemap.xml generates all URLs with https://suptia.com
  - Update canonical URLs in all page metadata
  - _Requirements: 3.4, 2.3, 3.1_

- [x] 7. Deploy and verify custom domain setup
  - Deploy updated application to Vercel
  - Verify custom domain is accessible and SSL is working
  - Test all redirect scenarios and page functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.4_

- [x] 8. Implement monitoring and alerting for domain health
  - Set up continuous monitoring for domain availability
  - Configure alerts for SSL certificate expiry
  - Monitor redirect success rates and performance metrics
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
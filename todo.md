# Hot Dog or Not - Project TODO

## Phase 1: Database Schema
- [x] Create predictions table for storing hot dog classification results
- [x] Create comments table for user comments on predictions
- [x] Create upvotes table for tracking likes on predictions
- [x] Create notifications table for in-app notifications
- [x] Add database helper functions in server/db.ts

## Phase 2: Backend API & AI Integration
- [x] Implement image upload to S3 with storagePut
- [x] Integrate AI image classification for hot dog detection
- [x] Create tRPC procedure for submitting predictions
- [x] Create tRPC procedure for fetching gallery with filters
- [x] Create tRPC procedure for adding comments
- [x] Create tRPC procedure for toggling upvotes
- [x] Integrate AI image generation for creating test hot dog images

## Phase 3: Frontend UI & Retro Design
- [x] Set up retro 8-bit pixel art design system in index.css
- [x] Add pixel art font from Google Fonts
- [x] Implement camera capture and image upload UI
- [x] Create prediction result display with Hot Dog ✅ / Not Hot Dog ❌
- [x] Build mobile-first responsive layout
- [x] Add floating geometric pixel elements for retro aesthetic

## Phase 4: Gallery & Social Features
- [x] Implement public gallery grid view
- [x] Add filter buttons (All, Hot Dog, Not Hot Dog)
- [x] Create comment section component
- [x] Implement upvote button with optimistic updates
- [x] Add real-time update for new predictions

## Phase 5: Notifications & AI Image Generation
- [x] Create notification system for new comments and upvotes
- [x] Implement notification badge and dropdown
- [x] Build AI image generation interface for creating test images
- [x] Add generated image preview and test functionality

## Phase 6: Testing & Validation
- [x] Write vitest tests for prediction procedures
- [x] Write vitest tests for comment and upvote procedures
- [x] Write vitest tests for notification procedures
- [x] Test mobile responsiveness
- [x] Verify S3 image storage and retrieval

## Phase 7: Deployment
- [x] Final code review and cleanup
- [x] Create checkpoint for deployment
- [x] Deliver project to user


## Phase 8: Stripe Payment Integration
- [ ] Set up Stripe integration with webdev_add_feature
- [ ] Create subscription plans table in database
- [ ] Create user subscriptions table
- [ ] Create payment history table
- [ ] Implement Stripe webhook handler for payment events
- [ ] Create tRPC procedure for creating checkout sessions
- [ ] Create tRPC procedure for managing subscriptions
- [ ] Create tRPC procedure for checking user subscription status
- [ ] Build subscription pricing page
- [ ] Build user subscription management page
- [ ] Add premium feature gates based on subscription status
- [ ] Test payment flow end-to-end

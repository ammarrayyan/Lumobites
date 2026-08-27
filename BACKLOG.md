# Product Backlog & Roadmap

## 📌 Feature Backlog Items

---

### 1. Partner Review & Rating System (Vet Boarding, Pet Daycare, Shelter)

**Status:** `Backlog / Ready for Planning`  
**Priority:** High (Competitive parity with Rover, Wag, and Pet Sitting)  
**Reference Model:** Reuses the proven Pet Sitter review pattern (`sitter_reviews`, `/api/petsitting/reviews`, interactive submission modal, admin moderation, and card star display).

#### 🎯 Objective
Enable verified pet owners to submit 1–5 star ratings and detailed text reviews for **Vet Boarding**, **Pet Daycare**, and **Rescue / Shelter** partners upon booking inquiry or completed stays/adoptions, displaying aggregate ratings and review counts on partner listings.

---

#### 📐 Architectural Specification & Reuse Pattern

##### 1. Database Schema (Supabase)
Following the exact schema structure of `sitter_reviews`:

```sql
-- 1. Vet Boarding Reviews
CREATE TABLE IF NOT EXISTS public.vet_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.vet_clinics(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.vet_inquiries(id) ON DELETE SET NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vet_reviews_owner_clinic_unique UNIQUE (clinic_id, owner_email)
);

-- Add rating columns to vet_clinics
ALTER TABLE public.vet_clinics 
ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 2. Pet Daycare Reviews
CREATE TABLE IF NOT EXISTS public.daycare_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id UUID NOT NULL REFERENCES public.pet_daycares(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.daycare_inquiries(id) ON DELETE SET NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daycare_reviews_owner_daycare_unique UNIQUE (daycare_id, owner_email)
);

-- Add rating columns to pet_daycares
ALTER TABLE public.pet_daycares 
ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 3. Shelter / Rescue Reviews
CREATE TABLE IF NOT EXISTS public.shelter_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT shelter_reviews_owner_shelter_unique UNIQUE (shelter_id, owner_email)
);

-- Add rating columns to shelters
ALTER TABLE public.shelters 
ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
```

---

##### 2. API Endpoints
- `app/api/vet-boarding/reviews/route.ts`:
  - `GET ?clinic_id=...`: Fetch approved reviews + aggregate summary.
  - `POST`: Submit review, validate session/owner email, enforce 1 review per owner per partner, recalculate `avg_rating` and `review_count` on `vet_clinics`.
- `app/api/pet-daycare/reviews/route.ts`:
  - `GET ?daycare_id=...`: Fetch approved reviews + aggregate summary.
  - `POST`: Submit review, recalculate `avg_rating` and `review_count` on `pet_daycares`.
- `app/api/adoption/shelter-reviews/route.ts`:
  - `GET ?shelter_id=...`: Fetch approved reviews + aggregate summary.
  - `POST`: Submit review, recalculate `avg_rating` and `review_count` on `shelters`.

---

##### 3. UI Components & User Experience
- **Interactive Review Submission Modal**:
  - Star rating selector (1–5 gold stars).
  - Review text input with character counter.
  - Verification badge: "Verified Client / Adopter".
- **Partner Cards & Profiles**:
  - Public listing cards (`/vet-boarding`, `/pet-daycare`, `/adoption`) display star badge: `★ 4.9 (12 reviews)` or `✨ New Partner • No reviews yet`.
  - Detail/Profile view with "Reviews" tab displaying list of client testimonials.
- **Post-Stay Trigger**:
  - Prompt owner on completed booking (`status === 'completed'`) in Owner Dashboard (`/petsitting` My Dashboard) to leave a review.
- **Admin Moderation**:
  - Extend `ReviewsManagement` in `app/admin/page.tsx` to support tabbed moderation across Sitters, Vets, Daycares, and Shelters.

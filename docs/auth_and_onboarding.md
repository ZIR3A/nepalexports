# Authentication & Onboarding (Easy Guide)

Welcome! This document explains how user logins and our mandatory KYC (Know Your Customer) onboarding flow work on the ExportHub platform in simple, everyday language.

---

## 1. How Users Log In (Google OAuth)

We use **NextAuth** to handle user accounts. Currently, users can log in instantly using their existing Google accounts.

When a customer clicks "Sign in with Google":
1. They are securely redirected to Google to approve the login.
2. Google sends us their basic profile (Email, Name, and Avatar).
3. If they are a **brand new user**, our backend instantly creates an account for them in our database. It neatly splits their full name into a First and Last name and saves their Google Avatar.
4. **Crucially**, new users are assigned a special invisible status tag: `kycStatus: 'PENDING'`.

---

## 2. The Global Security Guard

To ensure no one can buy items or use the platform without providing proper shipping and contact details (required for international customs and shipping like DHL/FedEx), we have a **Global Route Guard** installed.

Think of the Route Guard as a bouncer at the door of the storefront:
* The bouncer instantly checks the `kycStatus` of every logged-in user.
* If their status is `COMPLETED`, the bouncer lets them explore the store freely.
* If their status is `PENDING`, the bouncer traps them and forcefully redirects them to the `/onboarding` screen.
* **Exceptions:** The bouncer will allow anyone (even `PENDING` users) to view our `/privacy-policy`.

---

## 3. The KYC Onboarding Flow

Once a new user is trapped on the `/onboarding` screen, they must complete a short form to unlock their account.

### What they must provide:
1. **Phone Number:** They must enter a valid phone number. We use a strict formatting tool (`react-phone-number-input`) that automatically adapts to their country (e.g., United Kingdom or Nepal) and verifies the number is physically valid before letting them submit.
2. **Shipping Address:** They must provide a full street address, city, postal code, and country.
3. **Avatar (Optional):** We automatically show them the Avatar we pulled from their Google account. If they want to change it, they can upload a new image.

### Unlocking the Account:
When they click "Complete Onboarding", the system saves their new details to the database and instantly upgrades their status from `PENDING` to `COMPLETED`. 

They are then automatically dropped onto the Homepage, and the Route Guard will never bother them again!

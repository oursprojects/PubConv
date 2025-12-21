# Setting up reCAPTCHA for Mobile

Since your mobile app runs on `http://localhost` internally, Google reCAPTCHA will block it unless you explicitly allow it.

## Steps to Fix

1.  **Go to the Console**: Open the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2.  **Select Your Site**: Choose the site key you are using for `PubConv`.
3.  **Open Settings**: Click the **Settings** (gear icon) in the top right.
4.  **Find "Domains"**: Scroll down to the **Domains** section.
5.  **Add Domains**: Click the `+` icon (or just click in the list) and add the following **exact** domains:
    *   `localhost`
    *   `127.0.0.1`
6.  **Alternative (Easiest)**:
    *   Locate the checkbox that says **"Verify the origin of reCAPTCHA solutions"**.
    *   **Uncheck** it. (This disables domain checking, which is easier for mobile development but slightly less secure for web).
7.  **Save**: Click **Save** at the bottom.

## How to Test
1.  Close your mobile app completely.
2.  Open it again.
3.  Go to the Register page. The "I'm not a robot" checkbox should now appear and work correctly.

# Unity Express

Unity Express is a Firebase-backed savings-group ledger with email/password sign-in, a live shared dashboard, contributions, and expense records.

## Firebase setup (one time)

1. In Firebase Console, open **Authentication → Sign-in method → Email/Password** and enable it.
2. In **Firestore Database → Rules**, paste the contents of `firestore.rules` and click **Publish**. Do not use open/test rules for a financial ledger.
3. Register a Web app in **Project settings → General → Your apps**. The project configuration is already in `app.js` for project `unity-express`.
4. Open **Authentication → Users** and create an account for yourself through the website.
5. In Authentication → Users, copy your user's **UID**. In Firestore **Data**, create a collection named `members`, then a document whose ID is that exact UID. Add a boolean field `active` with value `true`. Repeat for each approved group member. Do not share anyone's password.

Only members with an active document can read the group ledger or add records. New accounts remain pending until an administrator adds their UID. The app deliberately does not allow users to approve themselves.

## Run the site

Serve `index.html`, `styles.css`, and `app.js` from a static web server (for example GitHub Pages). Because the app uses Firebase browser modules, opening the file directly as `file://` may not work. No npm install is required.

## Security and data notes

The Firebase web config in `app.js` is public client configuration; it is not a service-account key. Firestore access is controlled by `firestore.rules`. Contributions and expenses can be added but not edited/deleted through the app; use Firebase Console only for carefully administered corrections. Keep the Firebase project owner's account secure.

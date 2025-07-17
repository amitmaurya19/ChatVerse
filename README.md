# 🚀 ChatVerse 💬

---

## ✨ Project Overview

ChatVerse is a real-time chatroom web application designed to foster vibrant communities where users can connect, share, and engage. This project showcases a robust chat experience with features for both public and private interactions.

**🌐 Live Application:** [https://chat-verse-sigma.vercel.app/](https://chat-verse-sigma.vercel.app/)

---

## 🌟 Key Features

* **Real-time Messaging:** Engage in live conversations within various chat rooms.
* **Public & Private Rooms:**
    * **Public Rooms:** Freely accessible for anyone to join and participate.
    * **Private Rooms:** Secured with a passkey, allowing controlled access for a select group.
* **User Authentication:** Securely sign in and manage your account using Google authentication or traditional email/password credentials via NextAuth.js.
* **Room Management:**
    * Create new chat rooms (public or private) with custom names and descriptions.
    * Edit existing room details (description, type, and passkey) if you are the room's creator.
    * Delete rooms you have created.
    * Easily join and leave rooms, with membership updates handled seamlessly.
    * View all the rooms you have joined on a dedicated "My Rooms" page.
    * See a list of all rooms you've created on your profile page.
* **Message Editing:** Correct your messages within a 5-minute window after sending them.
* **Dynamic Room Avatars:** Rooms now use intelligent initial-based fallbacks for their avatars, ensuring a consistent and personalized look.
* **Responsive Design:** Enjoy a smooth experience across various devices with responsive navigation and layouts.
* **Theme Toggle:** Switch between dark and light themes for a personalized viewing experience.

---

## 🛠️ Tech Stack

* **Frontend & Backend:** [Next.js](https://nextjs.org/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Google Provider & Credentials)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (for persistent data storage)
* **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
* **Deployment:** [Vercel](https://vercel.com/) (for seamless web hosting)

---

## 💡 Future Enhancements

While ChatVerse is fully functional, here are some areas for potential future development:

* **Notifications:** Implement real-time notifications for new messages or room activities.
* **Typing Indicators:** Show when other users are actively typing in a chat room.
* **Active User List:** Display a list of currently active members within a chat room.
* **Direct Messaging:** Add the ability for users to send private messages to each other outside of rooms.

---

This project represents a complete and functional chat application, built with modern web technologies.
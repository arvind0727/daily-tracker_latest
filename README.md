# 🎯 Daily Tracker

A comprehensive daily tracking application built with React and Firebase that helps you track habits, meals, expenses, workouts, and body weight all in one place.

![Daily Tracker](https://img.shields.io/badge/React-18.0+-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-10.0+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 📊 Habit Matrix
- Track multiple daily habits with a visual calendar grid
- View habit completion by month
- Automatic streak tracking with fire badges (3+ days)
- Consistency graph showing habit completion trends
- Add custom habits or use default templates

### 🍽️ Nutrition Tracker
- Log meals with detailed macronutrient breakdown
- Pre-loaded database of common foods
- Calculate protein, carbs, fats, and calories
- Categorize meals by timing (breakfast, lunch, dinner, snacks)
- View daily nutrition totals

### 💪 Workout & Activity
- Log calories burned from activities
- Track daily burned calories
- Calculate net calorie balance

### 💰 Expense Tracker
- Record daily expenses
- Add item details and notes
- View spending by day

### ⚖️ Weight Tracking
- Log body weight measurements
- Visual weight progress chart
- Track weight changes over time
- See total weight loss/gain

### 📈 Statistics & History
- Comprehensive daily summaries
- Historical data view for all trackers
- Habit completion percentages
- Nutrition trends

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/daily-tracker.git
   cd daily-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore Database (Start in test mode)
   - Get your Firebase configuration from Project Settings

4. **Configure Firebase credentials**
   
   Open `src/firebase.js` and replace the firebaseConfig with your credentials:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

5. **Update Firestore Security Rules**
   
   In Firebase Console → Firestore Database → Rules:
   
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Tech Stack

- **Frontend:** React 18
- **Backend:** Firebase (Firestore, Authentication)
- **Styling:** Inline CSS with CSS-in-JS
- **Icons:** Lucide React
- **Charts:** HTML Canvas API

## 📱 Features Breakdown

### Habit Tracker
- Default habits: Drink 3L Water, Gym Workout, Read 10 Pages, No Sugar, Sleep 8 Hours, 10k Steps, Take Creatine, Meditation
- Click to toggle habit completion
- Visual indicators for today's habits
- Monthly view with consistency graph

### Meal Logger
- Support for up to 5 food items per meal
- Auto-calculation of macros based on weight/quantity
- Built-in food database with common items
- Meal categorization
- Daily macro totals

### Weight Tracker
- Simple weight logging
- Line chart visualization
- Progress tracking with change indicators
- Historical weight data

## 🔐 Security

- All data is user-specific and private
- Firebase Authentication ensures secure access
- Firestore security rules prevent unauthorized access
- No sensitive data stored in localStorage

## 📂 Project Structure

```
daily-tracker/
├── public/
├── src/
│   ├── App.js          # Main application component
│   ├── firebase.js     # Firebase configuration & functions
│   └── index.js        # Entry point
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: this is a one-way operation!** Ejects from Create React App

## 🐛 Troubleshooting

### Habits not saving?
- Check Firebase Console → Firestore Database → Rules
- Ensure rules allow authenticated users to read/write
- Check browser console for errors

### Authentication errors?
- Verify Firebase config in `src/firebase.js`
- Ensure Email/Password auth is enabled in Firebase Console

### Data not loading?
- Check browser console for errors
- Verify internet connection
- Check Firebase project status

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Hosted on Firebase
- Built with Create React App

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/YOUR_USERNAME/daily-tracker](https://github.com/YOUR_USERNAME/daily-tracker)

---

**⭐ Star this repo if you find it helpful!**
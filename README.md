# 📄 DocInsight

DocInsight is a frontend-only React application that uses Google Gemini AI to summarize documents and answer questions. It features a clean, modern UI built with Vite, React, and Tailwind CSS.

## ✨ Features

- **Document Summarization**: Paste or upload text documents and generate AI-powered summaries
- **Technical Term Highlighting**: Automatically highlights technical terms in the summary
- **Question & Answer**: Ask follow-up questions based on the generated summary
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Loading States**: Smooth loading indicators for better UX
- **Error Handling**: Clear error messages for API issues

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone or download this repository**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Get your Gemini API Key**

   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

4. **Configure the API Key**

   - Open `src/gemini.js`
   - Replace `YOUR_API_KEY_HERE` with your actual API key:

   ```javascript
   const GEMINI_API_KEY = "your-actual-api-key-here";
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in your terminal)

## 📁 Project Structure

```
clgPro/
├── src/
│   ├── App.jsx          # Main application component
│   ├── gemini.js        # Gemini API integration
│   ├── index.css        # Tailwind CSS directives
│   └── main.jsx         # React entry point
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🎯 How to Use

1. **Paste Your Document**

   - Copy and paste your document text into the textarea
   - Any text format works (articles, research papers, technical documents, etc.)

2. **Generate Summary**

   - Click the "Generate Summary" button
   - Wait for the AI to process your document
   - The summary will appear with technical terms highlighted in blue

3. **Ask Questions**
   - After generating a summary, you can ask questions in the Q&A section
   - Type your question and click "Ask" or press Enter
   - The AI will answer based on the summary context

## 🔧 Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Google Gemini API** - AI-powered text summarization and Q&A

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## ⚠️ Important Notes

- **API Key Security**: This is a frontend-only demo. In a production app, you should never expose your API key in the frontend code. Use a backend server to handle API calls.

- **Rate Limits**: Google Gemini API has rate limits on free tier. Be mindful of the number of requests you make.

- **Browser Compatibility**: This app works best in modern browsers (Chrome, Firefox, Safari, Edge).

## 🎓 Perfect for College Projects

This project demonstrates:

- React hooks (useState)
- Async/await API calls
- Modern UI/UX design
- AI integration
- Error handling
- Loading states
- Responsive design

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork this project and add features like:

- PDF file upload support
- Document history
- Export summaries
- Multiple language support
- Dark mode toggle

---

**Made with ❤️ using React + Vite + Tailwind CSS + Google Gemini AI**

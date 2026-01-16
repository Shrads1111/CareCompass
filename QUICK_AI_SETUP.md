# Quick AI Setup - Step by Step

## 🚀 Fast Setup (5 minutes)

### Step 1: Get OpenAI API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)
4. **Save it somewhere safe!**

### Step 2: Install Package

```bash
cd ctc-login
npm install
```

### Step 3: Add API Key to .env

Open `ctc-login/.env` and add:

```env
OPENAI_API_KEY=sk-paste-your-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Important:** Replace `sk-paste-your-key-here` with your actual key!

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C)
npm start
```

### Step 5: Test It!

1. Log in as doctor
2. Select a patient
3. Click "Generate Analysis"
4. See AI-powered analysis! ✨

## 💰 Cost

- **GPT-3.5-turbo:** ~$0.001 per analysis (1 cent per 10 analyses!)
- Very affordable for regular use

## ✅ That's It!

Your AI analysis is now working!

## 🔧 Troubleshooting

**"AI analysis unavailable"**
- Check `.env` file has `OPENAI_API_KEY=sk-...`
- Restart server after adding key

**"Insufficient quota"**
- Add payment method at: https://platform.openai.com/account/billing

**Still not working?**
- Check server terminal for error messages
- Verify API key is correct (no extra spaces)

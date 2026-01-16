# AI Analysis Setup Guide

This guide will help you set up AI-powered patient analysis using OpenAI's API.

## Prerequisites

1. Node.js installed
2. MongoDB connected and working
3. Server running

## Step 1: Get OpenAI API Key

### Option A: OpenAI (Recommended)

1. **Create an OpenAI Account:**
   - Go to https://platform.openai.com
   - Sign up or log in

2. **Get API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name (e.g., "CareCompass")
   - Copy the key (starts with `sk-`)
   - ⚠️ **Save it immediately** - you won't see it again!

3. **Add Credits (if needed):**
   - Go to: https://platform.openai.com/account/billing
   - Add payment method and credits
   - GPT-3.5-turbo is very affordable (~$0.001 per analysis)

### Option B: Alternative AI Services

You can also use:
- **Anthropic Claude** (via API)
- **Google Gemini** (via API)
- **Azure OpenAI** (if you have Azure account)

## Step 2: Install Dependencies

```bash
cd ctc-login
npm install
```

This will install the `openai` package that was added to `package.json`.

## Step 3: Configure Environment Variables

1. **Open your `.env` file** in the `ctc-login` directory

2. **Add these lines:**

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

3. **Replace `sk-your-actual-api-key-here`** with your actual API key from Step 1

4. **Optional: Choose a different model:**
   - `gpt-3.5-turbo` - Fast and affordable (recommended)
   - `gpt-4` - More accurate but more expensive
   - `gpt-4-turbo` - Best quality, higher cost

## Step 4: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

## Step 5: Test the AI Analysis

1. Log in as a doctor
2. Select a patient with data from the last 7 days
3. Click "Generate Analysis"
4. You should see AI-powered analysis!

## How It Works

### Without API Key (Basic Analysis)
- Uses a simple algorithm
- Shows compliance percentages
- Basic recommendations
- **Works immediately, no setup needed**

### With API Key (AI-Powered Analysis)
- Uses GPT-3.5-turbo or GPT-4
- Provides detailed, professional analysis
- Identifies patterns and trends
- Gives actionable recommendations
- **Requires API key setup**

## Cost Estimation

- **GPT-3.5-turbo:** ~$0.001 per analysis (very cheap)
- **GPT-4:** ~$0.03 per analysis
- **1000 analyses:** ~$1-30 depending on model

## Troubleshooting

### Error: "AI analysis unavailable"
- Check that `OPENAI_API_KEY` is set in `.env`
- Make sure you restarted the server after adding the key
- Verify the API key is correct (starts with `sk-`)

### Error: "Insufficient quota"
- Add credits to your OpenAI account
- Check billing: https://platform.openai.com/account/billing

### Error: "Invalid API key"
- Verify the key in `.env` file
- Make sure there are no extra spaces
- Regenerate the key if needed

### Error: "Rate limit exceeded"
- You're making too many requests
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

## Security Best Practices

1. **Never commit `.env` file to git**
   - It's already in `.gitignore`
   - Keep your API key secret

2. **Use environment variables in production**
   - Don't hardcode API keys
   - Use secure secret management

3. **Monitor API usage**
   - Check OpenAI dashboard regularly
   - Set up usage alerts

## Advanced Configuration

### Customize the AI Prompt

Edit `server.js` around line 395 to modify the analysis prompt:

```javascript
const prompt = `Your custom prompt here...`;
```

### Adjust AI Parameters

In `server.js` around line 427:

```javascript
const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [...],
    max_tokens: 1000,      // Increase for longer analysis
    temperature: 0.7,      // Lower = more consistent, Higher = more creative
});
```

### Use Different Models

Change in `.env`:
```env
OPENAI_MODEL=gpt-4
# or
OPENAI_MODEL=gpt-4-turbo-preview
```

## Alternative: Use Other AI Services

If you want to use a different AI service, you'll need to modify `server.js`:

### Example: Using Anthropic Claude

1. Install: `npm install @anthropic-ai/sdk`
2. Replace OpenAI code with Claude API calls
3. Update environment variables

### Example: Using Google Gemini

1. Install: `npm install @google/generative-ai`
2. Replace OpenAI code with Gemini API calls
3. Update environment variables

## Support

- OpenAI Docs: https://platform.openai.com/docs
- OpenAI Pricing: https://openai.com/pricing
- OpenAI Support: https://help.openai.com

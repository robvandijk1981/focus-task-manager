// AI Service for OpenAI integration
class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('openai_api_key') || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return this.apiKey && this.apiKey.length > 0;
  }

  async callOpenAI(messages, options = {}) {
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not set');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  createSystemPrompt(tracks) {
    const trackList = tracks.map(track => {
      const goalList = track.goals.map(goal => `    - ${goal.name}`).join('\n');
      return `  ${track.name}:\n    Context: ${track.context}\n    Goals:\n${goalList}`;
    }).join('\n\n');

    return `You are an AI assistant helping someone with ADHD manage their multi-track life. 

The user has these life tracks with context and goals:
${trackList}

Your job is to extract actionable tasks from unstructured notes and categorize them appropriately.

Rules:
1. Each goal can have maximum 3 high-priority tasks (enforce this limit)
2. Break down large tasks into specific, actionable items
3. Consider ADHD-friendly principles: specific, not overwhelming, realistic
4. Use track context to better understand task categorization
5. Suggest appropriate track/goal based on context and content
6. Suggest realistic priorities based on urgency, importance, and track context

Return responses in valid JSON format only.`;
  }

  async extractTasks(notes, tracks, selectedTrackId = null) {
    const systemPrompt = this.createSystemPrompt(tracks);
    
    const userPrompt = `Analyze these notes and extract actionable tasks:

"${notes}"

${selectedTrackId ? `Focus on tasks related to the "${tracks.find(t => t.id === selectedTrackId)?.name}" track.` : ''}

Return JSON in this exact format:
{
  "extracted_tasks": [
    {
      "text": "Specific actionable task",
      "suggested_track_id": "track_id",
      "suggested_goal_id": "goal_id",
      "suggested_priority": "high|medium|low",
      "reasoning": "Brief explanation of categorization"
    }
  ],
  "summary": "Brief summary of the notes in 1-2 sentences"
}

Only return valid JSON, no other text.`;

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to process notes: ${error.message}`);
    }
  }

  async generateEmailDraft(context, recipient = '', purpose = '') {
    const systemPrompt = `You are an AI assistant that generates professional email drafts. 
    
Create emails that are:
- Professional but friendly
- Clear and concise
- Include relevant context
- Suggest appropriate subject lines
- Include next steps when relevant`;

    const userPrompt = `Generate an email draft based on this context:

Context: "${context}"
${recipient ? `Recipient: ${recipient}` : ''}
${purpose ? `Purpose: ${purpose}` : ''}

Return JSON in this exact format:
{
  "subject": "Suggested email subject",
  "body": "Professional email body with appropriate greeting, content, and closing",
  "next_steps": ["Suggested follow-up action 1", "Suggested follow-up action 2"]
}

Only return valid JSON, no other text.`;

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Email Generation Error:', error);
      throw new Error(`Failed to generate email: ${error.message}`);
    }
  }

  async processVoiceNote(transcript, trackId, tracks) {
    console.log('AIService.processVoiceNote called with:', { transcript, trackId, tracksLength: tracks.length })
    
    if (!this.hasApiKey()) {
      console.log('No API key available')
      throw new Error('OpenAI API key not configured')
    }

    const currentTrack = tracks.find(t => t.id === trackId)
    if (!currentTrack) {
      console.log('Track not found:', trackId)
      throw new Error('Track not found')
    }

    console.log('Found track:', currentTrack.name)

    const systemPrompt = `You are an AI assistant that processes voice notes into context updates and actionable tasks.

Track: ${currentTrack.name}
Current Context: ${currentTrack.context || 'No context yet'}

Available Goals in this track:
${currentTrack.goals.map(goal => `- ${goal.name} (ID: ${goal.id})`).join('\n')}

Rules:
1. Extract context/background information that should be added to track context
2. Extract specific actionable tasks with priorities
3. Suggest appropriate goals for each task (existing or new)
4. Consider deadlines and urgency for priority assignment (look for words like "by Friday", "urgent", "ASAP")
5. Be specific and actionable with tasks
6. Use track context to better understand the domain and categorization
7. Maximum 3 high-priority tasks per goal (enforce this limit)
8. Break down complex items into specific, manageable tasks`

    const userPrompt = `Process this voice note from the ${currentTrack.name} track:

"${transcript}"

Return JSON in this exact format:
{
  "context_update": "Summary of new context/background information to add to track context (or null if none)",
  "tasks": [
    {
      "text": "Specific actionable task",
      "suggested_goal_id": "existing-goal-id or 'new-goal'",
      "suggested_goal_name": "Goal name if new goal needed",
      "suggested_priority": "high|medium|low",
      "reasoning": "Brief explanation of priority and categorization"
    }
  ],
  "summary": "Brief summary of what was processed"
}

Only return valid JSON, no other text.`

    try {
      console.log('Making API call to OpenAI...')
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { max_tokens: 1500 })

      console.log('Raw API response:', response)

      const cleanedResponse = response.trim()
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        console.log('No valid JSON found in response:', cleanedResponse)
        throw new Error('No valid JSON found in response')
      }

      const parsedResult = JSON.parse(jsonMatch[0])
      console.log('Parsed result:', parsedResult)
      return parsedResult
    } catch (error) {
      console.error('Voice processing error:', error)
      throw new Error(`Failed to process voice note: ${error.message}`)
    }
  }

  async testConnection() {
    try {
      const response = await this.callOpenAI([
        { role: 'user', content: 'Respond with just "OK" if you can see this message.' }
      ], { max_tokens: 10 });
      
      return response.toLowerCase().includes('ok');
    } catch (error) {
      throw new Error(`API connection failed: ${error.message}`);
    }
  }
}

export default new AIService();


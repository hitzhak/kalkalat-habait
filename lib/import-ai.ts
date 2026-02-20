import OpenAI from 'openai';
import { ConfidenceLevel } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CategoryInfo {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string }[];
}

interface CategorizationResult {
  index: number;
  categoryId: string | null;
  subCategoryId: string | null;
  confidence: ConfidenceLevel;
  reason?: string;
  isTransfer?: boolean;
}

export async function categorizeTransactions(
  descriptions: string[],
  categories: CategoryInfo[]
): Promise<CategorizationResult[]> {
  if (descriptions.length === 0) return [];

  const categoryList = categories.map(cat => {
    const subs = cat.children?.length
      ? ` (תתי: ${cat.children.map(s => `${s.name}[${s.id}]`).join(', ')})`
      : '';
    return `- "${cat.id}": "${cat.name}" [${cat.type}]${subs}`;
  }).join('\n');

  const descList = descriptions.map((d, i) => `${i + 1}. "${d}"`).join('\n');

  const prompt = `אתה מסווג עסקאות בנקאיות ישראליות לקטגוריות תקציב.

קטגוריות זמינות:
${categoryList}

עסקאות לסיווג:
${descList}

כללים:
1. התאם לתת-קטגוריה הספציפית ביותר (למשל "סלקום" → סלולר, "שופרסל" → סופר)
2. אם אין תת-קטגוריה מתאימה, השתמש בקטגוריית האב
3. סמן העברות בין חשבונות, תשלומי כרטיס אשראי, הפקדות לפיקדון כ-isTransfer: true
4. confidence: "high" = ברור (שופרסל=אוכל), "low" = לא בטוח, "unknown" = לא ניתן לזהות

החזר JSON array בלבד (בלי markdown):
[{"index": 1, "categoryId": "cat_id", "subCategoryId": "sub_id_or_null", "confidence": "high|low|unknown", "reason": "optional", "isTransfer": false}]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'אתה מומחה בסיווג עסקאות פיננסיות ישראליות. ענה תמיד ב-JSON בלבד.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const results: CategorizationResult[] = JSON.parse(cleaned);
    return results;
  } catch (error) {
    console.error('AI categorization error:', error);
    return descriptions.map((_, i) => ({
      index: i + 1,
      categoryId: null,
      subCategoryId: null,
      confidence: 'unknown' as ConfidenceLevel,
      reason: 'שגיאה בסיווג אוטומטי',
    }));
  }
}

export async function extractFromPDF(
  base64Content: string,
  categories: CategoryInfo[]
): Promise<{
  rows: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryId: string | null;
    subCategoryId: string | null;
    confidence: ConfidenceLevel;
    isTransfer?: boolean;
  }>;
}> {
  const categoryList = categories.map(cat => {
    const subs = cat.children?.length
      ? ` (תתי: ${cat.children.map(s => `${s.name}[${s.id}]`).join(', ')})`
      : '';
    return `- "${cat.id}": "${cat.name}" [${cat.type}]${subs}`;
  }).join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'אתה מומחה בחילוץ נתונים מדפי חשבון בנקאיים ישראליים. חלץ את כל העסקאות וסווג אותן. ענה תמיד ב-JSON בלבד.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `חלץ את כל העסקאות מהמסמך הבא וסווג כל עסקה.

קטגוריות זמינות:
${categoryList}

כללים:
- תאריך בפורמט YYYY-MM-DD
- סכום תמיד חיובי
- type: INCOME או EXPENSE
- דלג על שורות סיכום (סה"כ, יתרה)
- השתמש בתאריך עסקה (לא תאריך חיוב) כשיש שני תאריכים
- סמן העברות בין חשבונות כ-isTransfer: true

החזר JSON:
{"rows": [{"date": "2026-01-15", "description": "שופרסל דיל", "amount": 250, "type": "EXPENSE", "categoryId": "id", "subCategoryId": "id_or_null", "confidence": "high", "isTransfer": false}]}`
            },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64Content}` }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || '{"rows":[]}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('PDF extraction error:', error);
    return { rows: [] };
  }
}

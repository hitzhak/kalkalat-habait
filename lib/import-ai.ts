import OpenAI from 'openai';
import { ConfidenceLevel } from '@/types';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

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

interface TransactionInput {
  description: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface UserMapping {
  description: string;
  categoryId: string;
  parentCategoryId: string | null;
  categoryName: string;
}

const BATCH_SIZE = 30;

function normalizeDesc(desc: string): string {
  return desc.trim().replace(/\s+/g, ' ');
}

function buildExamplesSection(mappings: UserMapping[]): string {
  if (mappings.length === 0) return '';
  const examples = mappings.slice(0, 50).map(m =>
    `- "${m.description}" → ${m.categoryName}`
  ).join('\n');
  return `\nדוגמאות מסיווגים קודמים שאושרו ע"י המשתמש (עקוב אחריהם!):\n${examples}\n`;
}

async function categorizeBatch(
  batch: TransactionInput[],
  globalStartIndex: number,
  categories: CategoryInfo[],
  userMappings: UserMapping[]
): Promise<CategorizationResult[]> {
  const categoryList = categories.map(cat => {
    const subs = cat.children?.length
      ? ` (תתי: ${cat.children.map(s => `${s.name}[${s.id}]`).join(', ')})`
      : '';
    return `- "${cat.id}": "${cat.name}" [${cat.type}]${subs}`;
  }).join('\n');

  const descList = batch.map((t, i) => {
    const idx = globalStartIndex + i + 1;
    return `${idx}. "${t.description}" [${t.type}]`;
  }).join('\n');

  const examplesSection = buildExamplesSection(userMappings);

  const prompt = `אתה מסווג עסקאות בנקאיות ישראליות לקטגוריות תקציב.

קטגוריות זמינות:
${categoryList}
${examplesSection}
עסקאות לסיווג:
${descList}

כללים:
1. התאם לתת-קטגוריה הספציפית ביותר (למשל "סלקום" → סלולר, "שופרסל" → סופר)
2. אם אין תת-קטגוריה מתאימה, השתמש בקטגוריית האב
3. חשוב: לכל עסקה מצוין [EXPENSE] או [INCOME] — בחר קטגוריה מהסוג המתאים בלבד
4. סמן העברות בין חשבונות, תשלומי כרטיס אשראי, הפקדות לפיקדון כ-isTransfer: true
5. confidence: "high" = ברור (שופרסל=אוכל), "low" = לא בטוח, "unknown" = לא ניתן לזהות
6. אם הדוגמאות מסיווגים קודמים רלוונטיות — עקוב אחריהן. המשתמש אישר אותן.

החזר JSON array בלבד (בלי markdown):
[{"index": 1, "categoryId": "cat_id", "subCategoryId": "sub_id_or_null", "confidence": "high|low|unknown", "reason": "optional", "isTransfer": false}]`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'אתה מומחה בסיווג עסקאות פיננסיות ישראליות. ענה תמיד ב-JSON בלבד.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || '[]';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as CategorizationResult[];
  } catch (parseError) {
    console.error(`AI batch parse error (indices ${globalStartIndex + 1}-${globalStartIndex + batch.length}). Raw response:`, content);
    throw parseError;
  }
}

export interface CategorizeResult {
  results: CategorizationResult[];
  aiError?: string;
}

export async function categorizeTransactions(
  transactions: TransactionInput[],
  categories: CategoryInfo[],
  userMappings: UserMapping[] = []
): Promise<CategorizeResult> {
  if (transactions.length === 0) return { results: [] };

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured');
    return {
      results: transactions.map((_, i) => ({
        index: i + 1,
        categoryId: null,
        subCategoryId: null,
        confidence: 'unknown' as ConfidenceLevel,
      })),
      aiError: 'מפתח OpenAI לא מוגדר בשרת. יש להגדיר OPENAI_API_KEY ולבצע redeploy.',
    };
  }

  const mappingLookup = new Map<string, UserMapping>();
  for (const m of userMappings) {
    mappingLookup.set(normalizeDesc(m.description), m);
  }

  const cachedResults: CategorizationResult[] = [];
  const uncachedTransactions: { original: TransactionInput; originalIndex: number }[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const key = normalizeDesc(transactions[i].description);
    const cached = mappingLookup.get(key);
    if (cached) {
      const isSubCategory = cached.parentCategoryId !== null;
      cachedResults.push({
        index: i + 1,
        categoryId: isSubCategory ? cached.parentCategoryId : cached.categoryId,
        subCategoryId: isSubCategory ? cached.categoryId : null,
        confidence: 'high',
        reason: 'מיפוי מייבוא קודם',
      });
    } else {
      uncachedTransactions.push({ original: transactions[i], originalIndex: i });
    }
  }

  console.log(`AI categorization: ${transactions.length} total, ${cachedResults.length} cached, ${uncachedTransactions.length} need AI`);

  if (uncachedTransactions.length === 0) {
    return { results: cachedResults.sort((a, b) => a.index - b.index) };
  }

  const batches: { batch: TransactionInput[]; indices: number[] }[] = [];
  for (let i = 0; i < uncachedTransactions.length; i += BATCH_SIZE) {
    const slice = uncachedTransactions.slice(i, i + BATCH_SIZE);
    batches.push({
      batch: slice.map(s => s.original),
      indices: slice.map(s => s.originalIndex),
    });
  }

  console.log(`Sending ${uncachedTransactions.length} transactions to AI in ${batches.length} batch(es)`);

  let failedBatches = 0;
  let lastError = '';

  const batchResults = await Promise.all(
    batches.map(({ batch, indices }) => {
      const globalStart = indices[0];
      return categorizeBatch(batch, globalStart, categories, userMappings).then(results => {
        return results.map((r, i) => ({
          ...r,
          index: indices[i] + 1,
        }));
      }).catch(error => {
        failedBatches++;
        const msg = error instanceof Error ? error.message : String(error);
        lastError = msg;
        console.error(`Batch failed:`, msg);
        return indices.map(idx => ({
          index: idx + 1,
          categoryId: null,
          subCategoryId: null,
          confidence: 'unknown' as ConfidenceLevel,
          reason: 'שגיאה בסיווג אוטומטי',
        }));
      });
    })
  );

  const allResults = [...cachedResults, ...batchResults.flat()].sort((a, b) => a.index - b.index);
  let aiError: string | undefined;

  if (failedBatches === batches.length && batches.length > 0) {
    aiError = `סיווג אוטומטי נכשל לחלוטין: ${lastError}`;
  } else if (failedBatches > 0) {
    aiError = `סיווג אוטומטי נכשל ב-${failedBatches} מתוך ${batches.length} קבוצות`;
  }

  return { results: allResults, aiError };
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
    const response = await getOpenAI().chat.completions.create({
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

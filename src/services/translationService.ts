import { GoogleGenAI } from "@google/genai";

const EXCLUDED_PHRASES = [
  "TECHNICAL PROPOSAL",
  "COOLING WATER TREATMENT SYSTEM",
  "CHILLER WATER TREATMENT SYSTEM",
  "Chemizol Authorized Culligan Distributor",
  "Chemizol Water Solutions",
  "Chemizol Water Treatment Solutions",
  "Excellence in every drop"
];

export async function translateReportData(data: any, targetLang: 'EN' | 'VI') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return data;
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const fieldsToTranslate: any = {
    customerName: data.customerName,
    projectName: data.projectName,
    engineerName: data.engineerName,
    equipmentName: data.equipmentName,
    material: data.material,
    makeupType: data.makeupType,
    measuredBacteria: data.measuredBacteria,
    summaryTitle: data.summaryTitle,
    chillerOperatingNotes: data.chillerOperatingNotes,
    towerOperatingNotes: data.towerOperatingNotes,
    descTotalGuard: data.descTotalGuard,
    descBioGuard41: data.descBioGuard41,
    descBioGuard40: data.descBioGuard40,
    descCorroGuard: data.descCorroGuard,
    descBioGuard40Chiller: data.descBioGuard40Chiller,
    introAboutTitle: data.introAboutTitle,
    introAboutText: data.introAboutText,
    introCoolingFocusTitle: data.introCoolingFocusTitle,
    introCoolingFocusText: data.introCoolingFocusText,
    introScaleTitle: data.introScaleTitle,
    introScaleDesc: data.introScaleDesc,
    introCorrosionTitle: data.introCorrosionTitle,
    introCorrosionDesc: data.introCorrosionDesc,
    introFoulingTitle: data.introFoulingTitle,
    introFoulingDesc: data.introFoulingDesc,
    introMicrobioTitle: data.introMicrobioTitle,
    introMicrobioDesc: data.introMicrobioDesc,
    towerRecommendations: data.towerRecommendations,
    chillerRecommendations: data.chillerRecommendations,
    consumptionCooling: data.consumptionCooling?.map((s: any) => ({ name: s.name })),
    consumptionChiller: data.consumptionChiller?.map((s: any) => ({ name: s.name })),
  };

  // Filter out empty fields to save tokens and avoid errors
  const filteredFields: any = {};
  Object.keys(fieldsToTranslate).forEach(key => {
    const val = fieldsToTranslate[key];
    if (val && (Array.isArray(val) ? val.length > 0 : (typeof val === 'string' ? val.trim() !== '' : true))) {
      filteredFields[key] = val;
    }
  });

  if (Object.keys(filteredFields).length === 0) return data;

  const prompt = `Translate the following technical report data to ${targetLang === 'EN' ? 'English' : 'Vietnamese'}.
  
  CRITICAL RULES:
  1. DO NOT translate the following phrases, keep them exactly as they are:
  ${EXCLUDED_PHRASES.map(p => `- "${p}"`).join('\n')}
  2. Maintain technical accuracy for water treatment terminology.
  3. Return the result in the exact same JSON structure as provided.
  4. If a field is already in the target language or is a proper noun that should not be translated, keep it as is.
  5. For recommendations, translate both "title" and "desc" fields.
  6. For consumptionCooling and consumptionChiller, only translate the "name" field.
  
  Data to translate:
  ${JSON.stringify(filteredFields, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return data;

    const translated = JSON.parse(text);
    
    // Merge back into data
    const newData = { ...data };
    Object.keys(translated).forEach(key => {
      if (key === 'consumptionCooling' || key === 'consumptionChiller') {
        newData[key] = data[key].map((s: any, i: number) => ({
          ...s,
          name: translated[key][i]?.name || s.name
        }));
      } else {
        (newData as any)[key] = translated[key];
      }
    });

    return newData;
  } catch (error) {
    console.error("Translation error:", error);
    return data;
  }
}
